import React, { memo } from 'react';
import { CurrencyPair } from '@/types/trading';
import { REAL_PAIRS } from '@/constants/pairs';
import { Activity, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CurrencyPairSelectorProps {
  selected: CurrencyPair;
  onChange: (pair: CurrencyPair) => void;
}

export const CurrencyPairSelector: React.FC<CurrencyPairSelectorProps> = memo(({ selected, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (pair: CurrencyPair) => {
    onChange(pair);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl p-4" style={{ border: '1px solid rgba(26,37,64,0.8)', background: 'rgba(7,13,26,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#2a4060' }}>Real Forex Pairs</h3>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border text-cyan-400 border-cyan-500/25 bg-cyan-500/8">
          {REAL_PAIRS.length} PAIRS
        </span>
      </div>

      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150"
        style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)' }}
      >
        <div className="flex items-center gap-2.5">
          {selected.flag && <span className="text-lg">{selected.flag}</span>}
          <div>
            <div className="text-white font-black text-sm">{selected.symbol}</div>
            <div className="text-[9px] font-semibold" style={{ color: '#2a4060' }}>{selected.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
            <Activity className="w-2.5 h-2.5" />
            LIVE
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: '#2a4060' }} />
        </div>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border overflow-hidden" style={{ border: '1px solid rgba(26,37,64,0.8)', background: '#060c1a', maxHeight: '260px', overflowY: 'auto' }}>
          {REAL_PAIRS.map(pair => {
            const sel = pair.id === selected.id;
            return (
              <button key={pair.id} onClick={() => handleSelect(pair)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-100"
                style={{
                  background: sel ? 'rgba(0,212,255,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
                onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {pair.flag && <span className="text-base w-6 text-center flex-shrink-0">{pair.flag}</span>}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{pair.symbol}</div>
                  <div className="text-[9px] truncate" style={{ color: '#2a4060' }}>{pair.name}</div>
                </div>
                {sel && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" style={{ boxShadow: '0 0 5px rgba(0,212,255,0.8)' }} />}
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
