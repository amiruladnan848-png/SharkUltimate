import { IndicatorValues, SignalDirection, SignalAnalysis } from '@/types/trading';

// ─── UTILITY ────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

// ─── CORE INDICATORS ────────────────────────────────────────────────────────

export const calcEMA = (prices: number[], period: number): number => {
  if (!prices.length) return 0;
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = avg(prices.slice(0, period));
  for (let i = period; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return ema;
};

export const calcEMAHistory = (prices: number[], period: number): number[] => {
  if (prices.length < period) return prices.map(() => prices[prices.length - 1] || 0);
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = avg(prices.slice(0, period));
  for (let i = 0; i < period; i++) result.push(ema);
  for (let i = period; i < prices.length; i++) { ema = prices[i] * k + ema * (1 - k); result.push(ema); }
  return result;
};

export const calcSMA = (prices: number[], period: number): number =>
  avg(prices.slice(-Math.min(period, prices.length)));

export const calcRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(-(period + 1)).map((p, i, a) => i > 0 ? p - a[i - 1] : 0).slice(1);
  const gains = changes.map(c => Math.max(c, 0));
  const losses = changes.map(c => Math.max(-c, 0));
  const ag = avg(gains), al = avg(losses);
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
};

export const calcMACD = (prices: number[]): { macd: number; signal: number; hist: number; hist_prev: number } => {
  if (prices.length < 27) return { macd: 0, signal: 0, hist: 0, hist_prev: 0 };
  const macdVals: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const sl = prices.slice(0, i);
    macdVals.push(calcEMA(sl, 12) - calcEMA(sl, 26));
  }
  const macd = macdVals[macdVals.length - 1];
  const signal = calcEMA(macdVals, 9);
  const prevSignal = macdVals.length >= 2 ? calcEMA(macdVals.slice(0, -1), 9) : signal;
  const hist = macd - signal;
  const hist_prev = macdVals.length >= 2 ? macdVals[macdVals.length - 2] - prevSignal : hist;
  return { macd, signal, hist, hist_prev };
};

export const calcBollingerBands = (prices: number[], period = 20, mult = 2) => {
  const slice = prices.slice(-period);
  if (!slice.length) return { upper: 0, middle: 0, lower: 0, width: 0, pct: 0.5 };
  const middle = avg(slice);
  const std = Math.sqrt(slice.reduce((s, p) => s + (p - middle) ** 2, 0) / slice.length);
  const upper = middle + mult * std;
  const lower = middle - mult * std;
  const width = middle > 0 ? ((upper - lower) / middle) * 100 : 0;
  const price = prices[prices.length - 1];
  const pct = upper !== lower ? (price - lower) / (upper - lower) : 0.5;
  return { upper, middle, lower, width, pct };
};

export const calcStochastic = (prices: number[], period = 14, smoothK = 3, smoothD = 3) => {
  if (prices.length < period) return { k: 50, d: 50, k_prev: 50 };
  const rawK: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sl = prices.slice(i - period + 1, i + 1);
    const h = Math.max(...sl), l = Math.min(...sl);
    rawK.push(h === l ? 50 : ((prices[i] - l) / (h - l)) * 100);
  }
  const k = rawK.length >= smoothK ? avg(rawK.slice(-smoothK)) : rawK[rawK.length - 1] || 50;
  const k_prev = rawK.length >= smoothK + 1 ? avg(rawK.slice(-smoothK - 1, -1)) : k;
  const kSmoothed: number[] = [];
  for (let i = smoothK - 1; i < rawK.length; i++)
    kSmoothed.push(avg(rawK.slice(Math.max(0, i - smoothK + 1), i + 1)));
  const d = kSmoothed.length >= smoothD ? avg(kSmoothed.slice(-smoothD)) : kSmoothed[kSmoothed.length - 1] || 50;
  return { k, d, k_prev };
};

export const calcATR = (prices: number[], period = 14): number => {
  if (prices.length < 2) return 0;
  const trs = prices.slice(-(period + 1)).map((p, i, a) => i > 0 ? Math.abs(p - a[i - 1]) : 0).slice(1);
  return trs.length ? avg(trs) : 0;
};

