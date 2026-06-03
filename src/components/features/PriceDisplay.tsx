import React, { memo } from 'react';
import { TickData, CurrencyPair } from '@/types/trading';
import { Wifi, WifiOff, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceDisplayProps {
  tick: TickData | null;
  pair: CurrencyPair;
  connected: boolean;
  latency?: number;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = memo(({ tick, pair, connected, latency }) => {
  const price = tick?.price ?? 0;
  const decimals = pair.pip <= 0.001 ? 3 : 5;
  const priceStr = price > 0 ? price.toFixed(decimals) : '-.-----';

  // Split price for highlighted pip digit
  const parts = priceStr.split('.');
  const intPart = parts[0] || '0';
  const decPart = parts[1] || '';
  const highlightIdx = pair.pip <= 0.001 ? 2 : 4; // 4th pip digit (main pip)
  const decBefore = decPart.slice(0, highlightIdx);
  const decHighlight = decPart[highlightIdx] ?? '';
  const decAfter = decPart.slice(highlightIdx + 1);

  return (
    <div className="rounded-2xl p-4"
      style={{ border: '1px solid rgba(0,212,255,0.1)', background: 'rgba(4,9,22,0.9)', backdropFilter: 'blur(16px)' }}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {pair.flag && <span className="text-lg">{pair.flag}</span>}
          <div>
            <div className="text-white font-black text-sm">{pair.symbol}</div>
            <div className="text-[9px]" style={{ color: '#1e3870' }}>{pair.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full"
            style={{
              background: connected ? '#34d399' : '#f87171',
              boxShadow: connected ? '0 0 6px rgba(52,211,153,0.8)' : '0 0 6px rgba(248,113,113,0.8)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          {connected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
          {latency !== undefined && connected && (
            <span className="text-[9px] font-mono"
              style={{ color: latency < 80 ? '#34d399' : latency < 200 ? '#fbbf24' : '#f87171' }}>
              {latency}ms
            </span>
          )}
        </div>
      </div>

      {/* Price display */}
      <div className="flex items-baseline gap-0.5 mb-3">
        <span className="text-2xl font-black font-mono tabular-nums" style={{ color: '#8ab8d0' }}>{intPart}.</span>
        <span className="text-2xl font-black font-mono tabular-nums" style={{ color: '#c8dce8' }}>{decBefore}</span>
        <span className="text-4xl font-black font-mono tabular-nums"
          style={{ color: '#00e5ff', textShadow: '0 0 18px rgba(0,229,255,0.7)' }}>{decHighlight}</span>
        <span className="text-xl font-black font-mono tabular-nums" style={{ color: '#4a7090' }}>{decAfter}</span>
      </div>

      {/* Bid / Ask */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <div className="flex items-center gap-1 text-[9px] mb-1" style={{ color: '#1e5040' }}>
            <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> BID
          </div>
          <div className="font-mono font-bold text-xs text-emerald-400">
            {tick?.bid ? tick.bid.toFixed(decimals) : priceStr}
          </div>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <div className="flex items-center gap-1 text-[9px] mb-1" style={{ color: '#501e1e' }}>
            <TrendingDown className="w-2.5 h-2.5 text-red-500" /> ASK
          </div>
          <div className="font-mono font-bold text-xs text-red-400">
            {tick?.ask ? tick.ask.toFixed(decimals) : priceStr}
          </div>
        </div>
      </div>

      {/* QX Broker live feed label */}
      <div className="mt-3 flex items-center justify-between text-[9px]" style={{ color: '#1e3870' }}>
        <span>Deriv WS v3 Feed</span>
        <span className="flex items-center gap-1" style={{ color: '#2a4060' }}>
          <Minus className="w-2 h-2" /> QX Broker Compatible
        </span>
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';
export default PriceDisplay;
