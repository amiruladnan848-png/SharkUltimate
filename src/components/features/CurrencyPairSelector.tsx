import React, { useState, memo } from 'react';
import { CurrencyPair } from '@/types/trading';
import { REAL_PAIRS, VOLATILITY_PAIRS } from '@/constants/pairs';
import { isWeekend } from '@/lib/timezone';
import { Lock, TrendingUp, BarChart2 } from 'lucide-react';

interface CurrencyPairSelectorProps {
  selected: CurrencyPair;
  onChange: (pair: CurrencyPair) => void;
}

type Tab = 'REAL' | 'VOLATILITY';

const TAB_CONFIG: { key: Tab; label: string; icon: React.ReactNode; accent: string }[] = [
  { key: 'REAL', label: 'Real Market', icon: <TrendingUp className="w-3.5 h-3.5" />, accent: 'cyan' },
  { key: 'VOLATILITY', label: 'Volatility', icon: <BarChart2 className="w-3.5 h-3.5" />, accent: 'orange' },
];

export const CurrencyPairSelector: React.FC<CurrencyPairSelectorProps> = memo(({ selected, onChange }) => {
  const [activeTab, setActiveTab] = useState<Tab>(selected.type === 'VOLATILITY' ? 'VOLATILITY' : 'REAL');
  const weekend = isWeekend();

  const pairs = activeTab === 'REAL' ? REAL_PAIRS : VOLATILITY_PAIRS;
  const isLocked = activeTab === 'REAL' && weekend;

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-[#0a0f1e]/85 backdrop-blur-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-700/40">
        {TAB_CONFIG.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-wider transition-all duration-200 ${
                active
                  ? tab.accent === 'cyan'
                    ? 'bg-cyan-500/15 text-cyan-400 border-b-2 border-cyan-400'
                    : 'bg-orange-500/15 text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'REAL' && weekend && <Lock className="w-3 h-3 text-orange-400" />}
            </button>
          );
        })}
      </div>

      {/* Weekend lock banner */}
      {isLocked && (
        <div className="flex items-start gap-2.5 px-4 py-2.5 bg-orange-900/25 border-b border-orange-700/30">
          <Lock className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-orange-400 text-xs font-bold">REAL MARKET LOCKED — WEEKEND</p>
            <p className="text-orange-500/70 text-[10px] mt-0.5">Forex markets closed. Use Volatility pairs for 24/7 signals.</p>
          </div>
        </div>
      )}

      {/* Pair Grid */}
      <div className="p-2 grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {pairs.map(pair => {
          const locked = pair.type === 'REAL' && weekend;
          const isSelected = selected.id === pair.id;
          return (
            <button
              key={pair.id}
              disabled={locked}
              onClick={() => !locked && onChange(pair)}
              className={`relative text-left p-2.5 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? pair.type === 'VOLATILITY'
                    ? 'border-orange-500/60 bg-orange-500/12 shadow-sm shadow-orange-500/20'
                    : 'border-cyan-500/60 bg-cyan-500/12 shadow-sm shadow-cyan-500/20'
                  : locked
                  ? 'border-gray-700/20 bg-gray-800/10 opacity-40 cursor-not-allowed'
                  : 'border-gray-700/30 bg-gray-800/20 hover:border-gray-500/50 hover:bg-gray-700/25 active:scale-95'
              }`}
            >
              {locked && <Lock className="absolute top-2 right-2 w-2.5 h-2.5 text-gray-500" />}
              {pair.flag && (
                <div className="text-sm mb-0.5 leading-none">{pair.flag}</div>
              )}
              <div className={`font-bold text-xs ${isSelected ? (pair.type === 'VOLATILITY' ? 'text-orange-300' : 'text-cyan-300') : 'text-white'}`}>
                {pair.symbol}
              </div>
              <div className="text-[9px] text-gray-500 mt-0.5 leading-tight truncate">
                {pair.name.replace(' Index', '').replace('Australian Dollar', 'AUD').replace('British Pound', 'GBP').replace('Canadian Dollar', 'CAD').replace('Swiss Franc', 'CHF').replace('Japanese Yen', 'JPY').replace('New Zealand Dollar', 'NZD')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

CurrencyPairSelector.displayName = 'CurrencyPairSelector';
export default CurrencyPairSelector;