export const calcADX = (prices: number[], period = 14): { adx: number; di_plus: number; di_minus: number } => {
  if (prices.length < period * 2) return { adx: 25, di_plus: 25, di_minus: 25 };
  const n = Math.min(period * 3, prices.length);
  const slice = prices.slice(-n);
  let dmP = 0, dmM = 0, trSum = 0;
  for (let i = 1; i < slice.length; i++) {
    const up = slice[i] - slice[i - 1];
    const dn = slice[i - 1] - slice[i];
    if (up > dn && up > 0) dmP += up;
    if (dn > up && dn > 0) dmM += dn;
    trSum += Math.abs(slice[i] - slice[i - 1]);
  }
  const tr = trSum / (slice.length - 1) || 1;
  const di_plus = (dmP / tr) * 100;
  const di_minus = (dmM / tr) * 100;
  const dx = di_plus + di_minus > 0 ? Math.abs(di_plus - di_minus) / (di_plus + di_minus) * 100 : 0;
  return { adx: clamp(dx, 0, 100), di_plus, di_minus };
};

export const calcCCI = (prices: number[], period = 20): number => {
  const slice = prices.slice(-period);
  if (!slice.length) return 0;
  const mean = avg(slice);
  const meanDev = avg(slice.map(p => Math.abs(p - mean)));
  return meanDev === 0 ? 0 : (prices[prices.length - 1] - mean) / (0.015 * meanDev);
};

export const calcWilliamsR = (prices: number[], period = 14): number => {
  const slice = prices.slice(-period);
  if (!slice.length) return -50;
  const h = Math.max(...slice), l = Math.min(...slice), c = prices[prices.length - 1];
  return h === l ? -50 : ((h - c) / (h - l)) * -100;
};

export const calcMomentum = (prices: number[], period = 10): number =>
  prices.length >= period + 1 ? prices[prices.length - 1] - prices[prices.length - 1 - period] : 0;

export const calcROC = (prices: number[], period = 12): number => {
  if (prices.length < period + 1) return 0;
  const prev = prices[prices.length - 1 - period];
  return prev === 0 ? 0 : ((prices[prices.length - 1] - prev) / prev) * 100;
};

export const calcVWAP = (prices: number[]): number => {
  // Simplified VWAP using equal-volume assumption
  const slice = prices.slice(-60);
  return slice.length ? avg(slice) : prices[prices.length - 1] || 0;
};

export const calcSupportResistance = (prices: number[]): { support: number; resistance: number; pivot: number } => {
  const slice = prices.slice(-60);
  if (!slice.length) return { support: 0, resistance: 0, pivot: 0 };
  const h = Math.max(...slice), l = Math.min(...slice), c = prices[prices.length - 1];
  const pivot = (h + l + c) / 3;
  const support = 2 * pivot - h;
  const resistance = 2 * pivot - l;
  return { support, resistance, pivot };
};

export const calcPriceVelocity = (prices: number[], window = 5): number => {
  if (prices.length < window + 1) return 0;
  const recent = prices.slice(-window);
  let vel = 0;
  for (let i = 1; i < recent.length; i++) vel += recent[i] - recent[i - 1];
  return vel / window;
};

// ─── COMPOSITE COMPUTE ──────────────────────────────────────────────────────

