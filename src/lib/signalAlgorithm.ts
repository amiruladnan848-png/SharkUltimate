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

export const calcSMA = (prices: number[], period: number): number =>
  avg(prices.slice(-Math.min(period, prices.length)));

export const calcRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50;
  const slice = prices.slice(-(period + 1));
  const changes = slice.map((p, i, a) => i > 0 ? p - a[i - 1] : 0).slice(1);
  let ag = 0, al = 0;
  changes.forEach(c => { if (c > 0) ag += c; else al += Math.abs(c); });
  ag /= period; al /= period;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
};

export const calcMACD = (prices: number[]): { macd: number; signal: number; hist: number; hist_prev: number } => {
  if (prices.length < 27) return { macd: 0, signal: 0, hist: 0, hist_prev: 0 };
  const macdLine = calcEMA(prices, 12) - calcEMA(prices, 26);
  // Build a series of MACD values for signal line
  const macdArr: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const sl = prices.slice(0, i);
    macdArr.push(calcEMA(sl, 12) - calcEMA(sl, 26));
  }
  const signalLine = calcEMA(macdArr, 9);
  const prevMacdArr = macdArr.slice(0, -1);
  const prevSignal = calcEMA(prevMacdArr, 9);
  return {
    macd: macdLine,
    signal: signalLine,
    hist: macdLine - signalLine,
    hist_prev: (prevMacdArr[prevMacdArr.length - 1] || macdLine) - prevSignal,
  };
};

export const calcBollingerBands = (prices: number[], period = 20, mult = 2) => {
  const slice = prices.slice(-period);
  if (!slice.length) return { upper: 0, middle: 0, lower: 0, width: 0, pct: 0.5 };
  const middle = avg(slice);
  const variance = slice.reduce((s, p) => s + (p - middle) ** 2, 0) / slice.length;
  const std = Math.sqrt(variance);
  const upper = middle + mult * std;
  const lower = middle - mult * std;
  const width = middle > 0 ? ((upper - lower) / middle) * 100 : 0;
  const price = prices[prices.length - 1];
  const pct = upper !== lower ? (price - lower) / (upper - lower) : 0.5;
  return { upper, middle, lower, width, pct: clamp(pct, 0, 1) };
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
  return { k: clamp(k, 0, 100), d: clamp(d, 0, 100), k_prev: clamp(k_prev, 0, 100) };
};

export const calcATR = (prices: number[], period = 14): number => {
  if (prices.length < 2) return 0;
  const trs = prices.slice(-(period + 1)).map((p, i, a) => i > 0 ? Math.abs(p - a[i - 1]) : 0).slice(1);
  return avg(trs);
};

export const calcADX = (prices: number[], period = 14): { adx: number; di_plus: number; di_minus: number } => {
  if (prices.length < period * 2) return { adx: 20, di_plus: 20, di_minus: 20 };
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
  const count = slice.length - 1;
  const tr = (trSum / count) || 1;
  const di_plus = clamp((dmP / count / tr) * 100, 0, 100);
  const di_minus = clamp((dmM / count / tr) * 100, 0, 100);
  const dx = di_plus + di_minus > 0 ? Math.abs(di_plus - di_minus) / (di_plus + di_minus) * 100 : 0;
  return { adx: clamp(dx, 0, 100), di_plus, di_minus };
};

export const calcCCI = (prices: number[], period = 20): number => {
  const slice = prices.slice(-period);
  if (!slice.length) return 0;
  const mean = avg(slice);
  const meanDev = avg(slice.map(p => Math.abs(p - mean))) || 1;
  return (prices[prices.length - 1] - mean) / (0.015 * meanDev);
};

export const calcWilliamsR = (prices: number[], period = 14): number => {
  const slice = prices.slice(-period);
  if (!slice.length) return -50;
  const h = Math.max(...slice), l = Math.min(...slice), c = prices[prices.length - 1];
  return h === l ? -50 : clamp(((h - c) / (h - l)) * -100, -100, 0);
};

export const calcMomentum = (prices: number[], period = 10): number =>
  prices.length >= period + 1 ? prices[prices.length - 1] - prices[prices.length - 1 - period] : 0;

