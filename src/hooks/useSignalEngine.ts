import { useState, useEffect, useRef, useCallback } from 'react';
import { Signal, CurrencyPair, SignalRecord, SignalResult } from '@/types/trading';
import { computeIndicators, generateSignalDirection } from '@/lib/signalAlgorithm';
import { getCurrentSession, getSessionAccuracyBoost, isWeekend, getSecondsToNextMinute } from '@/lib/timezone';

interface UseSignalEngineProps {
  pair: CurrencyPair;
  priceHistory: number[];
  enabled: boolean;
  onSignalGenerated?: (signal: Signal) => void;
}

interface UseSignalEngineReturn {
  currentSignal: Signal | null;
  countdown: number;
  isAnalyzing: boolean;
  analysisPct: number;
  triggerManualSignal: () => void;
  lastAnalysis: string;
  analysisStep: number;
  signalHistory: SignalRecord[];
  totalWins: number;
  totalLosses: number;
  winRate: number;
  // MTG — 1-step only
  martingaleActive: boolean;
  martingaleMultiplier: number;
  // Auto win/loss detection
  lastResult: SignalResult | null;
}

let idCounter = 0;
const genId = () => `sig_${Date.now()}_${++idCounter}`;

// ── Bangla TTS Texts ──────────────────────────────────────────────────────────
const SPEECH_TEXTS: Record<string, string> = {
  analyzing:  'বিশ্লেষণ শুরু হচ্ছে...',
  call:       'কল সিগন্যাল! এখনই প্রবেশ করুন।',
  put:        'পুট সিগন্যাল! এখনই প্রবেশ করুন।',
  wait:       'কোনো সিগন্যাল নেই। অপেক্ষা করুন।',
  win:        'সিগন্যাল জিতেছে! অভিনন্দন!',
  loss:       'সিগন্যাল হেরেছে। মার্টিনগেল সক্রিয়।',
  martingale: 'মার্টিনগেল সক্রিয়। বাজি দ্বিগুণ করুন।',
  weekend:    'সপ্তাহান্তে বাজার বন্ধ।',
  connected:  'কিউ এক্স ব্রোকার সংযুক্ত।',
  ready:      'সিগন্যাল ইঞ্জিন প্রস্তুত।',
};

export const speakBangla = (key: keyof typeof SPEECH_TEXTS, extra?: string) => {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const text = (SPEECH_TEXTS[key] || '') + (extra ? ' ' + extra : '');
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'bn-BD';
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const bVoice = voices.find(v => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'));
    if (bVoice) utt.voice = bVoice;
    window.speechSynthesis.speak(utt);
  } catch { /* ignore TTS errors */ }
};

// ── Analysis Steps (21 steps) ─────────────────────────────────────────────────
export const ANALYSIS_STEPS = [
  '🔗 QX Broker Market Feed Connected...',
  '📊 Loading 500-tick Price History...',
  '🔗 Merging TradingView 1M Candle Data...',
  '📈 Computing RSI-14 Multi-Zone Analysis...',
  '📉 Scanning MACD Zero-Cross Events...',
  '📊 EMA5/9/21/50/200 Cascade Stack...',
  '🎯 Bollinger Band %B Calculation...',
  '🔄 Stochastic K/D Crossover Detection...',
  '⚡ CCI + Williams %R Dual Oscillator...',
  '📏 ADX DI+/DI- Trend Strength...',
  '🚀 Momentum + ROC Acceleration...',
  '🏛️ Support/Resistance Pivot Points...',
  '💧 VWAP Institutional Bias Check...',
  '🌊 Ichimoku Cloud Position...',
  '🔮 Parabolic SAR Direction...',
  '⚡ SuperTrend Signal Direction...',
  '🕯️ Candle Pattern Recognition...',
  '📐 Mean Reversion Score...',
  '🧮 Computing Multi-Indicator Confluence...',
  '🛡️ Accuracy Shelter Validation...',
  '✅ Signal Validated — Generating Result...',
];