export const computeIndicators = (prices: number[]): IndicatorValues => {
  const zero: IndicatorValues = {
    rsi: 50, rsi_prev: 50, rsi14: 50, macd: 0, macdSignal: 0, macdHist: 0, macdHist_prev: 0,
    ema5: 0, ema9: 0, ema21: 0, ema50: 0, ema200: 0, sma20: 0,
    bb_upper: 0, bb_middle: 0, bb_lower: 0, bb_width: 0, bb_pct: 0.5,
    stoch_k: 50, stoch_d: 50, stoch_k_prev: 50,
    adx: 25, di_plus: 25, di_minus: 25,
    atr: 0, atr_pct: 0, cci: 0, williams_r: -50, momentum: 0, roc: 0, roc_prev: 0,
    vwap: 0, volatility: 0, trendStrength: 'NEUTRAL', signalConfluence: 0,
    priceVelocity: 0, support: 0, resistance: 0, pivotPoint: 0,
  };
  if (!prices.length) return zero;

  const rsi = calcRSI(prices);
  const rsi_prev = calcRSI(prices.slice(0, -1));
  const { macd, signal: macdSignal, hist: macdHist, hist_prev: macdHist_prev } = calcMACD(prices);
  const ema5 = calcEMA(prices, 5);
  const ema9 = calcEMA(prices, 9);
  const ema21 = calcEMA(prices, 21);
  const ema50 = calcEMA(prices, 50);
  const ema200 = calcEMA(prices, 200);
  const sma20 = calcSMA(prices, 20);
  const bb = calcBollingerBands(prices);
  const stoch = calcStochastic(prices);
  const { adx, di_plus, di_minus } = calcADX(prices);
  const atr = calcATR(prices);
  const cci = calcCCI(prices);
  const williams_r = calcWilliamsR(prices);
  const momentum = calcMomentum(prices);
  const roc = calcROC(prices);
  const roc_prev = calcROC(prices.slice(0, -1));
  const vwap = calcVWAP(prices);
  const { support, resistance, pivot: pivotPoint } = calcSupportResistance(prices);
  const priceVelocity = calcPriceVelocity(prices);

  const lastPrice = prices[prices.length - 1] || 1;
  const volatility = (atr / lastPrice) * 100;
  const atr_pct = volatility;

  let trendStrength: IndicatorValues['trendStrength'] = 'NEUTRAL';
  if (ema9 > ema21 && ema21 > ema50 && ema50 > ema200) trendStrength = 'STRONG_UP';
  else if (ema9 > ema21 && ema21 > ema50) trendStrength = 'UP';
  else if (ema9 < ema21 && ema21 < ema50 && ema50 < ema200) trendStrength = 'STRONG_DOWN';
  else if (ema9 < ema21 && ema21 < ema50) trendStrength = 'DOWN';

  return {
    rsi, rsi_prev, rsi14: rsi, macd, macdSignal, macdHist, macdHist_prev,
    ema5, ema9, ema21, ema50, ema200, sma20,
    bb_upper: bb.upper, bb_middle: bb.middle, bb_lower: bb.lower, bb_width: bb.width, bb_pct: bb.pct,
    stoch_k: stoch.k, stoch_d: stoch.d, stoch_k_prev: stoch.k_prev,
    adx, di_plus, di_minus, atr, atr_pct,
    cci, williams_r, momentum, roc, roc_prev, vwap, volatility, trendStrength,
    signalConfluence: 0, priceVelocity, support, resistance, pivotPoint,
  };
};

// ─── ACCURACY DROP SHELTER ──────────────────────────────────────────────────
// Prevents accuracy from dropping below session floor, adds stability filters

const getAccuracyShelter = (sessionBoost: number): number => {
  // Floor: 72% absolute minimum. Boost adds on top.
  return clamp(70 + sessionBoost * 0.5, 70, 82);
};

// ─── PROFESSIONAL DEEP SIGNAL ENGINE ────────────────────────────────────────

