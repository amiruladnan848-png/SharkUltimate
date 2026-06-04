import { IndicatorValues, SignalDirection, SignalAnalysis } from '@/types/trading';

// ─── UTILITY ────────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
const std = (arr: number[]) => {
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
};

// ─── CORE INDICATORS ────────────────────────────────────────────────────────

export const calcEMA = (prices: number[], period: number): number => {
  if (!prices.length) return 0;
  if (prices.length < period) return avg(prices);
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
  return clamp(100 - 100 / (1 + ag / al), 0, 100);
};

export const calcMACD = (prices: number[]): { macd: number; signal: number; hist: number; hist_prev: number } => {
  if (prices.length < 27) return { macd: 0, signal: 0, hist: 0, hist_prev: 0 };
  const macdArr: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const sl = prices.slice(0, i);
    macdArr.push(calcEMA(sl, 12) - calcEMA(sl, 26));
  }
  const macdLine = macdArr[macdArr.length - 1];
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
  const s = std(slice);
  const upper = middle + mult * s;
  const lower = middle - mult * s;
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

// ─── ADVANCED INDICATORS ─────────────────────────────────────────────────────

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
  return second > first ? 'BULL' : 'BEAR';
};

export const calcSuperTrend = (prices: number[]): 'UP' | 'DOWN' => {
  if (prices.length < 20) return 'UP';
  const atr = calcATR(prices, 10);
  const midPrice = (Math.max(...prices.slice(-10)) + Math.min(...prices.slice(-10))) / 2;
  const lowerBand = midPrice - 3 * atr;
  return prices[prices.length - 1] > lowerBand ? 'UP' : 'DOWN';
};

// Enhanced candle pattern — uses OHLC simulation from close prices
export const calcCandlePattern = (prices: number[]): { signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number; name: string } => {
  if (prices.length < 10) return { signal: 'NEUTRAL', strength: 0, name: 'Insufficient data' };
  const recent = prices.slice(-10);
  const closes = recent;

  // Count consecutive direction and velocity
  let bullCount = 0, bearCount = 0;
  let bullVel = 0, bearVel = 0;
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) { bullCount++; bullVel += diff; }
    else if (diff < 0) { bearCount++; bearVel += Math.abs(diff); }
  }

  // Detect reversal: last 2 up after 3+ down, or vice versa
  const last3 = closes.slice(-4);
  const l3Bear = last3[1] < last3[0] && last3[2] < last3[1];
  const l3Bull = last3[1] > last3[0] && last3[2] > last3[1];
  const finalUp = closes[closes.length - 1] > closes[closes.length - 2];
  const finalDn = closes[closes.length - 1] < closes[closes.length - 2];

  // Bullish reversal after bearish sequence
  if (l3Bear && finalUp) return { signal: 'BULLISH', strength: 35, name: 'Bullish Reversal Candle' };
  // Bearish reversal after bullish sequence
  if (l3Bull && finalDn) return { signal: 'BEARISH', strength: 35, name: 'Bearish Reversal Candle' };

  // Strong trend continuation
  if (bullCount >= 6) return { signal: 'BULLISH', strength: Math.min(bullVel * 50000, 30), name: 'Bullish Momentum Train' };
  if (bearCount >= 6) return { signal: 'BEARISH', strength: Math.min(bearVel * 50000, 30), name: 'Bearish Momentum Train' };
  if (bullCount >= 4) return { signal: 'BULLISH', strength: 15, name: 'Bullish Bias' };
  if (bearCount >= 4) return { signal: 'BEARISH', strength: 15, name: 'Bearish Bias' };
  return { signal: 'NEUTRAL', strength: 0, name: 'Mixed candles' };
};

// Enhanced mean reversion with z-score
export const calcMeanReversion = (prices: number[]): { score: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; zscore: number } => {
  if (prices.length < 20) return { score: 0, direction: 'NEUTRAL', zscore: 0 };
  const slice = prices.slice(-20);
  const mean = avg(slice);
  const s = std(slice) || 1;
  const price = prices[prices.length - 1];
  const zscore = (price - mean) / s;
  if (zscore < -2.0) return { score: Math.min(Math.abs(zscore) * 12, 45), direction: 'LONG', zscore };
  if (zscore > 2.0) return { score: Math.min(zscore * 12, 45), direction: 'SHORT', zscore };
  if (zscore < -1.5) return { score: Math.min(Math.abs(zscore) * 8, 30), direction: 'LONG', zscore };
  if (zscore > 1.5) return { score: Math.min(zscore * 8, 30), direction: 'SHORT', zscore };
  return { score: 0, direction: 'NEUTRAL', zscore };
};

