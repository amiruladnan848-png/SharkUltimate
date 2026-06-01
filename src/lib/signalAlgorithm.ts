import { IndicatorValues, SignalDirection, SignalAnalysis } from '@/types/trading';

// ─── UTILITY ────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ─── INDICATORS ─────────────────────────────────────────────────────────────

export const calcEMA = (prices: number[], period: number): number => {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
  for (let i = period; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return ema;
};

export const calcEMAHistory = (prices: number[], period: number): number[] => {
  if (prices.length < period) return prices.map(() => prices[prices.length - 1] || 0);
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
  for (let i = 0; i < period; i++) result.push(ema);
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
};

export const calcSMA = (prices: number[], period: number): number => {
  if (prices.length === 0) return 0;
  const slice = prices.slice(-Math.min(period, prices.length));
  return slice.reduce((s, p) => s + p, 0) / slice.length;
};

export const calcRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(-period - 1).map((p, i, a) => i > 0 ? p - a[i - 1] : 0).slice(1);
  const gains = changes.map(c => Math.max(c, 0));
  const losses = changes.map(c => Math.max(-c, 0));
  const avgGain = gains.reduce((s, g) => s + g, 0) / period;
  const avgLoss = losses.reduce((s, l) => s + l, 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
};

export const calcMACD = (prices: number[]): { macd: number; signal: number; hist: number; hist_prev: number } => {
  if (prices.length < 27) return { macd: 0, signal: 0, hist: 0, hist_prev: 0 };
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macd = ema12 - ema26;
  const macdVals: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const sl = prices.slice(0, i);
    macdVals.push(calcEMA(sl, 12) - calcEMA(sl, 26));
  }
  const signal = calcEMA(macdVals, 9);
  const hist = macd - signal;
  const hist_prev = macdVals.length >= 2
    ? macdVals[macdVals.length - 2] - calcEMA(macdVals.slice(0, -1), 9)
    : hist;
  return { macd, signal, hist, hist_prev };
};

export const calcBollingerBands = (prices: number[], period = 20, mult = 2) => {
  const slice = prices.slice(-Math.max(period, prices.length < period ? prices.length : period));
  if (slice.length === 0) return { upper: 0, middle: 0, lower: 0, width: 0 };
  const middle = slice.reduce((s, p) => s + p, 0) / slice.length;
  const variance = slice.reduce((s, p) => s + Math.pow(p - middle, 2), 0) / slice.length;
  const std = Math.sqrt(variance);
  const upper = middle + mult * std;
  const lower = middle - mult * std;
  return { upper, middle, lower, width: (upper - lower) / middle * 100 };
};

export const calcStochastic = (prices: number[], period = 14, smoothK = 3, smoothD = 3) => {
  if (prices.length < period) return { k: 50, d: 50, k_prev: 50 };
  const rawK: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const h = Math.max(...slice), l = Math.min(...slice);
    rawK.push(h === l ? 50 : ((prices[i] - l) / (h - l)) * 100);
  }
  const k_line = rawK.length >= smoothK
    ? rawK.slice(-smoothK).reduce((s, v) => s + v, 0) / smoothK
    : rawK[rawK.length - 1] || 50;
  const k_prev = rawK.length >= smoothK + 1
    ? rawK.slice(-smoothK - 1, -1).reduce((s, v) => s + v, 0) / smoothK
    : k_line;
  const d_values: number[] = [];
  for (let i = smoothK - 1; i < rawK.length; i++) {
    d_values.push(rawK.slice(Math.max(0, i - smoothK + 1), i + 1).reduce((s, v) => s + v, 0) / Math.min(smoothK, i + 1));
  }
  const d_line = d_values.length >= smoothD
    ? d_values.slice(-smoothD).reduce((s, v) => s + v, 0) / smoothD
    : d_values[d_values.length - 1] || 50;
  return { k: k_line, d: d_line, k_prev };
};

export const calcATR = (prices: number[], period = 14): number => {
  if (prices.length < 2) return 0;
  const trs = prices.slice(-Math.min(period + 1, prices.length)).map((p, i, a) =>
    i > 0 ? Math.abs(p - a[i - 1]) : 0
  ).slice(1);
  return trs.length > 0 ? trs.reduce((s, v) => s + v, 0) / trs.length : 0;
};

