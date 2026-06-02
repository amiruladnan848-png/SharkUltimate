import React, { useState, memo } from 'react';
import { CurrencyPair } from '@/types/trading';
import { REAL_PAIRS, VOLATILITY_PAIRS } from '@/constants/pairs';
import { ChevronDown, Activity } from 'lucide-react';

interface CurrencyPairSelectorProps {
  selected: CurrencyPair;
  onChange: (pair: CurrencyPair) => void;
}

export const CurrencyPairSelector: React.FC<CurrencyPairSelectorProps> = memo(({ selected, onChange }) => {
  const [activeTab, setActiveTab] = useState<'REAL' | 'VOLATILITY'>(selected.type);
  const [open, setOpen] = useState(false);

  const pairs = activeTab === 'REAL' ? REAL_PAIRS : VOLATILITY_PAIRS;

  const handleSelect = (pair: CurrencyPair) => {
    onChange(pair);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-[#1a2540]/80 bg-[#070d1a]/80 backdrop-blur-xl p-4">
      <h3 className="text-[10px] font-black text-[#2a4060] tracking-[0.2em] uppercase mb-3">Select Market Pair</h3>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {(['REAL', 'VOLATILITY'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
            style={{
              background: activeTab === tab ? (tab === 'REAL' ? 'rgba(56,189,248,0.15)' : 'rgba(251,146,60,0.15)') : 'transparent',
              color: activeTab === tab ? (tab === 'REAL' ? '#38bdf8' : '#fb923c') : '#2a4060',
              border: activeTab === tab ? `1px solid ${tab === 'REAL' ? 'rgba(56,189,248,0.3)' : 'rgba(251,146,60,0.3)'}` : '1px solid transparent',
            }}
          >
            {tab === 'REAL' ? '📊 Real Forex' : '⚡ Volatility'}
          </button>
        ))}
      </div>

      {/* Selected display */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150"
        style={{
          background: 'rgba(56,189,248,0.06)',
          border: '1px solid rgba(56,189,248,0.2)',
        }}
      >
        <div className="flex items-center gap-2.5">
          {selected.flag && <span className="text-lg">{selected.flag}</span>}
          <div>
            <div className="text-white font-black text-sm">{selected.symbol}</div>
            <div className="text-[9px] text-[#2a4060] font-semibold">{selected.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
            <Activity className="w-2.5 h-2.5" />
            LIVE
          </div>
          <ChevronDown className={`w-4 h-4 text-[#2a4060] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 rounded-xl border border-[#1a2540] overflow-hidden" style={{ background: '#060c1a', maxHeight: '280px', overflowY: 'auto' }}>
          {pairs.map(pair => {
            const isSelected = pair.id === selected.id;
            return (
              <button
                key={pair.id}
                onClick={() => handleSelect(pair)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-100"
                style={{
                  background: isSelected ? 'rgba(56,189,248,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {pair.flag ? <span className="text-base w-6 text-center">{pair.flag}</span> : <div className="w-6 h-4 rounded text-[8px] flex items-center justify-center font-bold" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>VOL</div>}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{pair.symbol}</div>
                  <div className="text-[9px] text-[#2a4060] truncate">{pair.name}</div>
                </div>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" style={{ boxShadow: '0 0 4px #38bdf8' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

CurrencyPairSelector.displayName = 'CurrencyPairSelector';
export default CurrencyPairSelector;
