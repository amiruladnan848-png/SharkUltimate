export type SignalDirection = 'CALL' | 'PUT' | 'WAIT';
export type MarketType = 'REAL' | 'VOLATILITY';
export type SessionType = 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | 'OFF';

export interface CurrencyPair {
  id: string;
  symbol: string;
  name: string;
  derivSymbol: string;
  tvSymbol: string; // TradingView symbol
  type: MarketType;
  category: 'forex' | 'volatility' | 'crypto';
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
  bb_pct: number; // BB %B
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
  priceVelocity: number; // rate of price change
  support: number;
  resistance: number;
  pivotPoint: number;
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
  status: 'PENDING' | 'WIN' | 'LOSS' | 'EXPIRED';
  countdown: number;
  riskReward: number;
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
}
