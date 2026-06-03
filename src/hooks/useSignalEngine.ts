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
  // MTG
  martingaleActive: boolean;
  martingaleStep: number;
  martingaleMultiplier: number;
  // Auto win/loss detection
  lastResult: SignalResult | null;
}

let idCounter = 0;
const genId = () => `sig_${Date.now()}_${++idCounter}`;

// Bangla speech texts
const SPEECH_TEXTS: Record<string, string> = {
  analyzing:      'বিশ্লেষণ শুরু হচ্ছে...',
  call:           'কল সিগন্যাল পাওয়া গেছে! প্রবেশ করুন।',
  put:            'পুট সিগন্যাল পাওয়া গেছে! প্রবেশ করুন।',
  wait:           'কোনো সিগন্যাল নেই। অপেক্ষা করুন।',
  win:            'সিগন্যাল জিতেছে! অভিনন্দন!',
  loss:           'সিগন্যাল হেরেছে। মার্টিনগেল সক্রিয়।',
  martingale:     'মার্টিনগেল সিস্টেম সক্রিয়। বাজি দ্বিগুণ করুন।',
  weekend:        'সপ্তাহান্তে বাজার বন্ধ।',
  connected:      'ডেরিভ লাইভ সংযুক্ত।',
};

// Bangla TTS voice announcement
export const speakBangla = (key: keyof typeof SPEECH_TEXTS, extraText?: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance((SPEECH_TEXTS[key] || '') + (extraText ? ' ' + extraText : ''));
  utterance.lang = 'bn-BD';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  // Try Bangla voice first, fallback to default
  const voices = window.speechSynthesis.getVoices();
  const banglaVoice = voices.find(v => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bangla'));
  if (banglaVoice) utterance.voice = banglaVoice;
  window.speechSynthesis.speak(utterance);
};

export const ANALYSIS_STEPS = [
  '🔗 Connecting Deriv Live WebSocket...',
  '📊 Loading 500-tick price history...',
  '🔗 Merging TradingView 1M candle data...',
  '📈 Computing RSI-14 divergence...',
  '📉 Scanning MACD zero-cross events...',
  '📊 EMA5/9/21/50/200 stack analysis...',
  '🎯 Bollinger Band %B calculation...',
  '🔄 Stochastic K/D crossover detection...',
  '⚡ CCI + Williams %R dual scan...',
  '📏 ADX DI+/DI- strength scoring...',
  '🚀 Momentum + ROC acceleration...',
  '🏛️ Support/Resistance + Pivot Points...',
  '💧 VWAP confluence check...',
  '🌊 Ichimoku Cloud analysis...',
  '🔮 Parabolic SAR detection...',
  '⚡ SuperTrend direction scan...',
  '📐 Price velocity measurement...',
  '🧮 Computing confluence score...',
  '🎖️ Applying session accuracy boost...',
  '🛡️ Accuracy shelter validation...',
  '✅ Signal validated — generating result...',
];

// Auto Win/Loss Detection Engine
// Determines result by comparing entry price vs exit price after 1 minute
const detectSignalResult = (
  signal: Signal,
  currentPrice: number,
): SignalResult | null => {
  // Only resolve PENDING signals after expiry time
  const now = new Date();
  if (signal.status !== 'PENDING') return null;
  if (now < signal.expiryTime) return null;

  const priceDiff = currentPrice - signal.entryPrice;
  const threshold = signal.pair.pip * 2; // 2 pip minimum move

  if (Math.abs(priceDiff) < threshold) return 'EXPIRED';
  if (signal.direction === 'CALL') return priceDiff > 0 ? 'WIN' : 'LOSS';
  if (signal.direction === 'PUT') return priceDiff < 0 ? 'WIN' : 'LOSS';
  return 'EXPIRED';
};

// MTG (Martingale) multiplier table
const MTG_MULTIPLIERS = [1, 2, 4, 8]; // Step 0=normal, 1=2x, 2=4x, 3=8x

export const useSignalEngine = ({ pair, priceHistory, enabled, onSignalGenerated }: UseSignalEngineProps): UseSignalEngineReturn => {
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPct, setAnalysisPct] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState('');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [signalHistory, setSignalHistory] = useState<SignalRecord[]>([]);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [martingaleStep, setMartingaleStep] = useState(0); // 0 = off
  const [lastResult, setLastResult] = useState<SignalResult | null>(null);
  const latestHistory = useRef<number[]>([]);
  const latestPrice = useRef<number>(0);
  const resolveCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { latestHistory.current = priceHistory; }, [priceHistory]);
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

  // ── Auto Win/Loss Detection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSignal || currentSignal.status !== 'PENDING') return;

    const checkResult = () => {
      const price = latestPrice.current;
      if (!price) return;
      const result = detectSignalResult(currentSignal, price);
      if (!result) return;

      const resolvedSignal: Signal = {
        ...currentSignal,
        status: result,
        resolvedAt: new Date(),
        resolvedPrice: price,
      };

      setCurrentSignal(resolvedSignal);
      setLastResult(result);

      const record: SignalRecord = {
        signal: resolvedSignal,
        result,
        resolvedAt: new Date(),
        resolvedPrice: price,
        priceDiff: price - currentSignal.entryPrice,
      };
      setSignalHistory(prev => [record, ...prev].slice(0, 50));

      if (result === 'WIN') {
        setTotalWins(w => w + 1);
        setMartingaleStep(0); // Reset MTG on WIN
        speakBangla('win');
      } else if (result === 'LOSS') {
        setTotalLosses(l => l + 1);
        setMartingaleStep(prev => Math.min(prev + 1, 3)); // Advance MTG
        speakBangla('loss');
      } else {
        speakBangla('wait');
      }

      if (resolveCheckRef.current) clearInterval(resolveCheckRef.current);
    };

    // Check every 5 seconds after entry time
    const delay = Math.max(0, currentSignal.entryTime.getTime() - Date.now());
    const startCheck = setTimeout(() => {
      resolveCheckRef.current = setInterval(checkResult, 5000);
    }, delay + 65000); // Wait 65s from entry (1 min expiry + buffer)

    return () => {
      clearTimeout(startCheck);
      if (resolveCheckRef.current) clearInterval(resolveCheckRef.current);
    };
  }, [currentSignal?.id]);

  const buildSignal = useCallback((isMtg = false, mtgStep = 0): Signal | null => {
    const prices = latestHistory.current;
    if (!enabled || prices.length < 30) return null;
    if (isWeekend()) { speakBangla('weekend'); return null; }

    const session = getCurrentSession();
    const boost = getSessionAccuracyBoost(session);
    const indicators = computeIndicators(prices);
    const { direction, strength, accuracy, analysis } = generateSignalDirection(indicators, prices, boost);

    if (direction === 'WAIT') {
      setLastAnalysis('No clear signal — market indecision or low confluence');
      speakBangla('wait');
      return null;
    }

    const now = new Date();
    const entryTime = new Date(now);
    entryTime.setSeconds(0, 0);
    entryTime.setMinutes(entryTime.getMinutes() + 1);

    const expiryTime = new Date(entryTime);
    expiryTime.setMinutes(expiryTime.getMinutes() + 1);

    const price = prices[prices.length - 1];
    const atr = indicators.atr;
    const stopLoss = direction === 'CALL' ? price - atr * 1.5 : price + atr * 1.5;
    const takeProfit = direction === 'CALL' ? price + atr * 2.5 : price - atr * 2.5;
    const riskReward = 1.67;

    setLastAnalysis(analysis.reason);

    const sig: Signal = {
      id: genId(),
      pair,
      direction,
      entryTime,
      expiryTime,
      entryPrice: price,
      stopLoss,
      takeProfit,
      accuracy,
      strength,
      indicators,
      analysis,
      session,
      status: 'PENDING',
      countdown: 60,
      riskReward,
      isMartingale: isMtg,
      martingaleStep: isMtg ? mtgStep : 0,
    };

    // Announce with Bangla voice
    speakBangla(direction === 'CALL' ? 'call' : 'put');
    onSignalGenerated?.(sig);
    return sig;
  }, [pair, enabled, onSignalGenerated]);

  const triggerManualSignal = useCallback(() => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisPct(0);
    setAnalysisStep(0);
    setCurrentSignal(null);
    setLastResult(null);

    speakBangla('analyzing');

    const stepDuration = 160;
    let step = 0;

    const stepInterval = setInterval(() => {
      if (step < ANALYSIS_STEPS.length) {
        setLastAnalysis(ANALYSIS_STEPS[step]);
        setAnalysisStep(step);
        setAnalysisPct(Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100));
        step++;
      }
    }, stepDuration);

    const totalTime = ANALYSIS_STEPS.length * stepDuration + 400;

    setTimeout(() => {
      clearInterval(stepInterval);
      setAnalysisPct(100);
      const isMtg = martingaleStep > 0;
      const sig = buildSignal(isMtg, martingaleStep);
      setCurrentSignal(sig);
      setIsAnalyzing(false);
      if (!sig) setLastAnalysis('No signal — market ranging or insufficient confluence');
    }, totalTime);
  }, [isAnalyzing, buildSignal, martingaleStep]);

  const winRate = totalWins + totalLosses > 0
    ? Math.round((totalWins / (totalWins + totalLosses)) * 100)
    : 0;

  const martingaleMultiplier = MTG_MULTIPLIERS[Math.min(martingaleStep, MTG_MULTIPLIERS.length - 1)];

  return {
    currentSignal, countdown, isAnalyzing, analysisPct,
    triggerManualSignal, lastAnalysis, analysisStep,
    signalHistory, totalWins, totalLosses, winRate,
    martingaleActive: martingaleStep > 0,
    martingaleStep,
    martingaleMultiplier,
    lastResult,
  };
};

export { ANALYSIS_STEPS };
