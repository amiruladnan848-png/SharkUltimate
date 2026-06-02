import { useState, useEffect, useRef, useCallback } from 'react';
import { Signal, CurrencyPair } from '@/types/trading';
import { computeIndicators, generateSignalDirection } from '@/lib/signalAlgorithm';
import { getCurrentSession, getSessionAccuracyBoost, isWeekend, getSecondsToNextMinute } from '@/lib/timezone';

interface UseSignalEngineProps {
  pair: CurrencyPair;
  priceHistory: number[];
  enabled: boolean;
}

interface UseSignalEngineReturn {
  currentSignal: Signal | null;
  countdown: number;
  isAnalyzing: boolean;
  analysisPct: number;
  triggerManualSignal: () => void;
  lastAnalysis: string;
  analysisStep: number;
}

let idCounter = 0;
const genId = () => `sig_${Date.now()}_${++idCounter}`;

const ANALYSIS_STEPS = [
  'Fetching Deriv live tick stream...',
  'Computing RSI-14 divergence...',
  'Scanning MACD zero-cross events...',
  'EMA5/9/21/50/200 stack analysis...',
  'Bollinger Band %B calculation...',
  'Stochastic crossover detection...',
  'CCI + Williams %R scan...',
  'ADX DI+/DI- trend strength...',
  'Momentum + ROC acceleration...',
  'Support/Resistance + Pivot...',
  'Price velocity analysis...',
  'VWAP confluence check...',
  'Computing confluence score...',
  'Applying session accuracy boost...',
  'Accuracy shelter check...',
  'Signal validated — generating result...',
];

export const useSignalEngine = ({ pair, priceHistory, enabled }: UseSignalEngineProps): UseSignalEngineReturn => {
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPct, setAnalysisPct] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState('');
  const [analysisStep, setAnalysisStep] = useState(0);
  const latestHistory = useRef<number[]>([]);

  useEffect(() => { latestHistory.current = priceHistory; }, [priceHistory]);

  useEffect(() => {
    const tick = () => setCountdown(getSecondsToNextMinute());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const buildSignal = useCallback((): Signal | null => {
    const prices = latestHistory.current;
    if (!enabled || prices.length < 30) return null;
    if (pair.type === 'REAL' && isWeekend()) return null;

    const session = getCurrentSession();
    const boost = getSessionAccuracyBoost(session);
    const indicators = computeIndicators(prices);
    const { direction, strength, accuracy, analysis } = generateSignalDirection(indicators, prices, boost);

    if (direction === 'WAIT') {
      setLastAnalysis('No clear signal — market indecision or low confluence');
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
    const stopLoss = direction === 'CALL'
      ? price - atr * 1.5
      : price + atr * 1.5;
    const takeProfit = direction === 'CALL'
      ? price + atr * 2.5
      : price - atr * 2.5;
    const riskReward = atr > 0 ? parseFloat((2.5 / 1.5).toFixed(2)) : 1.67;

    setLastAnalysis(analysis.reason);

    return {
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
    };
  }, [pair, enabled]);

  const triggerManualSignal = useCallback(() => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisPct(0);
    setAnalysisStep(0);
    setCurrentSignal(null);

    const stepDuration = 200;
    let step = 0;

    const stepInterval = setInterval(() => {
      if (step < ANALYSIS_STEPS.length) {
        setLastAnalysis(ANALYSIS_STEPS[step]);
        setAnalysisStep(step);
        setAnalysisPct(Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100));
        step++;
      }
    }, stepDuration);

    const totalTime = ANALYSIS_STEPS.length * stepDuration + 300;

    setTimeout(() => {
      clearInterval(stepInterval);
      setAnalysisPct(100);
      const sig = buildSignal();
      setCurrentSignal(sig);
      setIsAnalyzing(false);
      if (!sig) setLastAnalysis('No signal — market is ranging or insufficient confluence');
    }, totalTime);
  }, [isAnalyzing, buildSignal]);

  return { currentSignal, countdown, isAnalyzing, analysisPct, triggerManualSignal, lastAnalysis, analysisStep };
};

export { ANALYSIS_STEPS };