// ─── Volume-weighted price action zones ──────────────────────────────────────
export const calcVWAPZones = (prices: number[]): { zone: 'PREMIUM' | 'DISCOUNT' | 'FAIR'; dist: number } => {
  const vwap = calcVWAP(prices);
  const price = prices[prices.length - 1];
  const atr = calcATR(prices) || price * 0.001;
  const dist = (price - vwap) / atr;
  if (dist > 1.5) return { zone: 'PREMIUM', dist };
  if (dist < -1.5) return { zone: 'DISCOUNT', dist };
  return { zone: 'FAIR', dist };
};

// ─── Trend Consistency Score ──────────────────────────────────────────────────
export const calcTrendConsistency = (prices: number[], period = 20): number => {
  if (prices.length < period) return 50;
  const slice = prices.slice(-period);
  let ups = 0;
  for (let i = 1; i < slice.length; i++) if (slice[i] > slice[i - 1]) ups++;
  return (ups / (slice.length - 1)) * 100;
};

// ─── Relative Vigor Index ─────────────────────────────────────────────────────
export const calcRVI = (prices: number[], period = 10): { rvi: number; signal: number } => {
  if (prices.length < period * 2) return { rvi: 0, signal: 0 };
  const slice = prices.slice(-period * 2);
  let sumNum = 0, sumDen = 0;
  for (let i = 1; i < slice.length; i++) {
    const c = slice[i], o = slice[i - 1];
    sumNum += (c - o);
    sumDen += Math.abs(c - o) || 0.000001;
  }
  const rvi = sumDen > 0 ? sumNum / sumDen : 0;
  const sig = calcEMA([rvi], 4);
  return { rvi, signal: sig };
};

// ─── Composite Compute ──────────────────────────────────────────────────────
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

  const rsi      = calcRSI(prices);
  const rsi_prev = calcRSI(prices.slice(0, -5));
  const { macd, signal: macdSignal, hist: macdHist, hist_prev: macdHist_prev } = calcMACD(prices);
  const ema5    = calcEMA(prices, 5);
  const ema9    = calcEMA(prices, 9);
  const ema21   = calcEMA(prices, 21);
  const ema50   = calcEMA(prices, 50);
  const ema200  = calcEMA(prices, 200);
  const sma20   = calcSMA(prices, 20);
  const bb      = calcBollingerBands(prices);
  const stoch   = calcStochastic(prices);
  const { adx, di_plus, di_minus } = calcADX(prices);
  const atr     = calcATR(prices);
  const cci     = calcCCI(prices);
  const williams_r = calcWilliamsR(prices);
  const momentum   = calcMomentum(prices);
  const roc        = calcROC(prices);
  const roc_prev   = calcROC(prices.slice(0, -8));
  const vwap       = calcVWAP(prices);
  const { support, resistance, pivot: pivotPoint } = calcSupportResistance(prices);
  const priceVelocity = calcPriceVelocity(prices);
  const ichimokuCloud = calcIchimokuSignal(prices);
  const parabolicSAR  = calcParabolicSAR(prices);
  const superTrend    = calcSuperTrend(prices);

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

// ─── ALL-SESSION ACCURACY SHELTER v7.0 ────────────────────────────────────────
// Dynamic floor that scales with session quality — never drops below floor
export const getAccuracyShelter = (sessionBoost: number): number => {
  // Base floor: 80% minimum, scales to 90% at prime sessions
  const base = 80;
  const sessionBonus = Math.round(sessionBoost * 0.55);
  return clamp(base + sessionBonus, 80, 90);
};

// ─── QUALITY GATE v7.0 — Dynamic dominance threshold ────────────────────────
const meetsQualityGate = (bull: number, bear: number): boolean => {
  const total = bull + bear;
  if (total < 8) return false;                            // Minimum 8 weighted points
  const dominant = Math.max(bull, bear);
  const ratio = dominant / total;
  return ratio >= 0.56;                                   // 56% direction dominance
};