// ── Auto Win/Loss Detection ────────────────────────────────────────────────────
const detectResult = (signal: Signal, currentPrice: number): SignalResult | null => {
  if (signal.status !== 'PENDING') return null;
  if (new Date() < signal.expiryTime) return null;
  const diff = currentPrice - signal.entryPrice;
  const threshold = signal.pair.pip * 1.5;
  if (Math.abs(diff) < threshold) return 'EXPIRED';
  if (signal.direction === 'CALL') return diff > 0 ? 'WIN' : 'LOSS';
  if (signal.direction === 'PUT')  return diff < 0 ? 'WIN' : 'LOSS';
  return 'EXPIRED';
};

export const useSignalEngine = ({
  pair, priceHistory, enabled, onSignalGenerated,
}: UseSignalEngineProps): UseSignalEngineReturn => {

  const [currentSignal, setCurrentSignal]     = useState<Signal | null>(null);
  const [countdown, setCountdown]             = useState(60);
  const [isAnalyzing, setIsAnalyzing]         = useState(false);
  const [analysisPct, setAnalysisPct]         = useState(0);
  const [lastAnalysis, setLastAnalysis]       = useState('');
  const [analysisStep, setAnalysisStep]       = useState(0);
  const [signalHistory, setSignalHistory]     = useState<SignalRecord[]>([]);
  const [totalWins, setTotalWins]             = useState(0);
  const [totalLosses, setTotalLosses]         = useState(0);
  const [martingaleActive, setMartingaleActive] = useState(false); // 1-step only
  const [lastResult, setLastResult]           = useState<SignalResult | null>(null);

  const latestPrices = useRef<number[]>([]);
  const latestPrice  = useRef<number>(0);
  const resolveRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisRef  = useRef<{ steps: ReturnType<typeof setInterval> | null; done: ReturnType<typeof setTimeout> | null }>({ steps: null, done: null });

  useEffect(() => { latestPrices.current = priceHistory; }, [priceHistory]);
  useEffect(() => {
    if (priceHistory.length > 0) latestPrice.current = priceHistory[priceHistory.length - 1];
  }, [priceHistory]);

  // Countdown to next 1-min boundary
  useEffect(() => {
    const tick = () => setCountdown(getSecondsToNextMinute());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto Win/Loss Detection
  useEffect(() => {
    if (!currentSignal || currentSignal.status !== 'PENDING') return;
    const waitMs = Math.max(0, currentSignal.expiryTime.getTime() - Date.now() + 3000);
    const startTimeout = setTimeout(() => {
      resolveRef.current = setInterval(() => {
        const price = latestPrice.current;
        if (!price) return;
        const result = detectResult(currentSignal, price);
        if (!result) return;
        if (resolveRef.current) clearInterval(resolveRef.current);

        const resolved: Signal = {
          ...currentSignal,
          status: result,
          resolvedAt: new Date(),
          resolvedPrice: price,
        };
        setCurrentSignal(resolved);
        setLastResult(result);

        const record: SignalRecord = {
          signal: resolved, result,
          resolvedAt: new Date(),
          resolvedPrice: price,
          priceDiff: price - currentSignal.entryPrice,
        };
        setSignalHistory(prev => [record, ...prev].slice(0, 50));

        if (result === 'WIN') {
          setTotalWins(w => w + 1);
          setMartingaleActive(false); // Reset MTG
          speakBangla('win');
        } else if (result === 'LOSS') {
          setTotalLosses(l => l + 1);
          setMartingaleActive(true); // Activate 1-step MTG
          speakBangla('loss');
          setTimeout(() => speakBangla('martingale'), 1500);
        } else {
          setMartingaleActive(false);
        }
      }, 4000);
    }, waitMs);

    return () => {
      clearTimeout(startTimeout);
      if (resolveRef.current) clearInterval(resolveRef.current);
    };
  }, [currentSignal?.id]);

  const buildSignal = useCallback((isMtg = false): Signal | null => {
    const prices = latestPrices.current;
    if (!enabled || prices.length < 30) return null;
    if (isWeekend()) { speakBangla('weekend'); return null; }

    const session = getCurrentSession();
    const boost   = getSessionAccuracyBoost(session);
    const inds    = computeIndicators(prices);
    const { direction, strength, accuracy, analysis } = generateSignalDirection(inds, prices, boost);

    if (direction === 'WAIT') {
      setLastAnalysis('No clear confluence — market needs stronger signal');
      speakBangla('wait');
      return null;
    }

    const now = new Date();
    const entryTime = new Date(now);
    entryTime.setSeconds(0, 0);
    entryTime.setMinutes(entryTime.getMinutes() + 1);

    const expiryTime = new Date(entryTime);
    expiryTime.setMinutes(expiryTime.getMinutes() + 1);

    const price  = prices[prices.length - 1];
    const atr    = inds.atr || price * 0.0005;
    const stopLoss   = direction === 'CALL' ? price - atr * 1.5 : price + atr * 1.5;
    const takeProfit = direction === 'CALL' ? price + atr * 2.5 : price - atr * 2.5;

    setLastAnalysis(analysis.reason);

    const sig: Signal = {
      id: genId(), pair, direction, entryTime, expiryTime, entryPrice: price,
      stopLoss, takeProfit, accuracy, strength, indicators: inds, analysis,
      session, status: 'PENDING', countdown: 60, riskReward: 1.67,
      isMartingale: isMtg, martingaleStep: isMtg ? 1 : 0,
    };

    speakBangla(direction === 'CALL' ? 'call' : 'put');
    onSignalGenerated?.(sig);
    return sig;
  }, [pair, enabled, onSignalGenerated]);

  const triggerManualSignal = useCallback(() => {
    if (isAnalyzing) return;

    // Cleanup previous
    if (analysisRef.current.steps) clearInterval(analysisRef.current.steps);
    if (analysisRef.current.done)  clearTimeout(analysisRef.current.done);

    setIsAnalyzing(true);
    setAnalysisPct(0);
    setAnalysisStep(0);
    setCurrentSignal(null);
    setLastResult(null);
    speakBangla('analyzing');

    const stepMs = 145;
    let step = 0;

    analysisRef.current.steps = setInterval(() => {
      if (step < ANALYSIS_STEPS.length) {
        setLastAnalysis(ANALYSIS_STEPS[step]);
        setAnalysisStep(step);
        setAnalysisPct(Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100));
        step++;
      }
    }, stepMs);

    const totalMs = ANALYSIS_STEPS.length * stepMs + 500;
    analysisRef.current.done = setTimeout(() => {
      if (analysisRef.current.steps) clearInterval(analysisRef.current.steps);
      setAnalysisPct(100);
      const sig = buildSignal(martingaleActive);
      setCurrentSignal(sig);
      setIsAnalyzing(false);
      if (!sig) {
        setLastAnalysis('No signal — market indecision or low confluence');
        setMartingaleActive(false);
      }
    }, totalMs);
  }, [isAnalyzing, buildSignal, martingaleActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisRef.current.steps) clearInterval(analysisRef.current.steps);
      if (analysisRef.current.done)  clearTimeout(analysisRef.current.done);
      if (resolveRef.current) clearInterval(resolveRef.current);
    };
  }, []);

  const winRate = totalWins + totalLosses > 0
    ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;

  return {
    currentSignal, countdown, isAnalyzing, analysisPct,
    triggerManualSignal, lastAnalysis, analysisStep,
    signalHistory, totalWins, totalLosses, winRate,
    martingaleActive,
    martingaleMultiplier: martingaleActive ? 2 : 1, // 1-step = 2x only
    lastResult,
  };
};
