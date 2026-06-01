import React, { useEffect, useRef, useState, memo } from 'react';
import { TickData, CurrencyPair } from '@/types/trading';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Activity } from 'lucide-react';

interface PriceDisplayProps {
  tick: TickData | null;
  pair: CurrencyPair;
  connected: boolean;
  latency?: number;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = memo(({ tick, pair, connected, latency }) => {
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [flash, setFlash] = useState(false);
  const [change, setChange] = useState(0);
  const prevPrice = useRef<number | null>(null);
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    if (!tick) return;
    if (prevPrice.current !== null && prevPrice.current !== tick.price) {
      const diff = tick.price - prevPrice.current;
      setChange(diff);
      setDirection(diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral');
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }
    prevPrice.current = tick.price;
    setTickCount(c => c + 1);
  }, [tick?.price]);

  const formatPrice = (price: number) => {
    const decimals = pair.pip <= 0.00001 ? 5 : pair.pip <= 0.001 ? 3 : 2;
    return price.toFixed(decimals);
  };

  const colorClass = direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-red-400' : 'text-white';
  const glowStyle = direction === 'up'
    ? { textShadow: '0 0 16px rgba(16,185,129,0.7)' }
    : direction === 'down'
    ? { textShadow: '0 0 16px rgba(239,68,68,0.7)' }
    : {};

  return (
    <div className={`rounded-2xl border bg-[#0a0f1e]/85 backdrop-blur-xl p-4 transition-all duration-150 ${
      flash
        ? direction === 'up' ? 'border-emerald-500/60 shadow-sm shadow-emerald-500/20' : 'border-red-500/60 shadow-sm shadow-red-500/20'
        : 'border-gray-700/50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          {connected ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
          <span className={`text-xs font-bold ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
            {connected ? 'LIVE FEED' : 'RECONNECTING'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {latency !== undefined && connected && (
            <span className={latency < 100 ? 'text-emerald-500' : latency < 300 ? 'text-yellow-500' : 'text-red-500'}>
              {latency}ms
            </span>
          )}
          <span>Deriv API</span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider">{pair.name}</div>
          <div className={`text-3xl font-mono font-black transition-all duration-150 ${colorClass}`} style={glowStyle}>
            {tick ? formatPrice(tick.price) : '-.-----'}
          </div>
          {change !== 0 && tick && (
            <div className={`text-xs font-mono mt-0.5 ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(pair.pip <= 0.00001 ? 5 : 3)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 mb-1">
          {direction !== 'neutral' && (
            <div className={`p-1.5 rounded-lg ${direction === 'up' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {direction === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          )}
          <div className="flex items-center gap-1 text-[9px] text-gray-600">
            <Activity className="w-2.5 h-2.5" />
            <span>{tickCount} ticks</span>
          </div>
        </div>
      </div>

      {/* Bid/Ask */}
      {tick && (tick.bid || tick.ask) && (
        <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-gray-700/30 text-[10px]">
          {tick.bid && (
            <div>
              <span className="text-gray-600">BID </span>
              <span className="text-red-400 font-mono font-semibold">{formatPrice(tick.bid)}</span>
            </div>
          )}
          {tick.ask && (
            <div>
              <span className="text-gray-600">ASK </span>
              <span className="text-emerald-400 font-mono font-semibold">{formatPrice(tick.ask)}</span>
            </div>
          )}
          {tick.bid && tick.ask && (
            <div className="ml-auto">
              <span className="text-gray-600">SPREAD </span>
              <span className="text-cyan-400 font-mono font-semibold">{((tick.ask - tick.bid) / pair.pip).toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {/* Last update */}
      {tick && (
        <div className="mt-1.5 text-[9px] text-gray-700 text-right">
          {new Date(tick.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';
export default PriceDisplay;