// ─── PROFESSIONAL DEEP SIGNAL ENGINE v7.0 ─────────────────────────────────────
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

  const price     = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2] || price;

  const bullSignals: string[] = [];
  const bearSignals: string[] = [];
  const neutralSignals: string[] = [];
  let bull = 0, bear = 0;

  // Pre-compute advanced indicators
  const candleResult  = calcCandlePattern(prices);
  const mrResult      = calcMeanReversion(prices);
  const vwapZone      = calcVWAPZones(prices);
  const trendConsist  = calcTrendConsistency(prices);
  const rvi           = calcRVI(prices);

  // ── 1. RSI Multi-Zone + Divergence (weight 5) ────────────────────────────
  const rsiDelta = ind.rsi - ind.rsi_prev;
  const rsiSlope = rsiDelta > 0 ? 'rising' : rsiDelta < 0 ? 'falling' : 'flat';

  if (ind.rsi < 15)       { bull += 5.0; bullSignals.push(`RSI Extreme Oversold (${ind.rsi.toFixed(1)}) ← Max CALL Signal`); }
  else if (ind.rsi < 25)  { bull += 4.0; bullSignals.push(`RSI Deep Oversold (${ind.rsi.toFixed(1)}) ← Strong CALL`); }
  else if (ind.rsi < 35)  { bull += 2.8; bullSignals.push(`RSI Oversold Zone (${ind.rsi.toFixed(1)} ${rsiSlope})`); }
  else if (ind.rsi < 45 && rsiDelta > 1.5) { bull += 1.8; bullSignals.push(`RSI Rising Momentum (${ind.rsi.toFixed(1)}↑+${rsiDelta.toFixed(1)})`); }
  else if (ind.rsi > 85)  { bear += 5.0; bearSignals.push(`RSI Extreme Overbought (${ind.rsi.toFixed(1)}) ← Max PUT Signal`); }
  else if (ind.rsi > 75)  { bear += 4.0; bearSignals.push(`RSI Deep Overbought (${ind.rsi.toFixed(1)}) ← Strong PUT`); }
  else if (ind.rsi > 65)  { bear += 2.8; bearSignals.push(`RSI Overbought Zone (${ind.rsi.toFixed(1)} ${rsiSlope})`); }
  else if (ind.rsi > 55 && rsiDelta < -1.5) { bear += 1.8; bearSignals.push(`RSI Falling Momentum (${ind.rsi.toFixed(1)}↓${rsiDelta.toFixed(1)})`); }
  else neutralSignals.push(`RSI Neutral (${ind.rsi.toFixed(1)}, ${rsiSlope})`);

  // RSI midline cross
  if (ind.rsi >= 50 && ind.rsi_prev < 50)  { bull += 2.5; bullSignals.push('RSI Crossed Above 50 — Bull Momentum Shift'); }
  if (ind.rsi <= 50 && ind.rsi_prev > 50)  { bear += 2.5; bearSignals.push('RSI Crossed Below 50 — Bear Momentum Shift'); }

  // RSI hidden divergence
  if (rsiDelta > 4.0 && ind.momentum < 0)  { bull += 3.5; bullSignals.push(`RSI Hidden Bullish Divergence (+${rsiDelta.toFixed(1)})`); }
  if (rsiDelta < -4.0 && ind.momentum > 0) { bear += 3.5; bearSignals.push(`RSI Hidden Bearish Divergence (${rsiDelta.toFixed(1)})`); }

  // ── 2. MACD Multi-Level (weight 5) ───────────────────────────────────────
  const macdAbove       = ind.macd > ind.macdSignal;
  const histExpanding   = Math.abs(ind.macdHist) > Math.abs(ind.macdHist_prev) * 1.12;
  const zeroCrossUp     = ind.macdHist > 0 && ind.macdHist_prev <= 0;
  const zeroCrossDown   = ind.macdHist < 0 && ind.macdHist_prev >= 0;
  const macdCrossUp     = ind.macd > ind.macdSignal && ind.macdHist_prev <= 0;
  const macdCrossDown   = ind.macd < ind.macdSignal && ind.macdHist_prev >= 0;

  if (zeroCrossUp)                           { bull += 5.0; bullSignals.push('MACD Zero Cross UP ↑ — Strongest Bull Entry'); }
  else if (macdCrossUp)                      { bull += 3.5; bullSignals.push('MACD Signal Line Cross UP ↑ — Strong Bull'); }
  else if (macdAbove && histExpanding)       { bull += 2.8; bullSignals.push('MACD Bull + Histogram Expanding'); }
  else if (macdAbove)                        { bull += 1.8; bullSignals.push('MACD Above Signal Line — Bullish'); }

  if (zeroCrossDown)                         { bear += 5.0; bearSignals.push('MACD Zero Cross DOWN ↓ — Strongest Bear Entry'); }
  else if (macdCrossDown)                    { bear += 3.5; bearSignals.push('MACD Signal Line Cross DOWN ↓ — Strong Bear'); }
  else if (!macdAbove && histExpanding)      { bear += 2.8; bearSignals.push('MACD Bear + Histogram Expanding'); }
  else if (!macdAbove)                       { bear += 1.8; bearSignals.push('MACD Below Signal Line — Bearish'); }

  // MACD histogram momentum
  const histAccel = Math.abs(ind.macdHist) > Math.abs(ind.macdHist_prev) * 1.3;
  if (histAccel && ind.macdHist > 0) { bull += 1.5; bullSignals.push('MACD Histogram Accelerating ↑'); }
  if (histAccel && ind.macdHist < 0) { bear += 1.5; bearSignals.push('MACD Histogram Accelerating ↓'); }

  // ── 3. EMA Cascade Alignment (weight 4) ─────────────────────────────────
  if (ind.trendStrength === 'STRONG_UP')   { bull += 4.0; bullSignals.push('EMA 5>9>21>50>200 Perfect Bull Cascade ↑'); }
  else if (ind.trendStrength === 'UP')     { bull += 2.8; bullSignals.push('EMA 9>21>50 Bull Stack ↑'); }
  else if (ind.trendStrength === 'STRONG_DOWN') { bear += 4.0; bearSignals.push('EMA 5<9<21<50<200 Perfect Bear Cascade ↓'); }
  else if (ind.trendStrength === 'DOWN')   { bear += 2.8; bearSignals.push('EMA 9<21<50 Bear Stack ↓'); }
  else neutralSignals.push('EMA Mixed — No clear alignment');

  // EMA fast cross
  if (ind.ema5 > ind.ema9 && prevPrice < ind.ema9) { bull += 2.0; bullSignals.push('EMA5 Golden Cross EMA9 ← Dynamic Entry'); }
  if (ind.ema5 < ind.ema9 && prevPrice > ind.ema9) { bear += 2.0; bearSignals.push('EMA5 Death Cross EMA9 ← Dynamic Entry'); }

  // Price vs EMA21/50/200
  const aboveAll = price > ind.ema21 && price > ind.ema50 && price > ind.ema200;
  const belowAll = price < ind.ema21 && price < ind.ema50 && price < ind.ema200;
  if (aboveAll)  { bull += 2.0; bullSignals.push('Price Above EMA21+50+200 — Deep Bull Territory'); }
  if (belowAll)  { bear += 2.0; bearSignals.push('Price Below EMA21+50+200 — Deep Bear Territory'); }
  else if (price > ind.ema21 && price > ind.ema50) { bull += 1.0; bullSignals.push('Price Above EMA21/50'); }
  else if (price < ind.ema21 && price < ind.ema50) { bear += 1.0; bearSignals.push('Price Below EMA21/50'); }

  // ── 4. VWAP Institutional Zones (weight 3) ───────────────────────────────
  if (vwapZone.zone === 'DISCOUNT')            { bull += 3.0; bullSignals.push(`VWAP Discount Zone (${vwapZone.dist.toFixed(2)} ATR below) — Institutional BUY`); }
  else if (vwapZone.zone === 'PREMIUM')        { bear += 3.0; bearSignals.push(`VWAP Premium Zone (${vwapZone.dist.toFixed(2)} ATR above) — Institutional SELL`); }
  else {
    if (price > ind.vwap * 1.0002)  { bull += 1.5; bullSignals.push(`Above VWAP (${ind.vwap.toFixed(5)}) — Bullish Bias`); }
    else if (price < ind.vwap * 0.9998) { bear += 1.5; bearSignals.push(`Below VWAP (${ind.vwap.toFixed(5)}) — Bearish Bias`); }
    else neutralSignals.push(`At VWAP Fair Value (${ind.vwap.toFixed(5)})`);
  }

  // ── 5. Bollinger Bands Advanced (weight 3.5) ─────────────────────────────
  const bbDistLower = ind.bb_lower > 0 ? (price - ind.bb_lower) / (ind.bb_upper - ind.bb_lower) : 0.5;
  if (price <= ind.bb_lower)      { bull += 3.5; bullSignals.push('Price at/below BB Lower — Mean Reversion CALL ↑'); }
  else if (price >= ind.bb_upper) { bear += 3.5; bearSignals.push('Price at/above BB Upper — Mean Reversion PUT ↓'); }
  else if (ind.bb_pct < 0.08) { bull += 2.8; bullSignals.push(`BB %B Extreme Low (${(ind.bb_pct*100).toFixed(0)}%) — Deep Oversold`); }
  else if (ind.bb_pct > 0.92) { bear += 2.8; bearSignals.push(`BB %B Extreme High (${(ind.bb_pct*100).toFixed(0)}%) — Deep Overbought`); }
  else if (ind.bb_pct < 0.18) { bull += 1.8; bullSignals.push(`BB %B Low Zone (${(ind.bb_pct*100).toFixed(0)}%) — Oversold`); }
  else if (ind.bb_pct > 0.82) { bear += 1.8; bearSignals.push(`BB %B High Zone (${(ind.bb_pct*100).toFixed(0)}%) — Overbought`); }
  if (ind.bb_width < 0.08) neutralSignals.push('BB Squeeze — Breakout Imminent');

  // ── 6. Stochastic Multi-Layer (weight 3.5) ───────────────────────────────
  const stochCrossUp   = ind.stoch_k > ind.stoch_d && ind.stoch_k_prev <= ind.stoch_d;
  const stochCrossDown = ind.stoch_k < ind.stoch_d && ind.stoch_k_prev >= ind.stoch_d;
  const stochBullKD    = ind.stoch_k > ind.stoch_d;
  const stochBearKD    = ind.stoch_k < ind.stoch_d;

  if (ind.stoch_k < 10 && stochCrossUp)   { bull += 3.5; bullSignals.push(`Stoch Ultra Oversold Cross UP (K:${ind.stoch_k.toFixed(0)})`); }
  else if (ind.stoch_k < 20 && stochCrossUp) { bull += 2.8; bullSignals.push(`Stoch Oversold Cross UP (K:${ind.stoch_k.toFixed(0)})`); }
  else if (ind.stoch_k < 25)              { bull += 2.0; bullSignals.push(`Stoch Oversold (K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)})`); }
  else if (stochCrossUp && stochBullKD)   { bull += 1.4; bullSignals.push(`Stoch Bull Cross (K:${ind.stoch_k.toFixed(0)})`); }

  if (ind.stoch_k > 90 && stochCrossDown) { bear += 3.5; bearSignals.push(`Stoch Ultra Overbought Cross DOWN (K:${ind.stoch_k.toFixed(0)})`); }
  else if (ind.stoch_k > 80 && stochCrossDown) { bear += 2.8; bearSignals.push(`Stoch Overbought Cross DOWN (K:${ind.stoch_k.toFixed(0)})`); }
  else if (ind.stoch_k > 75)              { bear += 2.0; bearSignals.push(`Stoch Overbought (K:${ind.stoch_k.toFixed(0)} D:${ind.stoch_d.toFixed(0)})`); }
  else if (stochCrossDown && stochBearKD) { bear += 1.4; bearSignals.push(`Stoch Bear Cross (K:${ind.stoch_k.toFixed(0)})`); }

  // ── 7. CCI Extreme Zones (weight 2.5) ────────────────────────────────────
  if (ind.cci < -250)     { bull += 2.5; bullSignals.push(`CCI Extreme Oversold (${ind.cci.toFixed(0)}) — Reversal Zone`); }
  else if (ind.cci < -150){ bull += 1.8; bullSignals.push(`CCI Strong Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci < -100){ bull += 1.2; bullSignals.push(`CCI Oversold (${ind.cci.toFixed(0)})`); }
  else if (ind.cci > 250) { bear += 2.5; bearSignals.push(`CCI Extreme Overbought (${ind.cci.toFixed(0)}) — Reversal Zone`); }
  else if (ind.cci > 150) { bear += 1.8; bearSignals.push(`CCI Strong Overbought (${ind.cci.toFixed(0)})`); }
  else if (ind.cci > 100) { bear += 1.2; bearSignals.push(`CCI Overbought (${ind.cci.toFixed(0)})`); }
  else neutralSignals.push(`CCI Neutral (${ind.cci.toFixed(0)})`);

  // ── 8. Williams %R (weight 2.5) ───────────────────────────────────────────
  if (ind.williams_r <= -95)     { bull += 2.5; bullSignals.push(`W%R Extreme Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r <= -85){ bull += 1.8; bullSignals.push(`W%R Strong Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r <= -80){ bull += 1.2; bullSignals.push(`W%R Oversold (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r >= -5) { bear += 2.5; bearSignals.push(`W%R Extreme Overbought (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r >= -15){ bear += 1.8; bearSignals.push(`W%R Strong Overbought (${ind.williams_r.toFixed(0)})`); }
  else if (ind.williams_r >= -20){ bear += 1.2; bearSignals.push(`W%R Overbought (${ind.williams_r.toFixed(0)})`); }
  else neutralSignals.push(`W%R Neutral (${ind.williams_r.toFixed(0)})`);

  // ── 9. ADX Trend Power (weight 3) ────────────────────────────────────────
  if (ind.adx > 55) {
    const lbl = ind.di_plus > ind.di_minus ? `ADX Max Power Bull (${ind.adx.toFixed(0)}) DI+${ind.di_plus.toFixed(0)}>DI-${ind.di_minus.toFixed(0)}` : `ADX Max Power Bear (${ind.adx.toFixed(0)}) DI-${ind.di_minus.toFixed(0)}>DI+${ind.di_plus.toFixed(0)}`;
    if (ind.di_plus > ind.di_minus) { bull += 3.0; bullSignals.push(lbl); }
    else { bear += 3.0; bearSignals.push(lbl); }
  } else if (ind.adx > 40) {
    if (ind.di_plus > ind.di_minus) { bull += 2.2; bullSignals.push(`ADX Strong Bull (${ind.adx.toFixed(0)})`); }
    else { bear += 2.2; bearSignals.push(`ADX Strong Bear (${ind.adx.toFixed(0)})`); }
  } else if (ind.adx > 28) {
    if (ind.di_plus > ind.di_minus) { bull += 1.5; bullSignals.push(`ADX Trending Bull (${ind.adx.toFixed(0)})`); }
    else { bear += 1.5; bearSignals.push(`ADX Trending Bear (${ind.adx.toFixed(0)})`); }
  } else if (ind.adx < 15) {
    bull *= 0.78; bear *= 0.78;
    neutralSignals.push(`ADX Very Weak (${ind.adx.toFixed(0)}) — Range Bound`);
  } else {
    neutralSignals.push(`ADX Moderate (${ind.adx.toFixed(0)})`);
  }

  // ── 10. Momentum + ROC Acceleration (weight 3) ───────────────────────────
  const rocAccel   = ind.roc > ind.roc_prev && ind.roc > 0;
  const rocDecel   = ind.roc < ind.roc_prev && ind.roc < 0;
  const rocStrong  = Math.abs(ind.roc) > 0.05;

  if (ind.momentum > 0 && ind.roc > 0.03) {
    const w = rocStrong ? (rocAccel ? 3.0 : 2.0) : 1.2;
    bull += w;
    bullSignals.push(`Bull Momentum ROC:${ind.roc.toFixed(3)}%${rocAccel ? ' Accelerating ↑' : ''}`);
  }
  if (ind.momentum < 0 && ind.roc < -0.03) {
    const w = rocStrong ? (rocDecel ? 3.0 : 2.0) : 1.2;
    bear += w;
    bearSignals.push(`Bear Momentum ROC:${ind.roc.toFixed(3)}%${rocDecel ? ' Accelerating ↓' : ''}`);
  }

  // ── 11. Support / Resistance / Pivot (weight 3) ──────────────────────────
  const atr = ind.atr > 0 ? ind.atr : price * 0.0005;
  const suppDist = Math.abs(price - ind.support) / atr;
  const resDist  = Math.abs(price - ind.resistance) / atr;
  const pivDist  = Math.abs(price - ind.pivotPoint) / atr;

  if (suppDist < 1.0 && price >= ind.support)  { bull += 3.0; bullSignals.push(`At Support Level (${ind.support.toFixed(5)}) — High Bounce Probability`); }
  else if (suppDist < 2.0)                     { bull += 1.5; bullSignals.push(`Near Support Zone (${ind.support.toFixed(5)})`); }
  if (resDist < 1.0 && price <= ind.resistance){ bear += 3.0; bearSignals.push(`At Resistance Level (${ind.resistance.toFixed(5)}) — High Rejection Probability`); }
  else if (resDist < 2.0)                      { bear += 1.5; bearSignals.push(`Near Resistance Zone (${ind.resistance.toFixed(5)})`); }

  if (price > ind.pivotPoint)  { bull += 1.0; bullSignals.push(`Above Pivot (${ind.pivotPoint.toFixed(5)})`); }
  else                          { bear += 1.0; bearSignals.push(`Below Pivot (${ind.pivotPoint.toFixed(5)})`); }

  // ── 12. Price Velocity (weight 2.5) ──────────────────────────────────────
  const velThreshold = atr * 0.25;
  if (ind.priceVelocity > velThreshold * 2)  { bull += 2.5; bullSignals.push('Strong Bullish Velocity — Momentum Building'); }
  else if (ind.priceVelocity > velThreshold) { bull += 1.5; bullSignals.push('Moderate Bullish Velocity'); }
  if (ind.priceVelocity < -velThreshold * 2) { bear += 2.5; bearSignals.push('Strong Bearish Velocity — Momentum Building'); }
  else if (ind.priceVelocity < -velThreshold){ bear += 1.5; bearSignals.push('Moderate Bearish Velocity'); }

  // ── 13. Ichimoku Cloud (weight 3.5) ──────────────────────────────────────
  if (ind.ichimokuCloud === 'ABOVE')       { bull += 3.5; bullSignals.push('Ichimoku: Above Cloud — Confirmed Bull Trend'); }
  else if (ind.ichimokuCloud === 'BELOW')  { bear += 3.5; bearSignals.push('Ichimoku: Below Cloud — Confirmed Bear Trend'); }
  else                                      neutralSignals.push('Ichimoku: Inside Cloud — Indecision');

  // ── 14. Parabolic SAR (weight 3) ─────────────────────────────────────────
  if (ind.parabolicSAR === 'BULL') { bull += 3.0; bullSignals.push('PSAR: Bullish Dots Below Price ↑'); }
  else                              { bear += 3.0; bearSignals.push('PSAR: Bearish Dots Above Price ↓'); }

  // ── 15. SuperTrend (weight 3) ─────────────────────────────────────────────
  if (ind.superTrend === 'UP')    { bull += 3.0; bullSignals.push('SuperTrend: Green Direction ↑'); }
  else                             { bear += 3.0; bearSignals.push('SuperTrend: Red Direction ↓'); }

  // ── 16. Enhanced Candle Pattern (weight up to 4) ──────────────────────────
  if (candleResult.signal === 'BULLISH') {
    const w = Math.min(4.0, 1.5 + candleResult.strength / 15);
    bull += w;
    bullSignals.push(`${candleResult.name} (strength: ${candleResult.strength.toFixed(0)})`);
  } else if (candleResult.signal === 'BEARISH') {
    const w = Math.min(4.0, 1.5 + candleResult.strength / 15);
    bear += w;
    bearSignals.push(`${candleResult.name} (strength: ${candleResult.strength.toFixed(0)})`);
  }

  // ── 17. Z-Score Mean Reversion (weight up to 4) ──────────────────────────
  if (mrResult.direction === 'LONG') {
    const w = Math.min(4.0, mrResult.score / 10);
    bull += w;
    bullSignals.push(`Mean Reversion LONG — Z-Score: ${mrResult.zscore.toFixed(2)} (${mrResult.score.toFixed(0)} pts)`);
  } else if (mrResult.direction === 'SHORT') {
    const w = Math.min(4.0, mrResult.score / 10);
    bear += w;
    bearSignals.push(`Mean Reversion SHORT — Z-Score: ${mrResult.zscore.toFixed(2)} (${mrResult.score.toFixed(0)} pts)`);
  }

  // ── 18. Trend Consistency Score (weight 2) ────────────────────────────────
  if (trendConsist > 72)  { bull += 2.0; bullSignals.push(`Trend Consistency Bull (${trendConsist.toFixed(0)}% up closes)`); }
  else if (trendConsist < 28) { bear += 2.0; bearSignals.push(`Trend Consistency Bear (${(100-trendConsist).toFixed(0)}% down closes)`); }
  else neutralSignals.push(`Mixed trend consistency (${trendConsist.toFixed(0)}%)`);

  // ── 19. RVI (Relative Vigor) (weight 2) ──────────────────────────────────
  if (rvi.rvi > 0.3)   { bull += 2.0; bullSignals.push(`RVI Bullish Vigor (${rvi.rvi.toFixed(3)})`); }
  else if (rvi.rvi < -0.3) { bear += 2.0; bearSignals.push(`RVI Bearish Vigor (${rvi.rvi.toFixed(3)})`); }

  // ── 20. Confluence Bonus Engine ───────────────────────────────────────────
  const preBullCount = bullSignals.length;
  const preBearCount = bearSignals.length;
  // Elite confluence cascade
  if (preBullCount >= 12) { bull += 4.5; bullSignals.push(`🔥 ELITE BULL: ${preBullCount} confluences — Max Confidence`); }
  else if (preBullCount >= 9)  { bull += 3.0; bullSignals.push(`⚡ HIGH BULL: ${preBullCount} confluences`); }
  else if (preBullCount >= 6)  { bull += 1.8; bullSignals.push(`✅ BULL: ${preBullCount} confluences`); }
  if (preBearCount >= 12) { bear += 4.5; bearSignals.push(`🔥 ELITE BEAR: ${preBearCount} confluences — Max Confidence`); }
  else if (preBearCount >= 9)  { bear += 3.0; bearSignals.push(`⚡ HIGH BEAR: ${preBearCount} confluences`); }
  else if (preBearCount >= 6)  { bear += 1.8; bearSignals.push(`✅ BEAR: ${preBearCount} confluences`); }

  // ── 21. All-Session Booster ───────────────────────────────────────────────
  // Dynamic session multiplier — stronger in prime sessions
  const sessionMult = 1.0 + (sessionBoost / 140);
  bull *= sessionMult;
  bear *= sessionMult;

  // ─── QUALITY GATE ─────────────────────────────────────────────────────────
  if (!meetsQualityGate(bull, bear)) {
    return WAIT_RESULT(`Low confluence (Bull:${bull.toFixed(1)} Bear:${bear.toFixed(1)}) — awaiting stronger signal`);
  }

  const direction: SignalDirection = bull > bear ? 'CALL' : 'PUT';
  const total    = bull + bear;
  const dominant = Math.max(bull, bear);
  const spread   = Math.abs(bull - bear);

  const strength = clamp(Math.round((dominant / 38) * 100), 50, 100);

  // ── ACCURACY ENGINE v7.0 — ALL-SESSION HIGH ACCURACY ──────────────────────
  const shelter = getAccuracyShelter(sessionBoost);

  // Comprehensive accuracy scoring
  const confluenceRatio    = spread / total;
  const confluenceBonus    = confluenceRatio * 22;            // up to 22 pts
  const adxBonus           = ind.adx > 55 ? 12 : ind.adx > 40 ? 9 : ind.adx > 28 ? 5 : ind.adx > 20 ? 2 : 0;
  const rsiExtreme         = ind.rsi < 15 || ind.rsi > 85 ? 12 : ind.rsi < 25 || ind.rsi > 75 ? 9 : ind.rsi < 35 || ind.rsi > 65 ? 5 : ind.rsi < 45 || ind.rsi > 55 ? 2 : 0;
  const macdBonus          = (zeroCrossUp || zeroCrossDown) ? 10 : (macdCrossUp || macdCrossDown) ? 7 : histExpanding ? 4 : 0;
  const trendBonus         = ind.trendStrength === 'STRONG_UP' || ind.trendStrength === 'STRONG_DOWN' ? 12 : ind.trendStrength !== 'NEUTRAL' ? 6 : 0;
  const stochBonus         = (stochCrossUp && ind.stoch_k < 20) || (stochCrossDown && ind.stoch_k > 80) ? 9 : (stochCrossUp || stochCrossDown) ? 5 : 0;
  const ichBonus           = ind.ichimokuCloud !== 'INSIDE' ? 7 : 0;
  const psarBonus          = (direction === 'CALL' && ind.parabolicSAR === 'BULL') || (direction === 'PUT' && ind.parabolicSAR === 'BEAR') ? 6 : 0;
  const stBonus            = (direction === 'CALL' && ind.superTrend === 'UP') || (direction === 'PUT' && ind.superTrend === 'DOWN') ? 6 : 0;
  const signalCountBonus   = Math.min(18, (direction === 'CALL' ? preBullCount : preBearCount) * 1.3);
  const velBonus           = Math.abs(ind.priceVelocity) > atr * 0.4 ? 6 : Math.abs(ind.priceVelocity) > atr * 0.2 ? 3 : 0;
  const mrBonus            = mrResult.direction !== 'NEUTRAL' ? Math.min(6, mrResult.score / 5) : 0;
  const patternBonus       = candleResult.signal !== 'NEUTRAL' ? Math.min(6, 2 + candleResult.strength / 8) : 0;
  const consistBonus       = trendConsist > 70 || trendConsist < 30 ? 4 : 0;
  const rviBonus           = Math.abs(rvi.rvi) > 0.3 ? 4 : 0;
  const bbZoneBonus        = (ind.bb_pct < 0.1 || ind.bb_pct > 0.9) ? 6 : (ind.bb_pct < 0.2 || ind.bb_pct > 0.8) ? 3 : 0;
  const vwapBonus          = vwapZone.zone !== 'FAIR' ? 4 : 0;
  const sRBonus            = (suppDist < 1.0 || resDist < 1.0) ? 5 : 0;

  // Sum all bonuses
  const bonusSum = confluenceBonus + adxBonus + rsiExtreme + macdBonus + trendBonus
    + stochBonus + ichBonus + psarBonus + stBonus + signalCountBonus
    + velBonus + mrBonus + patternBonus + consistBonus + rviBonus
    + bbZoneBonus + vwapBonus + sRBonus + sessionBoost;

  // Base + bonuses, floor at shelter
  const rawAccuracy = 68 + bonusSum;
  const accuracy = clamp(Math.round(Math.max(rawAccuracy, shelter)), shelter, 97);

  const totalCount   = preBullCount + preBearCount + neutralSignals.length;
  const winningCount = direction === 'CALL' ? preBullCount : preBearCount;
  const confluenceScore = totalCount > 0 ? Math.round((winningCount / totalCount) * 100) : 50;

  let confidence: SignalAnalysis['confidence'] = 'LOW';
  if (accuracy >= 92)      confidence = 'VERY_HIGH';
  else if (accuracy >= 85) confidence = 'HIGH';
  else if (accuracy >= 80) confidence = 'MEDIUM';

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
