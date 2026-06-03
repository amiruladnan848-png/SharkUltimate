export type SignalDirection = 'CALL' | 'PUT' | 'WAIT';
export type MarketType = 'REAL';
export type SessionType = 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | 'OFF';
export type SignalResult = 'WIN' | 'LOSS' | 'PENDING' | 'EXPIRED';

export interface CurrencyPair {
  id: string;
  symbol: string;
  name: string;
  derivSymbol: string;
  tvSymbol: string;
  type: MarketType;
  category: 'forex';
  pip: number;
  flag?: string;
}

export interface IndicatorValues {
  rsi: number;
  rsi_prev: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  macdHist_prev: number;
  ema5: number;
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  sma20: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  bb_width: number;
  bb_pct: number;
  stoch_k: number;
  stoch_d: number;
  stoch_k_prev: number;
  adx: number;
  di_plus: number;
  di_minus: number;
  atr: number;
  atr_pct: number;
  cci: number;
  williams_r: number;
  momentum: number;
  roc: number;
  roc_prev: number;
  vwap: number;
  volatility: number;
  trendStrength: 'STRONG_UP' | 'UP' | 'NEUTRAL' | 'DOWN' | 'STRONG_DOWN';
  signalConfluence: number;
  priceVelocity: number;
  support: number;
  resistance: number;
  pivotPoint: number;
  // Enhanced TradingView merged indicators
  ichimokuCloud?: 'ABOVE' | 'BELOW' | 'INSIDE';
  parabolicSAR?: 'BULL' | 'BEAR';
  superTrend?: 'UP' | 'DOWN';
}

export interface SignalAnalysis {
  bullSignals: string[];
  bearSignals: string[];
  neutralSignals: string[];
  confluenceScore: number;
  confidence: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  slPips: number;
  tpPips: number;
}

export interface MartingaleStep {
  step: number;         // 1 = first recovery, 2 = second recovery
  multiplier: number;   // stake multiplier
  recoveryAmount: string;
  active: boolean;
}

export interface Signal {
  id: string;
  pair: CurrencyPair;
  direction: SignalDirection;
  entryTime: Date;
  expiryTime: Date;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  accuracy: number;
  strength: number;
  indicators: IndicatorValues;
  analysis: SignalAnalysis;
  session: SessionType;
  status: SignalResult;
  countdown: number;
  riskReward: number;
  // MTG/result tracking
  isMartingale?: boolean;
  martingaleStep?: number;
  parentSignalId?: string;
  resolvedAt?: Date;
  resolvedPrice?: number;
}

export interface SignalRecord {
  signal: Signal;
  result: SignalResult;
  resolvedAt: Date;
  resolvedPrice: number;
  priceDiff: number;
}

export interface TickData {
  symbol: string;
  price: number;
  timestamp: number;
  bid?: number;
  ask?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  lastPing: number;
  error?: string;
  latency?: number;
  ticksReceived?: number;
}