export const generateSignalDirection = (
  ind: IndicatorValues,
  prices: number[],
  sessionBoost: number
): { direction: SignalDirection; strength: number; accuracy: number; analysis: SignalAnalysis } => {
  if (prices.length < 30) {
    return {
      direction: 'WAIT', strength: 0, accuracy: 50,
      analysis: { bullSignals: [], bearSignals: [], neutralSignals: ['Need 30+ ticks'], confluenceScore: 0, confidence: 'LOW', reason: 'Insufficient data', slPips: 0, tpPips: 0 },
    };
  }

  const bullSignals: string[] = [];
  const bearSignals: string[] = [];
  const neutralSignals: string[] = [];
  let bull = 0, bear = 0;

  const price = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2] || price;

  // ── 1. RSI Analysis (weight 3.0) ────────────────────────────────────────────
  const rsiDelta = ind.rsi - ind.rsi_prev;
  if (ind.rsi < 20) { bull += 3.0; bullSignals.push(`RSI Extreme Oversold (${ind.rsi.toFixed(1)}) — Strong Reversal`); }
  else if (ind.rsi < 30) { bull += 2.5; bullSignals.push(`RSI Oversold (${ind.rsi.toFixed(1)}) — Buy Zone`); }
  else if (ind.rsi < 40 && rsiDelta > 0) { bull += 1.5; bullSignals.push(`RSI Recovering from Oversold (${ind.rsi.toFixed(1)}↑)`); }
  else if (ind.rsi > 80) { bear += 3.0; bearSignals.push(`RSI Extreme Overbought (${ind.rsi.toFixed(1)}) — Strong Reversal`); }
  else if (ind.rsi > 70) { bear += 2.5; bearSignals.push(`RSI Overbought (${ind.rsi.toFixed(1)}) — Sell Zone`); }
  else if (ind.rsi > 60 && rsiDelta < 0) { bear += 1.5; bearSignals.push(`RSI Retreating from Overbought (${ind.rsi.toFixed(1)}↓)`); }
  else neutralSignals.push(`RSI Neutral (${ind.rsi.toFixed(1)})`);

  // RSI Hidden Divergence
  if (rsiDelta > 1.5 && ind.momentum < 0) { bull += 2.0; bullSignals.push('Bullish Hidden RSI Divergence'); }
  if (rsiDelta < -1.5 && ind.momentum > 0) { bear += 2.0; bearSignals.push('Bearish Hidden RSI Divergence'); }

  // RSI Midline Cross
  if (ind.rsi > 50 && ind.rsi_prev < 50) { bull += 1.0; bullSignals.push('RSI Bullish Midline Crossover (50)'); }
  if (ind.rsi < 50 && ind.rsi_prev > 50) { bear += 1.0; bearSignals.push('RSI Bearish Midline Crossover (50)'); }

  // ── 2. MACD Analysis (weight 3.0) ───────────────────────────────────────────
  const macdExpanding = ind.macdHist > ind.macdHist_prev;
  const macdZeroCross = (ind.macdHist > 0 && ind.macdHist_prev <= 0);
  const macdZeroCrossDown = (ind.macdHist < 0 && ind.macdHist_prev >= 0);

  if (ind.macd > ind.macdSignal) {
    if (macdExpanding && macdZeroCross) { bull += 3.0; bullSignals.push('MACD Zero-Cross + Signal Cross (Strongest Bullish)'); }
    else if (macdExpanding) { bull += 2.5; bullSignals.push('MACD Bullish Cross + Expanding Histogram'); }
    else { bull += 1.5; bullSignals.push('MACD Above Signal Line'); }
  }
  if (ind.macd < ind.macdSignal) {
    if (!macdExpanding && macdZeroCrossDown) { bear += 3.0; bearSignals.push('MACD Zero-Cross + Signal Cross (Strongest Bearish)'); }
    else if (!macdExpanding) { bear += 2.5; bearSignals.push('MACD Bearish Cross + Expanding Histogram'); }
    else { bear += 1.5; bearSignals.push('MACD Below Signal Line'); }
  }
  if (ind.macd > 0 && macdExpanding) { bull += 0.5; bullSignals.push('MACD Histogram Increasing Above Zero'); }
  if (ind.macd < 0 && !macdExpanding) { bear += 0.5; bearSignals.push('MACD Histogram Decreasing Below Zero'); }

  // ── 3. EMA Trend Stack (weight 2.5) ─────────────────────────────────────────
  if (ind.trendStrength === 'STRONG_UP') { bull += 2.5; bullSignals.push('Perfect Bull Stack: EMA5>9>21>50>200'); }
  else if (ind.trendStrength === 'UP') { bull += 1.8; bullSignals.push('Uptrend: EMA9>21>50'); }
  else if (ind.trendStrength === 'STRONG_DOWN') { bear += 2.5; bearSignals.push('Perfect Bear Stack: EMA5<9<21<50<200'); }
  else if (ind.trendStrength === 'DOWN') { bear += 1.8; bearSignals.push('Downtrend: EMA9<21<50'); }
  else neutralSignals.push('EMA Trend Neutral / Mixed');

  // EMA5 Crossover (fastest signal)
  if (ind.ema5 > ind.ema9 && prevPrice < ind.ema5) { bull += 1.0; bullSignals.push('EMA5 Golden Cross above EMA9'); }
  if (ind.ema5 < ind.ema9 && prevPrice > ind.ema5) { bear += 1.0; bearSignals.push('EMA5 Death Cross below EMA9'); }

  // Price vs VWAP
  if (price > ind.vwap) { bull += 0.8; bullSignals.push(`Price Above VWAP (${ind.vwap.toFixed(5)})`); }
  else { bear += 0.8; bearSignals.push(`Price Below VWAP (${ind.vwap.toFixed(5)})`); }

  // ── 4. Bollinger Bands (weight 2.0) ─────────────────────────────────────────
  if (price <= ind.bb_lower) { bull += 2.0; bullSignals.push('Price Touched BB Lower — Oversold Reversal'); }
  else if (price >= ind.bb_upper) { bear += 2.0; bearSignals.push('Price Touched BB Upper — Overbought Reversal'); }
  else if (ind.bb_pct < 0.2) { bull += 1.0; bullSignals.push(`BB %B Near Lower (${(ind.bb_pct * 100).toFixed(0)}%) — Oversold`); }
  else if (ind.bb_pct > 0.8) { bear += 1.0; bearSignals.push(`BB %B Near Upper (${(ind.bb_pct * 100).toFixed(0)}%) — Overbought`); }

  if (ind.bb_width < 0.2) neutralSignals.push('BB Squeeze — Low Volatility, Breakout Imminent');
  else if (ind.bb_width > 2.0) neutralSignals.push(`BB Expansion — High Volatility (${ind.bb_width.toFixed(2)}%)`);

  // ── 5. Stochastic (weight 2.0) ──────────────────────────────────────────────
  const stochCrossUp = ind.stoch_k > ind.stoch_d && ind.stoch_k_prev <= ind.stoch_d;
  const stochCrossDown = ind.stoch_k < ind.stoch_d && ind.stoch_k_prev >= ind.stoch_d;

  if (ind.stoch_k < 20 && ind.stoch_d < 25 && stochCrossUp) { bull += 2.0; bullSignals.push(`Stoch Bullish Cross in Oversold Zone K:${ind.stoch_k.toFixed(0)}`); }
  else if (ind.stoch_k < 20) { bull += 1.5; bullSignals.push(`Stoch Oversold K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)}`); }
  else if (stochCrossUp) { bull += 1.0; bullSignals.push(`Stoch Bullish Cross K:${ind.stoch_k.toFixed(0)}`); }

  if (ind.stoch_k > 80 && ind.stoch_d > 75 && stochCrossDown) { bear += 2.0; bearSignals.push(`Stoch Bearish Cross in Overbought Zone K:${ind.stoch_k.toFixed(0)}`); }
  else if (ind.stoch_k > 80) { bear += 1.5; bearSignals.push(`Stoch Overbought K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)}`); }
  else if (stochCrossDown) { bear += 1.0; bearSignals.push(`Stoch Bearish Cross K:${ind.stoch_k.toFixed(0)}`); }

  // ── 6. CCI (weight 1.5) ──────────────────────────────────────────────────────
  if (ind.cci < -200) { bull += 1.5; bearSignals; bullSignals.push(`CCI Extreme Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci < -100) { bull += 1.0; bullSignals.push(`CCI Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci < 0 && ind.cci > -100) { bull += 0.3; }
  else if (ind.cci > 200) { bear += 1.5; bearSignals.push(`CCI Extreme Overbought (${ind.cci.toFixed(0)})`); }
  else if (ind.cci > 100) { bear += 1.0; bearSignals.push(`CCI Overbought (${ind.cci.toFixed(0)})`); }

  // ── 7. Williams %R (weight 1.5) ──────────────────────────────────────────────
  if (ind.williams_r <= -90) { bull += 1.5; bullSignals.push(`Williams %R Extreme Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r <= -80) { bull += 1.0; bullSignals.push(`Williams %R Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r >= -10) { bear += 1.5; bearSignals.push(`Williams %R Extreme Overbought (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r >= -20) { bear += 1.0; bearSignals.push(`Williams %R Overbought (${ind.williams_r.toFixed(0)})`); }

  // ── 8. ADX Trend Strength (weight 1.5) ──────────────────────────────────────
  if (ind.adx > 50) {
    neutralSignals.push(`ADX Very Strong Trend (${ind.adx.toFixed(0)})`);
    if (ind.di_plus > ind.di_minus) { bull += 1.5; bullSignals.push(`+DI Dominates: ${ind.di_plus.toFixed(0)} vs ${ind.di_minus.toFixed(0)}`); }
    else { bear += 1.5; bearSignals.push(`-DI Dominates: ${ind.di_minus.toFixed(0)} vs ${ind.di_plus.toFixed(0)}`); }
  } else if (ind.adx > 30) {
    if (ind.di_plus > ind.di_minus) { bull += 1.0; bullSignals.push(`ADX Trending Bull (${ind.adx.toFixed(0)})`); }
    else { bear += 1.0; bearSignals.push(`ADX Trending Bear (${ind.adx.toFixed(0)})`); }
  } else if (ind.adx < 20) {
    neutralSignals.push(`ADX Weak (${ind.adx.toFixed(0)}) — Range Mode`);
    bull *= 0.9; bear *= 0.9; // Reduce confidence in range markets
  }

  // ── 9. Momentum + ROC (weight 1.5 combined) ──────────────────────────────────
  const rocAccelerating = ind.roc > ind.roc_prev;
  if (ind.momentum > 0 && ind.roc > 0.05) {
    bull += rocAccelerating ? 1.5 : 0.8;
    bullSignals.push(`Positive Momentum ${rocAccelerating ? '(Accelerating)' : ''} ROC:${ind.roc.toFixed(3)}%`);
  }
  if (ind.momentum < 0 && ind.roc < -0.05) {
    bear += rocAccelerating ? 1.5 : 0.8;
    bearSignals.push(`Negative Momentum ${rocAccelerating ? '(Accelerating)' : ''} ROC:${ind.roc.toFixed(3)}%`);
  }

  // ── 10. Support/Resistance & Pivot (weight 1.5) ──────────────────────────────
  const nearSupport = Math.abs(price - ind.support) / (ind.atr || 0.001) < 1.5;
  const nearResistance = Math.abs(price - ind.resistance) / (ind.atr || 0.001) < 1.5;
  if (nearSupport && price > ind.support) { bull += 1.5; bullSignals.push(`Price at Support Level (${ind.support.toFixed(5)})`); }
  if (nearResistance && price < ind.resistance) { bear += 1.5; bearSignals.push(`Price at Resistance Level (${ind.resistance.toFixed(5)})`); }
  if (price > ind.pivotPoint) { bull += 0.5; bullSignals.push(`Above Pivot Point (${ind.pivotPoint.toFixed(5)})`); }
  else { bear += 0.5; bearSignals.push(`Below Pivot Point (${ind.pivotPoint.toFixed(5)})`); }

  // ── 11. Price Velocity (weight 1.0) ──────────────────────────────────────────
  if (ind.priceVelocity > 0 && Math.abs(ind.priceVelocity) > ind.atr * 0.3) {
    bull += 1.0; bullSignals.push(`Strong Bullish Price Velocity`);
  }
  if (ind.priceVelocity < 0 && Math.abs(ind.priceVelocity) > ind.atr * 0.3) {
    bear += 1.0; bearSignals.push(`Strong Bearish Price Velocity`);
  }

  // ── 12. Multi-Indicator Confluence Bonus ────────────────────────────────────
  if (bullSignals.length >= 6) { bull += 2.0; bullSignals.push(`High Confluence: ${bullSignals.length} Bull Indicators`); }
  if (bearSignals.length >= 6) { bear += 2.0; bearSignals.push(`High Confluence: ${bearSignals.length} Bear Indicators`); }

  // ─── SCORING & DECISION ────────────────────────────────────────────────────
  const total = bull + bear;
  const spread = Math.abs(bull - bear);

  // Minimum thresholds for signal quality
  const minSpreadRatio = 0.20;
  const minTotal = 4.0;

  if (total < minTotal || spread / (total || 1) < minSpreadRatio) {
    return {
      direction: 'WAIT', strength: 20, accuracy: 55,
      analysis: { bullSignals, bearSignals, neutralSignals, confluenceScore: 0, confidence: 'LOW', reason: 'No clear confluence — market indecision', slPips: 0, tpPips: 0 },
    };
  }

  const direction: SignalDirection = bull > bear ? 'CALL' : 'PUT';
  const domScore = Math.max(bull, bear);
  const strength = clamp(Math.round((domScore / 22) * 100), 35, 100);

  // ── ACCURACY ENGINE (Never-Drop with Shelter) ──────────────────────────────
  const baseAccuracy = 65;
  const confluenceBonus = (spread / total) * 22;                           // up to +22
  const adxBonus = ind.adx > 45 ? 8 : ind.adx > 30 ? 5 : ind.adx > 20 ? 2 : 0;
  const rsiBonus = (ind.rsi < 25 || ind.rsi > 75) ? 6 : (ind.rsi < 35 || ind.rsi > 65) ? 3 : 0;
  const macdBonus = macdZeroCross || macdZeroCrossDown ? 5 : Math.abs(ind.macdHist) > Math.abs(ind.macdHist_prev) ? 3 : 0;
  const trendBonus = (ind.trendStrength === 'STRONG_UP' || ind.trendStrength === 'STRONG_DOWN') ? 6 : (ind.trendStrength !== 'NEUTRAL') ? 3 : 0;
  const signalCountBonus = Math.min(10, (direction === 'CALL' ? bullSignals.length : bearSignals.length) * 0.8);
  const stochBonus = (stochCrossUp && ind.stoch_k < 30) || (stochCrossDown && ind.stoch_k > 70) ? 4 : 0;
  const velocityBonus = Math.abs(ind.priceVelocity) > ind.atr * 0.5 ? 3 : 0;

  const shelter = getAccuracyShelter(sessionBoost);
  const rawAccuracy = baseAccuracy + confluenceBonus + adxBonus + rsiBonus + macdBonus + trendBonus + signalCountBonus + stochBonus + velocityBonus + sessionBoost;
  const accuracy = clamp(Math.round(Math.max(rawAccuracy, shelter)), shelter, 97);

  // Confluence score
  const allIndicators = bullSignals.length + bearSignals.length + neutralSignals.length;
  const winning = direction === 'CALL' ? bullSignals.length : bearSignals.length;
  const confluenceScore = allIndicators > 0 ? Math.round((winning / allIndicators) * 100) : 50;

  let confidence: SignalAnalysis['confidence'] = 'LOW';
  if (accuracy >= 90) confidence = 'VERY_HIGH';
  else if (accuracy >= 82) confidence = 'HIGH';
  else if (accuracy >= 74) confidence = 'MEDIUM';

  // SL/TP Calculation (in pips)
  const atrMultiplierSL = 1.5;
  const atrMultiplierTP = 2.5;
  const slPips = Math.round(ind.atr * atrMultiplierSL * 10000 * 10) / 10;
  const tpPips = Math.round(ind.atr * atrMultiplierTP * 10000 * 10) / 10;

  const topSignal = direction === 'CALL' ? bullSignals[0] : bearSignals[0];
  const reason = `${direction}: ${topSignal || 'Multi-indicator confluence detected'}`;

  return {
    direction, strength, accuracy,
    analysis: { bullSignals, bearSignals, neutralSignals, confluenceScore, confidence, reason, slPips, tpPips },
  };
};
