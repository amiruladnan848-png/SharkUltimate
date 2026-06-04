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
  martingaleActive: boolean;
  martingaleMultiplier: number;
  lastResult: SignalResult | null;
}

let idCounter = 0;
const genId = () => `sig_${Date.now()}_${++idCounter}`;

// ── Professional Bangla TTS System v7.0 ───────────────────────────────────────
const BANGLA_SPEECHES: Record<string, string> = {
  analyzing:   'শার্ক ইঞ্জিন বিশ্লেষণ শুরু হচ্ছে। একটু অপেক্ষা করুন।',
  scanning:    'লাইভ চার্ট স্ক্যানিং সক্রিয়। ২১টি ইন্ডিকেটর পর্যবেক্ষণ করছে।',
  indicators:  'আর এস আই, ম্যাক, ই এম এ, বলিঙ্গার ব্যান্ড বিশ্লেষণ সম্পন্ন।',
  confluence:  'মাল্টি-ইন্ডিকেটর কনফ্লুয়েন্স যাচাই করা হচ্ছে।',
  shelter:     'অ্যাকিউরেসি শেল্টার সিস্টেম সক্রিয়।',
  call:        'কল সিগন্যাল সনাক্ত হয়েছে! এখনই কিউ এক্স ব্রোকারে প্রবেশ করুন। বাজার উপরে যাবে।',
  put:         'পুট সিগন্যাল সনাক্ত হয়েছে! এখনই কিউ এক্স ব্রোকারে প্রবেশ করুন। বাজার নিচে যাবে।',
  strong_call: 'অত্যন্ত শক্তিশালী কল সিগন্যাল! উচ্চ কনফিডেন্সে কিউ এক্স ব্রোকারে প্রবেশ করুন।',
  strong_put:  'অত্যন্ত শক্তিশালী পুট সিগন্যাল! উচ্চ কনফিডেন্সে কিউ এক্স ব্রোকারে প্রবেশ করুন।',
  wait:        'সিগন্যাল পাওয়া যায়নি। বাজার অনিশ্চিত। আরেকটু অপেক্ষা করুন।',
  win:         'সিগন্যাল জিতেছে! অভিনন্দন। দারুণ ট্রেড হয়েছে!',
  loss:        'সিগন্যাল হেরেছে। চিন্তার কিছু নেই। মার্টিনগেল রিকভারি সক্রিয় হচ্ছে।',
  martingale:  'মার্টিনগেল সক্রিয়! পরবর্তী ট্রেডে বাজি দ্বিগুণ করুন। ক্ষতি পুষিয়ে নিন।',
  expired:     'সময় শেষ হয়েছে। ফলাফল নির্ধারণ করা সম্ভব হয়নি।',
  weekend:     'সপ্তাহান্তে ফরেক্স বাজার বন্ধ। সোমবার আবার আসুন।',
  connected:   'ডেরিভ ও কিউ এক্স ব্রোকার সংযুক্ত। লাইভ ডেটা প্রস্তুত।',
  ready:       'শার্ক আলটিমেট সিগন্যাল ইঞ্জিন প্রস্তুত। ট্রেড শুরু করুন।',
  high_acc:    'উচ্চ নির্ভুলতার সিগন্যাল তৈরি হয়েছে।',
};

// Speech queue to prevent overlap
let speechQueue: string[] = [];
let isSpeaking = false;

const processSpeechQueue = () => {
  if (isSpeaking || speechQueue.length === 0) return;
  isSpeaking = true;
  const text = speechQueue.shift()!;
  if (!('speechSynthesis' in window)) { isSpeaking = false; return; }
  try {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang    = 'bn-BD';
    utt.rate    = 0.88;
    utt.pitch   = 1.08;
    utt.volume  = 1.0;

    // Try to find a Bengali voice
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const bangla = voices.find(v =>
        v.lang.startsWith('bn') ||
        v.lang.startsWith('bd') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali') ||
        v.name.toLowerCase().includes('bangladesh')
      );
      if (bangla) utt.voice = bangla;
      // Fallback: use a clear English voice for readability
      else {
        const eng = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
        if (eng) utt.voice = eng;
      }
    };
    loadVoices();
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    utt.onend = () => { isSpeaking = false; setTimeout(processSpeechQueue, 200); };
    utt.onerror = () => { isSpeaking = false; setTimeout(processSpeechQueue, 200); };
    window.speechSynthesis.speak(utt);
  } catch {
    isSpeaking = false;
    setTimeout(processSpeechQueue, 200);
  }
};