export const calcADX = (prices: number[], period = 14): { adx: number; di_plus: number; di_minus: number } => {
  if (prices.length < period * 2) return { adx: 25, di_plus: 25, di_minus: 25 };
  const n = Math.min(period * 3, prices.length);
  const slice = prices.slice(-n);
  let dmPlus = 0, dmMinus = 0, trSum = 0;
  for (let i = 1; i < slice.length; i++) {
    const high = slice[i], low = slice[i], prevHigh = slice[i - 1], prevLow = slice[i - 1];
    const up = high - prevHigh, down = prevLow - low;
    if (up > down && up > 0) dmPlus += up;
    if (down > up && down > 0) dmMinus += down;
    trSum += Math.abs(slice[i] - slice[i - 1]);
  }
  const avgTR = trSum / (slice.length - 1) || 1;
  const di_plus = (dmPlus / avgTR) * 100;
  const di_minus = (dmMinus / avgTR) * 100;
  const dx = di_plus + di_minus > 0 ? Math.abs(di_plus - di_minus) / (di_plus + di_minus) * 100 : 0;
  const changes = slice.map((p, i, a) => i > 0 ? Math.abs(p - a[i - 1]) : 0).slice(1);
  const avgChange = changes.reduce((s, c) => s + c, 0) / changes.length;
  const range = Math.max(...slice) - Math.min(...slice) || 1;
  const adx = clamp(dx * 0.5 + (avgChange / range) * 100 * 0.5, 0, 100);
  return { adx, di_plus, di_minus };
};

export const calcCCI = (prices: number[], period = 20): number => {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  const tp = slice; // simplified (using close only)
  const avg = tp.reduce((s, p) => s + p, 0) / period;
  const meanDev = tp.reduce((s, p) => s + Math.abs(p - avg), 0) / period;
  return meanDev === 0 ? 0 : (prices[prices.length - 1] - avg) / (0.015 * meanDev);
};

export const calcWilliamsR = (prices: number[], period = 14): number => {
  if (prices.length < period) return -50;
  const slice = prices.slice(-period);
  const high = Math.max(...slice), low = Math.min(...slice);
  const close = prices[prices.length - 1];
  return high === low ? -50 : ((high - close) / (high - low)) * -100;
};

export const calcMomentum = (prices: number[], period = 10): number => {
  if (prices.length < period + 1) return 0;
  return prices[prices.length - 1] - prices[prices.length - 1 - period];
};

export const calcROC = (prices: number[], period = 12): number => {
  if (prices.length < period + 1) return 0;
  const prev = prices[prices.length - 1 - period];
  return prev === 0 ? 0 : ((prices[prices.length - 1] - prev) / prev) * 100;
};

// ─── COMPOSITE INDICATOR COMPUTE ────────────────────────────────────────────

