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
  triggerManualSignal: () => void;
  lastAnalysis: string;
}

let idCounter = 0;
const genId = () => `sig_${Date.now()}_${++idCounter}`;

export const useSignalEngine = ({ pair, priceHistory, enabled }: UseSignalEngineProps): UseSignalEngineReturn => {
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState('');
  const lastPriceHistory = useRef<number[]>([]);

  // Keep ref to latest priceHistory to avoid stale closure
  useEffect(() => {
    lastPriceHistory.current = priceHistory;
  }, [priceHistory]);

  // Live countdown to next minute
  useEffect(() => {
    const tick = () => setCountdown(getSecondsToNextMinute());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const buildSignal = useCallback((): Signal | null => {
    const prices = lastPriceHistory.current;
    if (!enabled || prices.length < 30) return null;
    if (pair.type === 'REAL' && isWeekend()) return null;

    const session = getCurrentSession();
    const boost = getSessionAccuracyBoost(session);
    const indicators = computeIndicators(prices);
    const { direction, strength, accuracy, analysis } = generateSignalDirection(indicators, prices, boost);

    if (direction === 'WAIT') {
      setLastAnalysis('No clear signal — market is ranging or conflicted');
      return null;
    }

    const now = new Date();
    const entryTime = new Date(now);
    entryTime.setSeconds(0, 0);
    entryTime.setMinutes(entryTime.getMinutes() + 1);

    const expiryTime = new Date(entryTime);
    expiryTime.setMinutes(expiryTime.getMinutes() + 1);

    setLastAnalysis(analysis.reason);

    return {
      id: genId(),
      pair,
      direction,
      entryTime,
      expiryTime,
      entryPrice: prices[prices.length - 1],
      accuracy,
      strength,
      indicators,
      analysis,
      session,
      status: 'PENDING',
      countdown: 60,
    };
  }, [pair, enabled]);

  const triggerManualSignal = useCallback(() => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setCurrentSignal(null);

    // Simulate deep analysis delay for UX
    const steps = ['Fetching live ticks...', 'Computing RSI/MACD...', 'Scanning EMA crossovers...', 'Checking Bollinger Bands...', 'Stochastic + CCI analysis...', 'Calculating confluence score...', 'Generating signal...'];
    let step = 0;
    const stepTimer = setInterval(() => {
      if (step < steps.length) {
        setLastAnalysis(steps[step]);
        step++;
      }
    }, 220);

    setTimeout(() => {
      clearInterval(stepTimer);
      const sig = buildSignal();
      setCurrentSignal(sig);
      setIsAnalyzing(false);
      if (!sig) setLastAnalysis('No signal — market is ranging or insufficient data');
    }, steps.length * 220 + 200);
  }, [isAnalyzing, buildSignal]);

  return { currentSignal, countdown, isAnalyzing, triggerManualSignal, lastAnalysis };
};