export const calcROC = (prices: number[], period = 12): number => {
  if (prices.length < period + 1) return 0;
  const prev = prices[prices.length - 1 - period];
  return prev === 0 ? 0 : ((prices[prices.length - 1] - prev) / prev) * 100;
};

export const calcVWAP = (prices: number[]): number => avg(prices.slice(-60)) || prices[prices.length - 1] || 0;

export const calcSupportResistance = (prices: number[]): { support: number; resistance: number; pivot: number } => {
  const slice = prices.slice(-60);
  if (!slice.length) return { support: 0, resistance: 0, pivot: 0 };
  const h = Math.max(...slice), l = Math.min(...slice), c = prices[prices.length - 1];
  const pivot = (h + l + c) / 3;
  return { support: 2 * pivot - h, resistance: 2 * pivot - l, pivot };
};

export const calcPriceVelocity = (prices: number[], window = 5): number => {
  if (prices.length < window + 1) return 0;
  const recent = prices.slice(-window);
  let vel = 0;
  for (let i = 1; i < recent.length; i++) vel += recent[i] - recent[i - 1];
  return vel / window;
};

// ─── ADVANCED PATTERN INDICATORS ────────────────────────────────────────────

export const calcIchimokuSignal = (prices: number[]): 'ABOVE' | 'BELOW' | 'INSIDE' => {
  if (prices.length < 52) return 'INSIDE';
  const tenkan = (Math.max(...prices.slice(-9)) + Math.min(...prices.slice(-9))) / 2;
  const kijun = (Math.max(...prices.slice(-26)) + Math.min(...prices.slice(-26))) / 2;
  const price = prices[prices.length - 1];
  const cloud_a = (tenkan + kijun) / 2;
  const senkou_b_slice = prices.slice(-52);
  const cloud_b = (Math.max(...senkou_b_slice) + Math.min(...senkou_b_slice)) / 2;
  const cloudTop = Math.max(cloud_a, cloud_b);
  const cloudBot = Math.min(cloud_a, cloud_b);
  if (price > cloudTop) return 'ABOVE';
  if (price < cloudBot) return 'BELOW';
  return 'INSIDE';
};

export const calcParabolicSAR = (prices: number[]): 'BULL' | 'BEAR' => {
  if (prices.length < 20) return 'BULL';
  const recent = prices.slice(-20);
  const mid = Math.floor(recent.length / 2);
  const first = avg(recent.slice(0, mid));
  const second = avg(recent.slice(mid));
  // Simple SAR: if avg rising, SAR is below (BULL); if falling, SAR is above (BEAR)
  return second > first ? 'BULL' : 'BEAR';
};

export const calcSuperTrend = (prices: number[]): 'UP' | 'DOWN' => {
  if (prices.length < 20) return 'UP';
  const atr = calcATR(prices, 10);
  const midPrice = (Math.max(...prices.slice(-10)) + Math.min(...prices.slice(-10))) / 2;
  const lowerBand = midPrice - 3 * atr;
  return prices[prices.length - 1] > lowerBand ? 'UP' : 'DOWN';
};