export const computeIndicators = (prices: number[]): IndicatorValues => {
  if (prices.length === 0) {
    return {
      rsi: 50, rsi_prev: 50, macd: 0, macdSignal: 0, macdHist: 0, macdHist_prev: 0,
      ema9: 0, ema21: 0, ema50: 0, ema200: 0,
      bb_upper: 0, bb_middle: 0, bb_lower: 0, bb_width: 0,
      stoch_k: 50, stoch_d: 50, stoch_k_prev: 50,
      adx: 25, di_plus: 25, di_minus: 25,
      atr: 0, cci: 0, williams_r: -50, momentum: 0, roc: 0,
      volatility: 0, trendStrength: 'NEUTRAL', signalConfluence: 0,
    };
  }

  const rsi = calcRSI(prices);
  const rsi_prev = calcRSI(prices.slice(0, -1));
  const { macd, signal: macdSignal, hist: macdHist, hist_prev: macdHist_prev } = calcMACD(prices);
  const ema9 = calcEMA(prices, 9);
  const ema21 = calcEMA(prices, 21);
  const ema50 = calcEMA(prices, 50);
  const ema200 = calcEMA(prices, 200);
  const bb = calcBollingerBands(prices);
  const stoch = calcStochastic(prices);
  const { adx, di_plus, di_minus } = calcADX(prices);
  const atr = calcATR(prices);
  const cci = calcCCI(prices);
  const williams_r = calcWilliamsR(prices);
  const momentum = calcMomentum(prices);
  const roc = calcROC(prices);

  // Volatility: ATR as % of price
  const lastPrice = prices[prices.length - 1] || 1;
  const volatility = (atr / lastPrice) * 100;

  // Trend strength
  let trendStrength: IndicatorValues['trendStrength'] = 'NEUTRAL';
  if (ema9 > ema21 && ema21 > ema50 && ema50 > ema200) trendStrength = 'STRONG_UP';
  else if (ema9 > ema21 && ema21 > ema50) trendStrength = 'UP';
  else if (ema9 < ema21 && ema21 < ema50 && ema50 < ema200) trendStrength = 'STRONG_DOWN';
  else if (ema9 < ema21 && ema21 < ema50) trendStrength = 'DOWN';

  // confluence placeholder
  const signalConfluence = 0;

  return {
    rsi, rsi_prev, macd, macdSignal, macdHist, macdHist_prev,
    ema9, ema21, ema50, ema200,
    bb_upper: bb.upper, bb_middle: bb.middle, bb_lower: bb.lower, bb_width: bb.width,
    stoch_k: stoch.k, stoch_d: stoch.d, stoch_k_prev: stoch.k_prev,
    adx, di_plus, di_minus,
    atr, cci, williams_r, momentum, roc, volatility, trendStrength, signalConfluence,
  };
};

// ─── DEEP SIGNAL ENGINE ─────────────────────────────────────────────────────

