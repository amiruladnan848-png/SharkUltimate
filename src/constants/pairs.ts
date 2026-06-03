import { CurrencyPair } from '@/types/trading';

// Real Forex Pairs Only — No Volatility/OTC
export const REAL_PAIRS: CurrencyPair[] = [
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar',                   derivSymbol: 'frxEURUSD', tvSymbol: 'FX:EURUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇺🇸' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar',           derivSymbol: 'frxGBPUSD', tvSymbol: 'FX:GBPUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇺🇸' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen',             derivSymbol: 'frxUSDJPY', tvSymbol: 'FX:USDJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇺🇸🇯🇵' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar',        derivSymbol: 'frxAUDUSD', tvSymbol: 'FX:AUDUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇦🇺🇺🇸' },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar',          derivSymbol: 'frxUSDCAD', tvSymbol: 'FX:USDCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇺🇸🇨🇦' },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc',              derivSymbol: 'frxUSDCHF', tvSymbol: 'FX:USDCHF', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇺🇸🇨🇭' },
  { id: 'nzdusd', symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar',       derivSymbol: 'frxNZDUSD', tvSymbol: 'FX:NZDUSD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇳🇿🇺🇸' },
  { id: 'eurgbp', symbol: 'EUR/GBP', name: 'Euro / British Pound',                derivSymbol: 'frxEURGBP', tvSymbol: 'FX:EURGBP', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇬🇧' },
  { id: 'eurjpy', symbol: 'EUR/JPY', name: 'Euro / Japanese Yen',                  derivSymbol: 'frxEURJPY', tvSymbol: 'FX:EURJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇪🇺🇯🇵' },
  { id: 'gbpjpy', symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen',        derivSymbol: 'frxGBPJPY', tvSymbol: 'FX:GBPJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇬🇧🇯🇵' },
  { id: 'euraud', symbol: 'EUR/AUD', name: 'Euro / Australian Dollar',             derivSymbol: 'frxEURAUD', tvSymbol: 'FX:EURAUD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇪🇺🇦🇺' },
  { id: 'gbpaud', symbol: 'GBP/AUD', name: 'British Pound / Australian Dollar',    derivSymbol: 'frxGBPAUD', tvSymbol: 'FX:GBPAUD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇦🇺' },
  { id: 'audcad', symbol: 'AUD/CAD', name: 'Australian Dollar / Canadian Dollar',  derivSymbol: 'frxAUDCAD', tvSymbol: 'FX:AUDCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇦🇺🇨🇦' },
  { id: 'cadjpy', symbol: 'CAD/JPY', name: 'Canadian Dollar / Japanese Yen',      derivSymbol: 'frxCADJPY', tvSymbol: 'FX:CADJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇨🇦🇯🇵' },
  { id: 'chfjpy', symbol: 'CHF/JPY', name: 'Swiss Franc / Japanese Yen',          derivSymbol: 'frxCHFJPY', tvSymbol: 'FX:CHFJPY', type: 'REAL', category: 'forex', pip: 0.001,   flag: '🇨🇭🇯🇵' },
  { id: 'gbpcad', symbol: 'GBP/CAD', name: 'British Pound / Canadian Dollar',     derivSymbol: 'frxGBPCAD', tvSymbol: 'FX:GBPCAD', type: 'REAL', category: 'forex', pip: 0.00001, flag: '🇬🇧🇨🇦' },
];

export const ALL_PAIRS = REAL_PAIRS;
