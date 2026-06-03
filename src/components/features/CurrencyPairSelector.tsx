import React, { memo } from 'react';
import { CurrencyPair } from '@/types/trading';
import { REAL_PAIRS } from '@/constants/pairs';
import { Activity, ChevronDown, Globe } from 'lucide-react';
import { useState } from 'react';

interface CurrencyPairSelectorProps {
  selected: CurrencyPair;
  onChange: (pair: CurrencyPair) => void;
}

export const CurrencyPairSelector: React.FC<CurrencyPairSelectorProps> = memo(({ selected, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl p-4"
      style={{ border: '1px solid rgba(0,212,255,0.1)', background: 'rgba(4,9,22,0.9)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: '#1e3870' }}>
          Real Forex Pairs
        </h3>
        <div className="flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full font-bold"
          style={{ border: '1px solid rgba(0,229,255,0.25)', background: 'rgba(0,229,255,0.08)', color: '#00e5ff' }}>
          <Globe className="w-2.5 h-2.5" />
          {REAL_PAIRS.length} PAIRS
        </div>
      </div>

      {/* Selected button */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150"
        style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.4)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.2)'}>
        <div className="flex items-center gap-2.5">
          {selected.flag && <span className="text-xl">{selected.flag}</span>}
          <div>
            <div className="text-white font-black text-sm">{selected.symbol}</div>
            <div className="text-[9px]" style={{ color: '#2a4060' }}>{selected.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
            <Activity className="w-2.5 h-2.5" /> LIVE
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: '#2a4060' }} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,229,255,0.12)', background: '#050b1a', maxHeight: '280px', overflowY: 'auto' }}>
          {REAL_PAIRS.map(pair => {
            const sel = pair.id === selected.id;
            return (
              <button key={pair.id} onClick={() => { onChange(pair); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-100"
                style={{
                  background: sel ? 'rgba(0,229,255,0.09)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.025)',
                }}
                onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                {pair.flag && <span className="text-base w-6 text-center flex-shrink-0">{pair.flag}</span>}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black" style={{ color: sel ? '#00e5ff' : '#dde8f5' }}>{pair.symbol}</div>
                  <div className="text-[9px] truncate" style={{ color: '#1e3870' }}>{pair.name}</div>
                </div>
                {sel && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#00e5ff', boxShadow: '0 0 6px rgba(0,229,255,0.9)' }} />
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