export const generateSignalDirection = (
  ind: IndicatorValues,
  prices: number[],
  sessionBoost: number
): { direction: SignalDirection; strength: number; accuracy: number; analysis: SignalAnalysis } => {
  if (prices.length < 30) {
    return {
      direction: 'WAIT', strength: 0, accuracy: 50,
      analysis: { bullSignals: [], bearSignals: [], neutralSignals: ['Insufficient data'], confluenceScore: 0, confidence: 'LOW', reason: 'Need 30+ ticks' },
    };
  }

  const bullSignals: string[] = [];
  const bearSignals: string[] = [];
  const neutralSignals: string[] = [];
  let bullScore = 0, bearScore = 0;

  // ── RSI (weight 2.5) ──────────────────────────────────────────────────────
  if (ind.rsi < 25) { bullScore += 2.5; bullSignals.push(`RSI Deeply Oversold (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi < 35) { bullScore += 2.0; bullSignals.push(`RSI Oversold (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi < 45 && ind.rsi > ind.rsi_prev) { bullScore += 1.0; bullSignals.push(`RSI Recovering (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi > 75) { bearScore += 2.5; bearSignals.push(`RSI Deeply Overbought (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi > 65) { bearScore += 2.0; bearSignals.push(`RSI Overbought (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi > 55 && ind.rsi < ind.rsi_prev) { bearScore += 1.0; bearSignals.push(`RSI Declining (${ind.rsi.toFixed(1)})`); }
  else neutralSignals.push(`RSI Neutral (${ind.rsi.toFixed(1)})`);

  // RSI Divergence detection
  if (ind.rsi > ind.rsi_prev && ind.momentum < 0) { bullScore += 1.5; bullSignals.push('Bullish RSI Divergence'); }
  if (ind.rsi < ind.rsi_prev && ind.momentum > 0) { bearScore += 1.5; bearSignals.push('Bearish RSI Divergence'); }

  // ── MACD (weight 2.5) ─────────────────────────────────────────────────────
  if (ind.macd > ind.macdSignal && ind.macdHist > 0) {
    if (ind.macdHist > ind.macdHist_prev) { bullScore += 2.5; bullSignals.push('MACD Bullish Crossover + Expanding'); }
    else { bullScore += 1.5; bullSignals.push('MACD Bullish (Fading)'); }
  }
  if (ind.macd < ind.macdSignal && ind.macdHist < 0) {
    if (ind.macdHist < ind.macdHist_prev) { bearScore += 2.5; bearSignals.push('MACD Bearish Crossover + Expanding'); }
    else { bearScore += 1.5; bearSignals.push('MACD Bearish (Fading)'); }
  }
  if (ind.macd > 0 && ind.macdHist_prev < 0 && ind.macdHist > 0) { bullScore += 1.5; bullSignals.push('MACD Zero-Line Cross Up'); }
  if (ind.macd < 0 && ind.macdHist_prev > 0 && ind.macdHist < 0) { bearScore += 1.5; bearSignals.push('MACD Zero-Line Cross Down'); }

  // ── EMA Trend (weight 2.0) ────────────────────────────────────────────────
  const price = prices[prices.length - 1];
  if (ind.trendStrength === 'STRONG_UP') { bullScore += 2.0; bullSignals.push('Strong Uptrend (EMA9>21>50>200)'); }
  else if (ind.trendStrength === 'UP') { bullScore += 1.5; bullSignals.push('Uptrend (EMA9>21>50)'); }
  else if (ind.trendStrength === 'STRONG_DOWN') { bearScore += 2.0; bearSignals.push('Strong Downtrend (EMA9<21<50<200)'); }
  else if (ind.trendStrength === 'DOWN') { bearScore += 1.5; bearSignals.push('Downtrend (EMA9<21<50)'); }
  else neutralSignals.push('EMA Trend Neutral');

  // Price vs EMA
  if (price > ind.ema9 && price > ind.ema21) { bullScore += 0.5; bullSignals.push('Price Above EMA9 & EMA21'); }
  if (price < ind.ema9 && price < ind.ema21) { bearScore += 0.5; bearSignals.push('Price Below EMA9 & EMA21'); }

  // ── Bollinger Bands (weight 1.5) ──────────────────────────────────────────
  if (price <= ind.bb_lower) { bullScore += 1.5; bullSignals.push('Price at BB Lower Band (Oversold)'); }
  else if (price >= ind.bb_upper) { bearScore += 1.5; bearSignals.push('Price at BB Upper Band (Overbought)'); }
  else if (price < ind.bb_middle) { bullScore += 0.3; }
  else if (price > ind.bb_middle) { bearScore += 0.3; }

  // BB Squeeze: low volatility → breakout coming
  if (ind.bb_width < 0.3) neutralSignals.push('BB Squeeze — Breakout Imminent');

  // ── Stochastic (weight 1.5) ───────────────────────────────────────────────
  if (ind.stoch_k < 20 && ind.stoch_d < 20) { bullScore += 1.5; bullSignals.push(`Stoch Oversold K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)}`); }
  else if (ind.stoch_k > 80 && ind.stoch_d > 80) { bearScore += 1.5; bearSignals.push(`Stoch Overbought K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)}`); }
  // Stoch crossover
  if (ind.stoch_k > ind.stoch_d && ind.stoch_k_prev < ind.stoch_d) { bullScore += 1.0; bullSignals.push('Stoch Bullish Cross'); }
  if (ind.stoch_k < ind.stoch_d && ind.stoch_k_prev > ind.stoch_d) { bearScore += 1.0; bearSignals.push('Stoch Bearish Cross'); }

  // ── CCI (weight 1.0) ──────────────────────────────────────────────────────
  if (ind.cci < -150) { bullScore += 1.0; bullSignals.push(`CCI Extreme Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci < -100) { bullScore += 0.5; bullSignals.push(`CCI Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci > 150) { bearScore += 1.0; bearSignals.push(`CCI Extreme Overbought (${ind.cci.toFixed(0)})`); }
  else if (ind.cci > 100) { bearScore += 0.5; bearSignals.push(`CCI Overbought (${ind.cci.toFixed(0)})`); }

  // ── Williams %R (weight 1.0) ──────────────────────────────────────────────
  if (ind.williams_r < -85) { bullScore += 1.0; bullSignals.push(`Williams %R Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r > -15) { bearScore += 1.0; bearSignals.push(`Williams %R Overbought (${ind.williams_r.toFixed(0)})`); }

  // ── ADX Trend Strength (weight 1.0) ───────────────────────────────────────
  if (ind.adx > 40) {
    neutralSignals.push(`ADX Strong Trend (${ind.adx.toFixed(0)})`);
    if (ind.di_plus > ind.di_minus) { bullScore += 1.0; bullSignals.push('+DI > -DI (Bull Trend)'); }
    else { bearScore += 1.0; bearSignals.push('-DI > +DI (Bear Trend)'); }
  } else if (ind.adx < 20) {
    neutralSignals.push(`ADX Weak Trend (${ind.adx.toFixed(0)}) — Range Market`);
    // In range market, reduce all scores slightly
    bullScore *= 0.85;
    bearScore *= 0.85;
  }

  // ── Momentum & ROC (weight 0.5 each) ─────────────────────────────────────
  if (ind.momentum > 0 && ind.roc > 0.1) { bullScore += 0.5; bullSignals.push(`Positive Momentum (${ind.momentum > 0 ? '+' : ''}${ind.momentum.toFixed(5)})`); }
  if (ind.momentum < 0 && ind.roc < -0.1) { bearScore += 0.5; bearSignals.push(`Negative Momentum`); }

  // ─── SCORING ─────────────────────────────────────────────────────────────
  const totalScore = bullScore + bearScore;
  const spread = Math.abs(bullScore - bearScore);

  // Minimum threshold: need clear signal
  if (totalScore < 3 || spread / (totalScore || 1) < 0.15) {
    return {
      direction: 'WAIT', strength: 20, accuracy: 50,
      analysis: { bullSignals, bearSignals, neutralSignals, confluenceScore: 0, confidence: 'LOW', reason: 'No clear signal confluence' },
    };
  }

  const direction: SignalDirection = bullScore > bearScore ? 'CALL' : 'PUT';
  const dominantScore = Math.max(bullScore, bearScore);
  const strength = clamp(Math.round((dominantScore / 18) * 100), 30, 100);

  // Accuracy engine: multi-layer
  const baseAccuracy = 62;
  const confluenceBonus = (spread / totalScore) * 20;
  const adxBonus = ind.adx > 35 ? 6 : ind.adx > 25 ? 3 : 0;
  const rsiBonus = (ind.rsi < 30 || ind.rsi > 70) ? 4 : (ind.rsi < 40 || ind.rsi > 60) ? 2 : 0;
  const macdBonus = Math.abs(ind.macdHist) > Math.abs(ind.macdHist_prev) ? 3 : 0;
  const trendBonus = (ind.trendStrength === 'STRONG_UP' || ind.trendStrength === 'STRONG_DOWN') ? 5 : (ind.trendStrength !== 'NEUTRAL') ? 2 : 0;
  const signalCountBonus = Math.min(8, (direction === 'CALL' ? bullSignals.length : bearSignals.length) * 1.2);

  const rawAccuracy = baseAccuracy + confluenceBonus + adxBonus + rsiBonus + macdBonus + trendBonus + signalCountBonus + sessionBoost;
  const accuracy = clamp(Math.round(rawAccuracy), 62, 97);

  // Confluence score for display
  const totalIndicators = bullSignals.length + bearSignals.length + neutralSignals.length;
  const winningIndicators = direction === 'CALL' ? bullSignals.length : bearSignals.length;
  const confluenceScore = totalIndicators > 0 ? Math.round((winningIndicators / totalIndicators) * 100) : 50;

  // Confidence level
  let confidence: SignalAnalysis['confidence'] = 'LOW';
  if (accuracy >= 88) confidence = 'VERY_HIGH';
  else if (accuracy >= 80) confidence = 'HIGH';
  else if (accuracy >= 72) confidence = 'MEDIUM';

  // Reason string
  const topSignal = direction === 'CALL' ? bullSignals[0] : bearSignals[0];
  const reason = `${direction} signal: ${topSignal || 'Multi-indicator confluence'}`;

  return {
    direction, strength, accuracy,
    analysis: { bullSignals, bearSignals, neutralSignals, confluenceScore, confidence, reason },
  };
};
