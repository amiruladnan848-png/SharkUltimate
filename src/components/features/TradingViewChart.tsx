import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { CurrencyPair, Signal } from '@/types/trading';
import { Maximize2, Minimize2, RefreshCw, Scan, ChevronDown } from 'lucide-react';

interface TradingViewChartProps {
  pair: CurrencyPair;
  signal: Signal | null;
  isScanning: boolean;
}

const INTERVALS = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1h', value: '60' },
];

export const TradingViewChart: React.FC<TradingViewChartProps> = memo(({ pair, signal, isScanning }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [interval, setInterval_] = useState('1');
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scanAngle, setScanAngle] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const animRef = useRef<number>();
  const scanStartRef = useRef<number>(0);

  // Laser scan animation
  useEffect(() => {
    if (isScanning) {
      scanStartRef.current = performance.now();
      const SCAN_DURATION = INTERVALS.length * 200 + 3500;

      const animate = (now: number) => {
        const elapsed = now - scanStartRef.current;
        const t = Math.min(elapsed / SCAN_DURATION, 1);
        setScanProgress(t * 100);
        // Oscillate angle for laser sweep
        setScanAngle(Math.sin(elapsed / 180) * 90);
        if (t < 1) animRef.current = requestAnimationFrame(animate);
        else { setScanProgress(0); setScanAngle(0); }
      };
      animRef.current = requestAnimationFrame(animate);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setScanProgress(0);
      setScanAngle(0);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isScanning]);

  const buildSrc = useCallback(() => {
    // Use TradingView widget URL - this is a public embeddable widget
    const sym = encodeURIComponent(pair.tvSymbol);
    return `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${sym}&interval=${interval}&hidesidetoolbar=0&hidetoptoolbar=0&saveimage=0&toolbarbg=0d1628&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies&theme=dark&style=1&timezone=Asia%2FDhaka&withdateranges=1&showpopupbutton=0&locale=en&utm_source=tradowix.com&utm_medium=widget_new&utm_campaign=chart&utm_term=${encodeURIComponent(pair.tvSymbol)}`;
  }, [pair.tvSymbol, interval]);

  useEffect(() => {
    setLoaded(false);
    if (iframeRef.current) {
      iframeRef.current.src = buildSrc();
    }
  }, [buildSrc]);

  const handleReload = () => {
    setLoaded(false);
    if (iframeRef.current) {
      iframeRef.current.src = buildSrc();
    }
  };

  const chartHeight = expanded ? 'h-[620px]' : 'h-[420px]';

  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all duration-500 ${
      isScanning
        ? 'border-cyan-400/60 shadow-2xl shadow-cyan-500/20'
        : signal?.direction === 'CALL'
        ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10'
        : signal?.direction === 'PUT'
        ? 'border-red-500/40 shadow-lg shadow-red-500/10'
        : 'border-[#1a2540]/80'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1628]/95 border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Pair label */}
          <div className="flex items-center gap-2">
            {pair.flag && <span className="text-base">{pair.flag}</span>}
            <span className="text-white font-black text-sm tracking-wider">{pair.symbol}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              pair.type === 'REAL'
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-orange-400 border-orange-500/30 bg-orange-500/10'
            }`}>{pair.type}</span>
          </div>

          {/* Interval selector */}
          <div className="flex items-center gap-1 ml-2">
            {INTERVALS.map(iv => (
              <button
                key={iv.value}
                onClick={() => setInterval_(iv.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 ${
                  interval === iv.value
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Signal badge on chart */}
          {signal && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black border ${
              signal.direction === 'CALL'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-red-500/20 text-red-400 border-red-500/40'
            }`}>
              {signal.direction === 'CALL' ? '▲' : '▼'} {signal.direction} {signal.accuracy}%
            </div>
          )}

          <button onClick={handleReload} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-cyan-400 transition-all">
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className={`relative ${chartHeight} transition-all duration-500 bg-[#070d1a]`}>

        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#070d1a]">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-3 animate-pulse">
              <Scan className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-cyan-400/70 text-xs font-mono animate-pulse">Loading TradingView Chart...</p>
            <p className="text-gray-600 text-[10px] mt-1">{pair.tvSymbol} • {interval}M</p>
            {/* Animated bars */}
            <div className="flex items-end gap-1 mt-4 h-8">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i}
                  className="w-2 bg-cyan-500/30 rounded-sm animate-pulse"
                  style={{
                    height: `${20 + Math.sin(i * 0.8) * 12}px`,
                    animationDelay: `${i * 80}ms`,
                    animationDuration: '1.2s',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TradingView iframe */}
        <iframe
          ref={iframeRef}
          src={buildSrc()}
          className="w-full h-full border-0"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
          onLoad={() => setLoaded(true)}
          allowTransparency={true}
          frameBorder="0"
          scrolling="no"
          title={`TradingView Chart - ${pair.symbol}`}
        />

        {/* ── LASER SCANNER OVERLAY ──────────────────────────────────── */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* Dark scan overlay */}
            <div className="absolute inset-0 bg-[#050814]/30" />

            {/* Horizontal scan laser beam */}
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                top: `${50 + Math.sin(scanAngle * Math.PI / 180) * 35}%`,
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.2) 20%, rgba(0,212,255,0.9) 50%, rgba(0,212,255,0.2) 80%, transparent 100%)',
                boxShadow: '0 0 12px 2px rgba(0,212,255,0.5), 0 0 30px 6px rgba(0,212,255,0.2)',
                transition: 'top 0.08s linear',
              }}
            />

            {/* Vertical scan beam */}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${scanProgress}%`,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.3) 20%, rgba(0,212,255,1.0) 50%, rgba(0,212,255,0.3) 80%, transparent 100%)',
                boxShadow: '0 0 8px 1px rgba(0,212,255,0.6), 0 0 20px 4px rgba(0,212,255,0.2)',
                transition: 'left 0.05s linear',
              }}
            />

            {/* Corner scanbox */}
            {[
              { top: '20%', left: '20%', rotate: '0deg' },
              { top: '20%', right: '20%', rotate: '90deg' },
              { bottom: '20%', left: '20%', rotate: '270deg' },
              { bottom: '20%', right: '20%', rotate: '180deg' },
            ].map((style, i) => (
              <div key={i} className="absolute w-8 h-8" style={style as React.CSSProperties}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M2 14 L2 2 L14 2" stroke="rgba(0,212,255,0.9)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            ))}

            {/* Scan grid lines */}
            {[25, 50, 75].map(pct => (
              <div key={pct}
                className="absolute left-0 right-0 h-px"
                style={{
                  top: `${pct}%`,
                  background: `rgba(0,212,255,${0.04 + Math.sin(Date.now() / 1000 + pct) * 0.02})`,
                }}
              />
            ))}

            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/50" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/50" />
                <div className="absolute inset-4 rounded-full border border-cyan-400/40 animate-ping" />
                <div className="absolute inset-6 rounded-full border border-cyan-400/60" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0a1020]/60">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-none"
                style={{ width: `${scanProgress}%`, boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}
              />
            </div>

            {/* Scan label */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050814]/80 border border-cyan-500/40 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase">
                SHARK LASER SCAN — DEEP ANALYSIS
              </span>
              <span className="text-cyan-500/70 text-[10px] font-mono">{Math.round(scanProgress)}%</span>
            </div>
          </div>
        )}

        {/* Signal overlay after scan */}
        {signal && !isScanning && (
          <div className={`absolute bottom-3 left-3 right-3 rounded-xl border backdrop-blur-sm px-3 py-2 flex items-center gap-3 ${
            signal.direction === 'CALL'
              ? 'bg-emerald-900/60 border-emerald-500/50'
              : 'bg-red-900/60 border-red-500/50'
          }`}>
            <div className={`text-2xl font-black ${signal.direction === 'CALL' ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.direction === 'CALL' ? '▲' : '▼'}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-black ${signal.direction === 'CALL' ? 'text-emerald-400' : 'text-red-400'}`}>
                {signal.direction} — {signal.pair.symbol}
              </div>
              <div className="text-[10px] text-gray-400">
                Entry: <span className="text-cyan-400 font-mono">{signal.entryPrice.toFixed(5)}</span>
                &nbsp;|&nbsp; SL: <span className="text-red-400 font-mono">{signal.stopLoss.toFixed(5)}</span>
                &nbsp;|&nbsp; TP: <span className="text-emerald-400 font-mono">{signal.takeProfit.toFixed(5)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-black ${signal.accuracy >= 85 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {signal.accuracy}%
              </div>
              <div className="text-[9px] text-gray-500">Accuracy</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
export default TradingViewChart;