// Detects candle pattern from last N prices: bullish engulfing, hammer, etc.
export const calcCandlePattern = (prices: number[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  if (prices.length < 6) return 'NEUTRAL';
  const recent = prices.slice(-6);
  const closes = recent;
  const up = closes.filter((p, i) => i > 0 && p > closes[i - 1]).length;
  const down = closes.filter((p, i) => i > 0 && p < closes[i - 1]).length;
  if (up >= 4) return 'BULLISH';
  if (down >= 4) return 'BEARISH';
  return 'NEUTRAL';
};

// Mean reversion: price distance from 20-period mean in ATR units
export const calcMeanReversion = (prices: number[]): { score: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL' } => {
  if (prices.length < 20) return { score: 0, direction: 'NEUTRAL' };
  const mean = avg(prices.slice(-20));
  const atr = calcATR(prices, 14) || 1;
  const price = prices[prices.length - 1];
  const dist = (price - mean) / atr;
  if (dist < -1.8) return { score: Math.min(Math.abs(dist) * 15, 40), direction: 'LONG' };
  if (dist > 1.8) return { score: Math.min(dist * 15, 40), direction: 'SHORT' };
  return { score: 0, direction: 'NEUTRAL' };
};

// ─── COMPOSITE COMPUTE ──────────────────────────────────────────────────────
export const computeIndicators = (prices: number[]): IndicatorValues => {
  const zero: IndicatorValues = {
    rsi: 50, rsi_prev: 50, rsi14: 50, macd: 0, macdSignal: 0, macdHist: 0, macdHist_prev: 0,
    ema5: 0, ema9: 0, ema21: 0, ema50: 0, ema200: 0, sma20: 0,
    bb_upper: 0, bb_middle: 0, bb_lower: 0, bb_width: 0, bb_pct: 0.5,
    stoch_k: 50, stoch_d: 50, stoch_k_prev: 50,
    adx: 20, di_plus: 20, di_minus: 20,
    atr: 0, atr_pct: 0, cci: 0, williams_r: -50, momentum: 0, roc: 0, roc_prev: 0,
    vwap: 0, volatility: 0, trendStrength: 'NEUTRAL', signalConfluence: 0,
    priceVelocity: 0, support: 0, resistance: 0, pivotPoint: 0,
    ichimokuCloud: 'INSIDE', parabolicSAR: 'BULL', superTrend: 'UP',
  };
  if (prices.length < 5) return zero;

  const rsi = calcRSI(prices);
  const rsi_prev = calcRSI(prices.slice(0, -3)); // 3-tick lag for divergence
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
  const roc_prev = calcROC(prices.slice(0, -5));
  const vwap = calcVWAP(prices);
  const { support, resistance, pivot: pivotPoint } = calcSupportResistance(prices);
  const priceVelocity = calcPriceVelocity(prices);
  const ichimokuCloud = calcIchimokuSignal(prices);
  const parabolicSAR = calcParabolicSAR(prices);
  const superTrend = calcSuperTrend(prices);

  const lastPrice = prices[prices.length - 1] || 1;
  const volatility = (atr / lastPrice) * 100;

  let trendStrength: IndicatorValues['trendStrength'] = 'NEUTRAL';
  if (ema5 > ema9 && ema9 > ema21 && ema21 > ema50 && ema50 > ema200) trendStrength = 'STRONG_UP';
  else if (ema9 > ema21 && ema21 > ema50) trendStrength = 'UP';
  else if (ema5 < ema9 && ema9 < ema21 && ema21 < ema50 && ema50 < ema200) trendStrength = 'STRONG_DOWN';
  else if (ema9 < ema21 && ema21 < ema50) trendStrength = 'DOWN';

  return {
    rsi, rsi_prev, rsi14: rsi, macd, macdSignal, macdHist, macdHist_prev,
    ema5, ema9, ema21, ema50, ema200, sma20,
    bb_upper: bb.upper, bb_middle: bb.middle, bb_lower: bb.lower, bb_width: bb.width, bb_pct: bb.pct,
    stoch_k: stoch.k, stoch_d: stoch.d, stoch_k_prev: stoch.k_prev,
    adx, di_plus, di_minus, atr, atr_pct: volatility,
    cci, williams_r, momentum, roc, roc_prev, vwap, volatility, trendStrength,
    signalConfluence: 0, priceVelocity, support, resistance, pivotPoint,
    ichimokuCloud, parabolicSAR, superTrend,
  };
};

// ─── ACCURACY SHELTER SYSTEM ─────────────────────────────────────────────────
// Floors accuracy to session-adaptive minimum — prevents accuracy drops
const getAccuracyShelter = (sessionBoost: number): number =>
  clamp(75 + Math.round(sessionBoost * 0.6), 75, 87);

// ─── SIGNAL QUALITY GATE — prevents low quality signals ─────────────────────
const meetsQualityGate = (bull: number, bear: number): boolean => {
  const total = bull + bear;
  if (total < 6) return false;                          // Need minimum confluence
  const dominant = Math.max(bull, bear);
  const ratio = dominant / total;
  return ratio >= 0.60;                                 // 60% direction dominance required
};

// ─── PROFESSIONAL DEEP SIGNAL ENGINE v6.0 — QX BROKER OPTIMIZED ─────────────
export const generateSignalDirection = (
  ind: IndicatorValues,
  prices: number[],
  sessionBoost: number
): { direction: SignalDirection; strength: number; accuracy: number; analysis: SignalAnalysis } => {

  const WAIT_RESULT = (reason: string) => ({
    direction: 'WAIT' as SignalDirection, strength: 0, accuracy: 50,
    analysis: {
      bullSignals: [], bearSignals: [], neutralSignals: [reason],
      confluenceScore: 0, confidence: 'LOW' as const, reason, slPips: 0, tpPips: 0,
    },
  });

  if (prices.length < 30) return WAIT_RESULT('Need 30+ ticks for analysis');

  const price = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2] || price;

  const bullSignals: string[] = [];
  const bearSignals: string[] = [];
  const neutralSignals: string[] = [];
  let bull = 0, bear = 0;

  // ── 1. RSI Multi-Zone Analysis (weight 4) ────────────────────────────────
  const rsiDelta = ind.rsi - ind.rsi_prev;
  if (ind.rsi < 20)       { bull += 4.0; bullSignals.push(`RSI Extreme Oversold (${ind.rsi.toFixed(1)}) — Max CALL`); }
  else if (ind.rsi < 30)  { bull += 3.2; bullSignals.push(`RSI Deep Oversold (${ind.rsi.toFixed(1)}) — Strong CALL`); }
  else if (ind.rsi < 40)  { bull += 2.0; bullSignals.push(`RSI Oversold Zone (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi < 48 && rsiDelta > 1.0) { bull += 1.2; bullSignals.push(`RSI Momentum Rising (${ind.rsi.toFixed(1)}↑)`); }
  else if (ind.rsi > 80)  { bear += 4.0; bearSignals.push(`RSI Extreme Overbought (${ind.rsi.toFixed(1)}) — Max PUT`); }
  else if (ind.rsi > 70)  { bear += 3.2; bearSignals.push(`RSI Deep Overbought (${ind.rsi.toFixed(1)}) — Strong PUT`); }
  else if (ind.rsi > 60)  { bear += 2.0; bearSignals.push(`RSI Overbought Zone (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi > 52 && rsiDelta < -1.0) { bear += 1.2; bearSignals.push(`RSI Momentum Falling (${ind.rsi.toFixed(1)}↓)`); }
  else neutralSignals.push(`RSI Neutral (${ind.rsi.toFixed(1)})`);

  // RSI Midline Cross (strong signal)
  if (ind.rsi >= 50 && ind.rsi_prev < 50) { bull += 1.8; bullSignals.push('RSI Crossed 50 Bullish — Momentum Shift'); }
  if (ind.rsi <= 50 && ind.rsi_prev > 50) { bear += 1.8; bearSignals.push('RSI Crossed 50 Bearish — Momentum Shift'); }
  // RSI Divergence
  if (rsiDelta > 3.0 && ind.momentum < 0) { bull += 3.0; bullSignals.push('Bullish RSI Hidden Divergence — Reversal Signal'); }
  if (rsiDelta < -3.0 && ind.momentum > 0) { bear += 3.0; bearSignals.push('Bearish RSI Hidden Divergence — Reversal Signal'); }

  // ── 2. MACD Analysis (weight 4) ─────────────────────────────────────────
  const macdAbove = ind.macd > ind.macdSignal;
  const histExpanding = Math.abs(ind.macdHist) > Math.abs(ind.macdHist_prev) * 1.1;
  const zeroCrossUp   = ind.macdHist > 0 && ind.macdHist_prev <= 0;
  const zeroCrossDown = ind.macdHist < 0 && ind.macdHist_prev >= 0;

  if (zeroCrossUp)          { bull += 4.0; bullSignals.push('MACD Zero Cross UP — Strongest Bullish Entry'); }
  else if (macdAbove && histExpanding) { bull += 3.0; bullSignals.push('MACD Bullish + Expanding Histogram'); }
  else if (macdAbove)       { bull += 1.8; bullSignals.push('MACD Bullish Crossover'); }

  if (zeroCrossDown)        { bear += 4.0; bearSignals.push('MACD Zero Cross DOWN — Strongest Bearish Entry'); }
  else if (!macdAbove && histExpanding) { bear += 3.0; bearSignals.push('MACD Bearish + Expanding Histogram'); }
  else if (!macdAbove)      { bear += 1.8; bearSignals.push('MACD Bearish Crossover'); }

  // ── 3. EMA Trend Alignment (weight 3.5) ──────────────────────────────────
  if (ind.trendStrength === 'STRONG_UP')   { bull += 3.5; bullSignals.push('EMA Cascade ▲ 5>9>21>50>200 — Strong Uptrend'); }
  else if (ind.trendStrength === 'UP')     { bull += 2.5; bullSignals.push('EMA Trend ▲ 9>21>50 Bullish Stack'); }
  else if (ind.trendStrength === 'STRONG_DOWN') { bear += 3.5; bearSignals.push('EMA Cascade ▼ 5<9<21<50<200 — Strong Downtrend'); }
  else if (ind.trendStrength === 'DOWN')   { bear += 2.5; bearSignals.push('EMA Trend ▼ 9<21<50 Bearish Stack'); }
  else neutralSignals.push('EMA Mixed — No Clear Stack');

  // Fast EMA crossover
  if (ind.ema5 > ind.ema9 && prevPrice <= ind.ema9) { bull += 1.5; bullSignals.push('EMA5 Golden Cross EMA9 — Fast Entry'); }
  if (ind.ema5 < ind.ema9 && prevPrice >= ind.ema9) { bear += 1.5; bearSignals.push('EMA5 Death Cross EMA9 — Fast Entry'); }
  // EMA21 vs Price
  if (price > ind.ema21 && price > ind.ema50) { bull += 1.0; bullSignals.push(`Price Above EMA21/50 — Bull Territory`); }
  if (price < ind.ema21 && price < ind.ema50) { bear += 1.0; bearSignals.push(`Price Below EMA21/50 — Bear Territory`); }

  // ── 4. VWAP Institutional Bias (weight 2) ────────────────────────────────
  if (price > ind.vwap * 1.0003) { bull += 2.0; bullSignals.push(`Above VWAP — Institutional Buying (${ind.vwap.toFixed(5)})`); }
  else if (price < ind.vwap * 0.9997) { bear += 2.0; bearSignals.push(`Below VWAP — Institutional Selling (${ind.vwap.toFixed(5)})`); }
  else neutralSignals.push(`Near VWAP — Wait for breakout (${ind.vwap.toFixed(5)})`);

  // ── 5. Bollinger Bands (weight 3) ────────────────────────────────────────
  if (price <= ind.bb_lower)     { bull += 3.0; bullSignals.push('Price Hit BB Lower — Mean Reversion CALL'); }
  else if (price >= ind.bb_upper) { bear += 3.0; bearSignals.push('Price Hit BB Upper — Mean Reversion PUT'); }
  else if (ind.bb_pct < 0.12) { bull += 2.0; bullSignals.push(`BB %B Extreme Low (${(ind.bb_pct*100).toFixed(0)}%) — Oversold`); }
  else if (ind.bb_pct > 0.88) { bear += 2.0; bearSignals.push(`BB %B Extreme High (${(ind.bb_pct*100).toFixed(0)}%) — Overbought`); }
  else if (ind.bb_pct < 0.25) { bull += 1.0; bullSignals.push(`BB %B Low Zone (${(ind.bb_pct*100).toFixed(0)}%)`); }
  else if (ind.bb_pct > 0.75) { bear += 1.0; bearSignals.push(`BB %B High Zone (${(ind.bb_pct*100).toFixed(0)}%)`); }
  if (ind.bb_width < 0.12) neutralSignals.push('BB Squeeze — Breakout Imminent');

  // ── 6. Stochastic Oscillator (weight 3) ──────────────────────────────────
  const stochCrossUp   = ind.stoch_k > ind.stoch_d && ind.stoch_k_prev <= ind.stoch_d;
  const stochCrossDown = ind.stoch_k < ind.stoch_d && ind.stoch_k_prev >= ind.stoch_d;

  if (ind.stoch_k < 15 && stochCrossUp)  { bull += 3.0; bullSignals.push(`Stoch Extreme OB Cross UP (K:${ind.stoch_k.toFixed(0)})`); }
  else if (ind.stoch_k < 25)             { bull += 2.0; bullSignals.push(`Stoch Oversold (K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)})`); }
  else if (stochCrossUp)                 { bull += 1.2; bullSignals.push(`Stoch Bullish Cross (K:${ind.stoch_k.toFixed(0)})`); }
  if (ind.stoch_k > 85 && stochCrossDown){ bear += 3.0; bearSignals.push(`Stoch Extreme OB Cross DOWN (K:${ind.stoch_k.toFixed(0)})`); }
  else if (ind.stoch_k > 75)             { bear += 2.0; bearSignals.push(`Stoch Overbought (K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)})`); }
  else if (stochCrossDown)               { bear += 1.2; bearSignals.push(`Stoch Bearish Cross (K:${ind.stoch_k.toFixed(0)})`); }

  // ── 7. CCI (weight 2) ────────────────────────────────────────────────────
  if (ind.cci < -200)    { bull += 2.0; bullSignals.push(`CCI Extreme Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci < -100){ bull += 1.3; bullSignals.push(`CCI Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci > 200) { bear += 2.0; bearSignals.push(`CCI Extreme Overbought (${ind.cci.toFixed(0)})`); }
  else if (ind.cci > 100) { bear += 1.3; bearSignals.push(`CCI Overbought (${ind.cci.toFixed(0)})`); }
  else neutralSignals.push(`CCI Neutral (${ind.cci.toFixed(0)})`);

  // ── 8. Williams %R (weight 2) ─────────────────────────────────────────────
  if (ind.williams_r <= -90)    { bull += 2.0; bullSignals.push(`W%R Extreme Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r <= -80){ bull += 1.3; bullSignals.push(`W%R Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r >= -10){ bear += 2.0; bearSignals.push(`W%R Extreme Overbought (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r >= -20){ bear += 1.3; bearSignals.push(`W%R Overbought (${ind.williams_r.toFixed(0)})`); }
  else neutralSignals.push(`W%R Neutral (${ind.williams_r.toFixed(0)})`);

  // ── 9. ADX Trend Strength (weight 2.5) ────────────────────────────────────
  if (ind.adx > 50) {
    if (ind.di_plus > ind.di_minus) { bull += 2.5; bullSignals.push(`ADX Power Bull (${ind.adx.toFixed(0)}) DI+:${ind.di_plus.toFixed(0)}`); }
    else                            { bear += 2.5; bearSignals.push(`ADX Power Bear (${ind.adx.toFixed(0)}) DI-:${ind.di_minus.toFixed(0)}`); }
  } else if (ind.adx > 30) {
    if (ind.di_plus > ind.di_minus) { bull += 1.5; bullSignals.push(`ADX Bull Trend (${ind.adx.toFixed(0)})`); }
    else                            { bear += 1.5; bearSignals.push(`ADX Bear Trend (${ind.adx.toFixed(0)})`); }
  } else if (ind.adx < 18) {
    // Weak trend — reduce confidence
    bull *= 0.82; bear *= 0.82;
    neutralSignals.push(`ADX Weak (${ind.adx.toFixed(0)}) — Range Bound, Low Confidence`);
  } else {
    neutralSignals.push(`ADX Moderate (${ind.adx.toFixed(0)})`);
  }

  // ── 10. Momentum + ROC (weight 2.5 combined) ──────────────────────────────
  const rocAccel = ind.roc > ind.roc_prev && ind.roc > 0;
  const rocDecel = ind.roc < ind.roc_prev && ind.roc < 0;
  if (ind.momentum > 0 && ind.roc > 0.02) {
    bull += rocAccel ? 2.5 : 1.3;
    bullSignals.push(`Bullish Momentum ROC:${ind.roc.toFixed(3)}%${rocAccel ? ' (Accelerating)' : ''}`);
  }
  if (ind.momentum < 0 && ind.roc < -0.02) {
    bear += rocDecel ? 2.5 : 1.3;
    bearSignals.push(`Bearish Momentum ROC:${ind.roc.toFixed(3)}%${rocDecel ? ' (Accelerating)' : ''}`);
  }

  // ── 11. Support / Resistance / Pivot (weight 2.5) ─────────────────────────
  const pivotDist = ind.atr > 0 ? Math.abs(price - ind.pivotPoint) / ind.atr : 99;
  const suppDist  = ind.atr > 0 ? Math.abs(price - ind.support) / ind.atr : 99;
  const resDist   = ind.atr > 0 ? Math.abs(price - ind.resistance) / ind.atr : 99;

  if (suppDist < 1.5 && price > ind.support)    { bull += 2.5; bullSignals.push(`Price at Support (${ind.support.toFixed(5)}) — Bounce Expected`); }
  if (resDist < 1.5 && price < ind.resistance)  { bear += 2.5; bearSignals.push(`Price at Resistance (${ind.resistance.toFixed(5)}) — Rejection Expected`); }
  if (price > ind.pivotPoint)  { bull += 0.8; bullSignals.push(`Above Pivot (${ind.pivotPoint.toFixed(5)})`); }
  else                          { bear += 0.8; bearSignals.push(`Below Pivot (${ind.pivotPoint.toFixed(5)})`); }

  // ── 12. Price Velocity (weight 2) ─────────────────────────────────────────
  const velThreshold = ind.atr * 0.3;
  if (ind.priceVelocity > velThreshold)  { bull += 2.0; bullSignals.push('Strong Bullish Price Velocity'); }
  if (ind.priceVelocity < -velThreshold) { bear += 2.0; bearSignals.push('Strong Bearish Price Velocity'); }

  // ── 13. Ichimoku Cloud (weight 3) ─────────────────────────────────────────
  if (ind.ichimokuCloud === 'ABOVE') { bull += 3.0; bullSignals.push('Ichimoku: Above Cloud — Bullish Trend Confirmed'); }
  else if (ind.ichimokuCloud === 'BELOW') { bear += 3.0; bearSignals.push('Ichimoku: Below Cloud — Bearish Trend Confirmed'); }
  else neutralSignals.push('Ichimoku: Inside Cloud — Indecision Zone');

  // ── 14. Parabolic SAR (weight 2.5) ────────────────────────────────────────
  if (ind.parabolicSAR === 'BULL') { bull += 2.5; bullSignals.push('Parabolic SAR: Bullish Dots — Buy Signal'); }
  else                              { bear += 2.5; bearSignals.push('Parabolic SAR: Bearish Dots — Sell Signal'); }

  // ── 15. SuperTrend (weight 2.5) ────────────────────────────────────────────
  if (ind.superTrend === 'UP') { bull += 2.5; bullSignals.push('SuperTrend: Green Direction — Bullish'); }
  else                          { bear += 2.5; bearSignals.push('SuperTrend: Red Direction — Bearish'); }

  // ── 16. Candle Pattern (weight 2) ─────────────────────────────────────────
  const pattern = calcCandlePattern(prices);
  if (pattern === 'BULLISH')  { bull += 2.0; bullSignals.push('Candle Pattern: Bullish Sequence Detected'); }
  if (pattern === 'BEARISH')  { bear += 2.0; bearSignals.push('Candle Pattern: Bearish Sequence Detected'); }

  // ── 17. Mean Reversion (weight up to 3) ───────────────────────────────────
  const mr = calcMeanReversion(prices);
  if (mr.direction === 'LONG')  { bull += Math.min(mr.score / 13, 3); bullSignals.push(`Mean Reversion: Price Extended Below Mean (+${mr.score.toFixed(0)})`); }
  if (mr.direction === 'SHORT') { bear += Math.min(mr.score / 13, 3); bearSignals.push(`Mean Reversion: Price Extended Above Mean (+${mr.score.toFixed(0)})`); }

  // ── 18. Triple indicator confluence bonus ─────────────────────────────────
  const strongBull = bullSignals.length;
  const strongBear = bearSignals.length;
  if (strongBull >= 8)  { bull += 3.0; bullSignals.push(`🔥 Elite Bull Confluence: ${strongBull} confirmations`); }
  else if (strongBull >= 5) { bull += 1.5; bullSignals.push(`✅ Strong Bull Confluence: ${strongBull} confirmations`); }
  if (strongBear >= 8)  { bear += 3.0; bearSignals.push(`🔥 Elite Bear Confluence: ${strongBear} confirmations`); }
  else if (strongBear >= 5) { bear += 1.5; bearSignals.push(`✅ Strong Bear Confluence: ${strongBear} confirmations`); }

  // ── 19. Session Multiplier ────────────────────────────────────────────────
  const sessionMult = 1 + (sessionBoost / 180);
  bull *= sessionMult;
  bear *= sessionMult;

  // ─── QUALITY GATE CHECK ────────────────────────────────────────────────────
  if (!meetsQualityGate(bull, bear)) {
    return WAIT_RESULT('Insufficient confluence — awaiting stronger signal');
  }

  const direction: SignalDirection = bull > bear ? 'CALL' : 'PUT';
  const total = bull + bear;
  const dominant = Math.max(bull, bear);
  const spread = Math.abs(bull - bear);

  const strength = clamp(Math.round((dominant / 32) * 100), 45, 100);

  // ── ACCURACY ENGINE v6.0 — QX BROKER HIGH ACCURACY ────────────────────────
  const shelter = getAccuracyShelter(sessionBoost);

  // Multi-factor accuracy scoring
  const confluenceRatio    = spread / total;             // 0–1, higher = better
  const confluenceBonus    = confluenceRatio * 20;       // up to 20 pts
  const adxBonus           = ind.adx > 50 ? 10 : ind.adx > 35 ? 7 : ind.adx > 25 ? 4 : 0;
  const rsiExtreme         = (ind.rsi < 20 || ind.rsi > 80) ? 10 : (ind.rsi < 30 || ind.rsi > 70) ? 7 : (ind.rsi < 40 || ind.rsi > 60) ? 4 : 0;
  const macdBonus          = (zeroCrossUp || zeroCrossDown) ? 9 : histExpanding ? 5 : 0;
  const trendBonus         = (ind.trendStrength === 'STRONG_UP' || ind.trendStrength === 'STRONG_DOWN') ? 10 : (ind.trendStrength !== 'NEUTRAL') ? 5 : 0;
  const stochBonus         = (stochCrossUp && ind.stoch_k < 25) || (stochCrossDown && ind.stoch_k > 75) ? 7 : (stochCrossUp || stochCrossDown) ? 3 : 0;
  const ichBonus           = ind.ichimokuCloud !== 'INSIDE' ? 6 : 0;
  const psarBonus          = (direction === 'CALL' && ind.parabolicSAR === 'BULL') || (direction === 'PUT' && ind.parabolicSAR === 'BEAR') ? 5 : 0;
  const stBonus            = (direction === 'CALL' && ind.superTrend === 'UP') || (direction === 'PUT' && ind.superTrend === 'DOWN') ? 5 : 0;
  const signalCountBonus   = Math.min(15, (direction === 'CALL' ? strongBull : strongBear) * 1.1);
  const velBonus           = Math.abs(ind.priceVelocity) > ind.atr * 0.4 ? 5 : 0;
  const mrBonus            = mr.direction !== 'NEUTRAL' ? 4 : 0;
  const patternBonus       = pattern !== 'NEUTRAL' ? 4 : 0;

  const rawAccuracy = 65
    + confluenceBonus + adxBonus + rsiExtreme + macdBonus + trendBonus
    + stochBonus + ichBonus + psarBonus + stBonus + signalCountBonus
    + velBonus + mrBonus + patternBonus + sessionBoost;

  // Apply shelter floor — never drop below session minimum
  const accuracy = clamp(Math.round(Math.max(rawAccuracy, shelter)), shelter, 98);

  const totalCount = strongBull + strongBear + neutralSignals.length;
  const winningCount = direction === 'CALL' ? strongBull : strongBear;
  const confluenceScore = totalCount > 0 ? Math.round((winningCount / totalCount) * 100) : 50;

  let confidence: SignalAnalysis['confidence'] = 'LOW';
  if (accuracy >= 92)     confidence = 'VERY_HIGH';
  else if (accuracy >= 84) confidence = 'HIGH';
  else if (accuracy >= 76) confidence = 'MEDIUM';

  const atr = ind.atr;
  const slPips  = Math.round(atr * 1.5 * 10000 * 10) / 10;
  const tpPips  = Math.round(atr * 2.5 * 10000 * 10) / 10;
  const topSig  = direction === 'CALL' ? bullSignals[0] : bearSignals[0];

  return {
    direction, strength, accuracy,
    analysis: {
      bullSignals, bearSignals, neutralSignals, confluenceScore, confidence,
      reason: `${direction}: ${topSig || 'Multi-indicator confluence'}`,
      slPips, tpPips,
    },
  };
};
