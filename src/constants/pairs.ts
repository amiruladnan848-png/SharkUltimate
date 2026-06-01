import { CurrencyPair } from '@/types/trading';

export const REAL_PAIRS: CurrencyPair[] = [
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', derivSymbol: 'frxEURUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇺🇸' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar', derivSymbol: 'frxGBPUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇺🇸' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', derivSymbol: 'frxUSDJPY', type: 'REAL', category: 'forex', pip: 0.001, flag: '🇺🇸🇯🇵' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', derivSymbol: 'frxAUDUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇦🇺🇺🇸' },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', derivSymbol: 'frxUSDCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇺🇸🇨🇦' },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', derivSymbol: 'frxUSDCHF', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇺🇸🇨🇭' },
  { id: 'nzdusd', symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', derivSymbol: 'frxNZDUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇳🇿🇺🇸' },
  { id: 'eurgbp', symbol: 'EUR/GBP', name: 'Euro / British Pound', derivSymbol: 'frxEURGBP', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇬🇧' },
  { id: 'eurjpy', symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', derivSymbol: 'frxEURJPY', type: 'REAL', category: 'forex', pip: 0.001, flag: '🇪🇺🇯🇵' },
  { id: 'gbpjpy', symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', derivSymbol: 'frxGBPJPY', type: 'REAL', category: 'forex', pip: 0.001, flag: '🇬🇧🇯🇵' },
  { id: 'euraud', symbol: 'EUR/AUD', name: 'Euro / Australian Dollar', derivSymbol: 'frxEURAUD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇦🇺' },
  { id: 'gbpaud', symbol: 'GBP/AUD', name: 'British Pound / Australian Dollar', derivSymbol: 'frxGBPAUD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇦🇺' },
  { id: 'audcad', symbol: 'AUD/CAD', name: 'Australian Dollar / Canadian Dollar', derivSymbol: 'frxAUDCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇦🇺🇨🇦' },
  { id: 'cadjpy', symbol: 'CAD/JPY', name: 'Canadian Dollar / Japanese Yen', derivSymbol: 'frxCADJPY', type: 'REAL', category: 'forex', pip: 0.001, flag: '🇨🇦🇯🇵' },
  { id: 'chfjpy', symbol: 'CHF/JPY', name: 'Swiss Franc / Japanese Yen', derivSymbol: 'frxCHFJPY', type: 'REAL', category: 'forex', pip: 0.001, flag: '🇨🇭🇯🇵' },
  { id: 'gbpcad', symbol: 'GBP/CAD', name: 'British Pound / Canadian Dollar', derivSymbol: 'frxGBPCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇨🇦' },
];

export const VOLATILITY_PAIRS: CurrencyPair[] = [
  { id: 'v10', symbol: 'V 10', name: 'Volatility 10 Index', derivSymbol: 'R_10', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v25', symbol: 'V 25', name: 'Volatility 25 Index', derivSymbol: 'R_25', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v50', symbol: 'V 50', name: 'Volatility 50 Index', derivSymbol: 'R_50', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v75', symbol: 'V 75', name: 'Volatility 75 Index', derivSymbol: 'R_75', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v100', symbol: 'V 100', name: 'Volatility 100 Index', derivSymbol: 'R_100', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v10_1s', symbol: 'V 10 (1s)', name: 'Volatility 10 (1s) Index', derivSymbol: '1HZ10V', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v25_1s', symbol: 'V 25 (1s)', name: 'Volatility 25 (1s) Index', derivSymbol: '1HZ25V', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v50_1s', symbol: 'V 50 (1s)', name: 'Volatility 50 (1s) Index', derivSymbol: '1HZ50V', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v75_1s', symbol: 'V 75 (1s)', name: 'Volatility 75 (1s) Index', derivSymbol: '1HZ75V', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
  { id: 'v100_1s', symbol: 'V 100 (1s)', name: 'Volatility 100 (1s) Index', derivSymbol: '1HZ100V', type: 'VOLATILITY', category: 'volatility', pip: 0.001 },
];

export const ALL_PAIRS = [...REAL_PAIRS, ...VOLATILITY_PAIRS];
