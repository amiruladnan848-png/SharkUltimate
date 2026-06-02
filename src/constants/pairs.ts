import { CurrencyPair } from '@/types/trading';

export const REAL_PAIRS: CurrencyPair[] = [
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar',                  derivSymbol: 'frxEURUSD', tvSymbol: 'FX:EURUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇺🇸' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar',          derivSymbol: 'frxGBPUSD', tvSymbol: 'FX:GBPUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇺🇸' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen',            derivSymbol: 'frxUSDJPY', tvSymbol: 'FX:USDJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇺🇸🇯🇵' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar',       derivSymbol: 'frxAUDUSD', tvSymbol: 'FX:AUDUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇦🇺🇺🇸' },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar',         derivSymbol: 'frxUSDCAD', tvSymbol: 'FX:USDCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇺🇸🇨🇦' },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc',             derivSymbol: 'frxUSDCHF', tvSymbol: 'FX:USDCHF', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇺🇸🇨🇭' },
  { id: 'nzdusd', symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar',      derivSymbol: 'frxNZDUSD', tvSymbol: 'FX:NZDUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇳🇿🇺🇸' },
  { id: 'eurgbp', symbol: 'EUR/GBP', name: 'Euro / British Pound',               derivSymbol: 'frxEURGBP', tvSymbol: 'FX:EURGBP', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇬🇧' },
  { id: 'eurjpy', symbol: 'EUR/JPY', name: 'Euro / Japanese Yen',                 derivSymbol: 'frxEURJPY', tvSymbol: 'FX:EURJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇪🇺🇯🇵' },
  { id: 'gbpjpy', symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen',       derivSymbol: 'frxGBPJPY', tvSymbol: 'FX:GBPJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇬🇧🇯🇵' },
  { id: 'euraud', symbol: 'EUR/AUD', name: 'Euro / Australian Dollar',            derivSymbol: 'frxEURAUD', tvSymbol: 'FX:EURAUD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇦🇺' },
  { id: 'gbpaud', symbol: 'GBP/AUD', name: 'British Pound / Australian Dollar',   derivSymbol: 'frxGBPAUD', tvSymbol: 'FX:GBPAUD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇦🇺' },
  { id: 'audcad', symbol: 'AUD/CAD', name: 'Australian Dollar / Canadian Dollar', derivSymbol: 'frxAUDCAD', tvSymbol: 'FX:AUDCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇦🇺🇨🇦' },
  { id: 'cadjpy', symbol: 'CAD/JPY', name: 'Canadian Dollar / Japanese Yen',     derivSymbol: 'frxCADJPY', tvSymbol: 'FX:CADJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇨🇦🇯🇵' },
  { id: 'chfjpy', symbol: 'CHF/JPY', name: 'Swiss Franc / Japanese Yen',         derivSymbol: 'frxCHFJPY', tvSymbol: 'FX:CHFJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇨🇭🇯🇵' },
  { id: 'gbpcad', symbol: 'GBP/CAD', name: 'British Pound / Canadian Dollar',    derivSymbol: 'frxGBPCAD', tvSymbol: 'FX:GBPCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇨🇦' },
];

export const VOLATILITY_PAIRS: CurrencyPair[] = [
  { id: 'v10',     symbol: 'V 10',       name: 'Volatility 10 Index',       derivSymbol: 'R_10',    tvSymbol: 'VOLATILITY:V10',    type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v25',     symbol: 'V 25',       name: 'Volatility 25 Index',       derivSymbol: 'R_25',    tvSymbol: 'VOLATILITY:V25',    type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v50',     symbol: 'V 50',       name: 'Volatility 50 Index',       derivSymbol: 'R_50',    tvSymbol: 'VOLATILITY:V50',    type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v75',     symbol: 'V 75',       name: 'Volatility 75 Index',       derivSymbol: 'R_75',    tvSymbol: 'VOLATILITY:V75',    type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v100',    symbol: 'V 100',      name: 'Volatility 100 Index',      derivSymbol: 'R_100',   tvSymbol: 'VOLATILITY:V100',   type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v10_1s',  symbol: 'V 10 (1s)', name: 'Volatility 10 (1s) Index',  derivSymbol: '1HZ10V',  tvSymbol: 'VOLATILITY:V10_1S', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v25_1s',  symbol: 'V 25 (1s)', name: 'Volatility 25 (1s) Index',  derivSymbol: '1HZ25V',  tvSymbol: 'VOLATILITY:V25_1S', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v50_1s',  symbol: 'V 50 (1s)', name: 'Volatility 50 (1s) Index',  derivSymbol: '1HZ50V',  tvSymbol: 'VOLATILITY:V50_1S', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v75_1s',  symbol: 'V 75 (1s)', name: 'Volatility 75 (1s) Index',  derivSymbol: '1HZ75V',  tvSymbol: 'VOLATILITY:V75_1S', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v100_1s', symbol: 'V 100 (1s)', name: 'Volatility 100 (1s) Index', derivSymbol: '1HZ100V', tvSymbol: 'VOLATILITY:V100_1S', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
];

export const ALL_PAIRS = [...REAL_PAIRS, ...VOLATILITY_PAIRS];