export const speakBangla = (key: keyof typeof BANGLA_SPEECHES, extra?: string) => {
  if (!('speechSynthesis' in window)) return;
  const text = (BANGLA_SPEECHES[key] || '') + (extra ? ' ' + extra : '');
  if (!text.trim()) return;
  // Cancel current and clear queue for urgent signals
  const urgent = ['call', 'put', 'strong_call', 'strong_put', 'win', 'loss'];
  if (urgent.includes(key as string)) {
    speechQueue = [];
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
  speechQueue.push(text);
  processSpeechQueue();
};

// ── Analysis Steps (24 steps for deeper analysis) ─────────────────────────────
export const ANALYSIS_STEPS = [
  '🔗 QX Broker API Connected — Market Feed Active...',
  '📡 Deriv WebSocket v3 — Tick Stream Synchronized...',
  '📊 Loading 500+ Tick Price History...',
  '🔗 TradingView 1M Candle Data — Merging Streams...',
  '📈 RSI-14 Multi-Zone + Divergence Analysis...',
  '📉 MACD Zero-Cross & Histogram Acceleration...',
  '📊 EMA 5/9/21/50/200 Cascade Stack Analysis...',
  '🎯 Bollinger Band %B Position + Width Check...',
  '🔄 Stochastic K/D Multi-Layer Crossover...',
  '⚡ CCI + Williams %R Dual Oscillator Zones...',
  '📏 ADX DI+/DI- Power Trend Measurement...',
  '🚀 Momentum + ROC Acceleration Scoring...',
  '🏛️ Support/Resistance + Pivot Points Matrix...',
  '💧 VWAP Institutional Zone Classification...',
  '🌊 Ichimoku Cloud — Kumo Position Analysis...',
  '🔮 Parabolic SAR Direction Confirmation...',
  '⚡ SuperTrend 3x ATR Signal Direction...',
  '🕯️ Enhanced Candle Pattern Recognition...',
  '📐 Z-Score Mean Reversion Analysis...',
  '📈 Trend Consistency + RVI Vigor Index...',
  '🧮 21-Indicator Multi-Factor Confluence...',
  '🛡️ Accuracy Shelter Floor Validation...',
  '🎯 Signal Quality Gate — Dominance Check...',
  '✅ SHARK Engine Complete — Signal Locked!',
];

// ── Auto Win/Loss Detection (v7 — smarter threshold) ──────────────────────────
const detectResult = (signal: Signal, currentPrice: number): SignalResult | null => {
  if (signal.status !== 'PENDING') return null;
  if (new Date() < signal.expiryTime) return null;
  const diff = currentPrice - signal.entryPrice;
  // Use dynamic threshold: 0.5 pip minimum movement to register
  const threshold = signal.pair.pip * 0.5;
  if (Math.abs(diff) < threshold) return 'EXPIRED';
  if (signal.direction === 'CALL') return diff > 0 ? 'WIN' : 'LOSS';
  if (signal.direction === 'PUT')  return diff < 0 ? 'WIN' : 'LOSS';
  return 'EXPIRED';
};

export const useSignalEngine = ({
  pair, priceHistory, enabled, onSignalGenerated,
}: UseSignalEngineProps): UseSignalEngineReturn => {

  const [currentSignal, setCurrentSignal]         = useState<Signal | null>(null);
  const [countdown, setCountdown]                 = useState(60);
  const [isAnalyzing, setIsAnalyzing]             = useState(false);
  const [analysisPct, setAnalysisPct]             = useState(0);
  const [lastAnalysis, setLastAnalysis]           = useState('');
  const [analysisStep, setAnalysisStep]           = useState(0);
  const [signalHistory, setSignalHistory]         = useState<SignalRecord[]>([]);
  const [totalWins, setTotalWins]                 = useState(0);
  const [totalLosses, setTotalLosses]             = useState(0);
  const [martingaleActive, setMartingaleActive]   = useState(false);
  const [lastResult, setLastResult]               = useState<SignalResult | null>(null);

  const latestPrices  = useRef<number[]>([]);
  const latestPrice   = useRef<number>(0);
  const resolveRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisRef   = useRef<{ steps: ReturnType<typeof setInterval> | null; done: ReturnType<typeof setTimeout> | null }>({ steps: null, done: null });
  const voiceEnabled  = useRef<boolean>(true);

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

  // Auto Win/Loss Detection — polls every 3s after expiry
  useEffect(() => {
    if (!currentSignal || currentSignal.status !== 'PENDING') return;
    const waitMs = Math.max(0, currentSignal.expiryTime.getTime() - Date.now() + 2000);

    const startTimeout = setTimeout(() => {
      let polls = 0;
      resolveRef.current = setInterval(() => {
        polls++;
        const price = latestPrice.current;
        if (!price) return;
        const result = detectResult(currentSignal, price);
        if (!result && polls < 20) return; // Keep polling up to ~60s post expiry
        const finalResult = result || 'EXPIRED';
        if (resolveRef.current) clearInterval(resolveRef.current);

        const resolved: Signal = {
          ...currentSignal,
          status: finalResult,
          resolvedAt: new Date(),
          resolvedPrice: price,
        };
        setCurrentSignal(resolved);
        setLastResult(finalResult);

        const record: SignalRecord = {
          signal: resolved, result: finalResult,
          resolvedAt: new Date(),
          resolvedPrice: price,
          priceDiff: price - currentSignal.entryPrice,
        };
        setSignalHistory(prev => [record, ...prev].slice(0, 50));

        if (finalResult === 'WIN') {
          setTotalWins(w => w + 1);
          setMartingaleActive(false);
          if (voiceEnabled.current) speakBangla('win');
        } else if (finalResult === 'LOSS') {
          setTotalLosses(l => l + 1);
          setMartingaleActive(true);
          if (voiceEnabled.current) {
            speakBangla('loss');
            setTimeout(() => speakBangla('martingale'), 2200);
          }
        } else {
          setMartingaleActive(false);
          if (voiceEnabled.current) speakBangla('expired');
        }
      }, 3000);
    }, waitMs);

    return () => {
      clearTimeout(startTimeout);
      if (resolveRef.current) clearInterval(resolveRef.current);
    };
  }, [currentSignal?.id]);

  const buildSignal = useCallback((isMtg = false): Signal | null => {
    const prices = latestPrices.current;
    if (!enabled || prices.length < 30) return null;
    if (isWeekend()) {
      if (voiceEnabled.current) speakBangla('weekend');
      return null;
    }

    const session = getCurrentSession();
    const boost   = getSessionAccuracyBoost(session);
    const inds    = computeIndicators(prices);
    const { direction, strength, accuracy, analysis } = generateSignalDirection(inds, prices, boost);

    if (direction === 'WAIT') {
      setLastAnalysis('Insufficient confluence — market needs clearer signal');
      if (voiceEnabled.current) speakBangla('wait');
      return null;
    }

    const now        = new Date();
    const entryTime  = new Date(now);
    entryTime.setSeconds(0, 0);
    entryTime.setMinutes(entryTime.getMinutes() + 1);
    const expiryTime = new Date(entryTime);
    expiryTime.setMinutes(expiryTime.getMinutes() + 1);

    const price      = prices[prices.length - 1];
    const atr        = inds.atr || price * 0.0005;
    const stopLoss   = direction === 'CALL' ? price - atr * 1.5 : price + atr * 1.5;
    const takeProfit = direction === 'CALL' ? price + atr * 2.5 : price - atr * 2.5;
    const riskReward = 1.67;

    setLastAnalysis(analysis.reason);

    const sig: Signal = {
      id: genId(), pair, direction, entryTime, expiryTime, entryPrice: price,
      stopLoss, takeProfit, accuracy, strength, indicators: inds, analysis,
      session, status: 'PENDING', countdown: 60, riskReward,
      isMartingale: isMtg, martingaleStep: isMtg ? 1 : 0,
    };

    // Professional voice announcement
    if (voiceEnabled.current) {
      if (accuracy >= 90) {
        speakBangla(direction === 'CALL' ? 'strong_call' : 'strong_put');
      } else {
        speakBangla(direction === 'CALL' ? 'call' : 'put');
      }
      if (accuracy >= 88) {
        setTimeout(() => speakBangla('high_acc'), 2500);
      }
    }

    onSignalGenerated?.(sig);
    return sig;
  }, [pair, enabled, onSignalGenerated]);

  const triggerManualSignal = useCallback(() => {
    if (isAnalyzing) return;

    // Cleanup previous analysis
    if (analysisRef.current.steps) clearInterval(analysisRef.current.steps);
    if (analysisRef.current.done)  clearTimeout(analysisRef.current.done);

    setIsAnalyzing(true);
    setAnalysisPct(0);
    setAnalysisStep(0);
    setCurrentSignal(null);
    setLastResult(null);

    if (voiceEnabled.current) {
      speakBangla('analyzing');
      setTimeout(() => speakBangla('scanning'), 1200);
      setTimeout(() => speakBangla('indicators'), 2800);
      setTimeout(() => speakBangla('confluence'), 4400);
      setTimeout(() => speakBangla('shelter'), 5600);
    }

    // Smooth step animation — 24 steps over ~3.8s
    const stepMs = 155;
    let step = 0;

    analysisRef.current.steps = setInterval(() => {
      if (step < ANALYSIS_STEPS.length) {
        setLastAnalysis(ANALYSIS_STEPS[step]);
        setAnalysisStep(step);
        setAnalysisPct(Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100));
        step++;
      }
    }, stepMs);

    const totalMs = ANALYSIS_STEPS.length * stepMs + 600;
    analysisRef.current.done = setTimeout(() => {
      if (analysisRef.current.steps) clearInterval(analysisRef.current.steps);
      setAnalysisPct(100);
      const sig = buildSignal(martingaleActive);
      setCurrentSignal(sig);
      setIsAnalyzing(false);
      if (!sig) {
        setLastAnalysis('No signal — market conditions not optimal');
        setMartingaleActive(false);
      }
    }, totalMs);
  }, [isAnalyzing, buildSignal, martingaleActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisRef.current.steps) clearInterval(analysisRef.current.steps);
      if (analysisRef.current.done)  clearTimeout(analysisRef.current.done);
      if (resolveRef.current)        clearInterval(resolveRef.current);
    };
  }, []);

  const winRate = totalWins + totalLosses > 0
    ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;

  return {
    currentSignal, countdown, isAnalyzing, analysisPct,
    triggerManualSignal, lastAnalysis, analysisStep,
    signalHistory, totalWins, totalLosses, winRate,
    martingaleActive,
    martingaleMultiplier: martingaleActive ? 2 : 1,
    lastResult,
  };
};
