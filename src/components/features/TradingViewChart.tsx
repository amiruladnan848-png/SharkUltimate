import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { CurrencyPair, Signal } from '@/types/trading';
import { Maximize2, Minimize2, RefreshCw, Scan, ZoomIn } from 'lucide-react';

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
  const [interval, setInterval_] = useState('1');
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Laser scanner state
  const [scanLine, setScanLine] = useState(50);
  const [scanVLine, setScanVLine] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState<'horizontal' | 'vertical' | 'grid' | 'pulse'>('horizontal');
  const animRef = useRef<number>();
  const scanStartRef = useRef<number>(0);
  const SCAN_DURATION = 4200;

  useEffect(() => {
    if (!isScanning) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setScanProgress(0);
      setScanLine(50);
      setScanVLine(0);
      setScanPhase('horizontal');
      return;
    }
    scanStartRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - scanStartRef.current;
      const t = Math.min(elapsed / SCAN_DURATION, 1);
      setScanProgress(t * 100);

      // Phase 1 (0–25%): Horizontal sweep
      if (t < 0.25) {
        setScanPhase('horizontal');
        setScanLine(((t / 0.25) * 100));
      }
      // Phase 2 (25–50%): Vertical sweep
      else if (t < 0.50) {
        setScanPhase('vertical');
        setScanVLine(((t - 0.25) / 0.25) * 100);
      }
      // Phase 3 (50–75%): Grid scan
      else if (t < 0.75) {
        setScanPhase('grid');
        setScanLine(50 + Math.sin((elapsed / 200)) * 35);
        setScanVLine(((t - 0.50) / 0.25) * 100);
      }
      // Phase 4 (75–100%): Pulse
      else {
        setScanPhase('pulse');
        setScanLine(50 + Math.sin((elapsed / 100)) * 45);
        setScanVLine(50 + Math.cos((elapsed / 130)) * 45);
      }

      if (t < 1) animRef.current = requestAnimationFrame(animate);
      else { setScanProgress(100); }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isScanning]);

  const buildSrc = useCallback(() => {
    const sym = encodeURIComponent(pair.tvSymbol);
    // Professional TradingView widget with RSI + MACD studies, Dhaka timezone
    return `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart_${pair.id}&symbol=${sym}&interval=${interval}&hidesidetoolbar=0&hidetoptoolbar=0&saveimage=0&toolbarbg=070d1a&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies%1FBollingerBandsR%40tv-basicstudies&theme=dark&style=1&timezone=Asia%2FDhaka&withdateranges=1&showpopupbutton=0&locale=en&allow_symbol_change=0&details=1&hotlist=0&calendar=0&show_popup_button=0&utm_source=tradowix.com&utm_medium=widget_new&utm_campaign=chart&utm_term=${encodeURIComponent(pair.symbol)}`;
  }, [pair.tvSymbol, pair.id, pair.symbol, interval]);

  useEffect(() => {
    setLoaded(false);
    if (iframeRef.current) iframeRef.current.src = buildSrc();
  }, [buildSrc]);

  const handleReload = () => {
    setLoaded(false);
    if (iframeRef.current) iframeRef.current.src = buildSrc();
  };

  const chartH = expanded ? 'h-[680px]' : 'h-[460px]';

  const borderColor = isScanning
    ? 'rgba(0,212,255,0.7)'
    : signal?.direction === 'CALL'
    ? 'rgba(16,185,129,0.5)'
    : signal?.direction === 'PUT'
    ? 'rgba(239,68,68,0.5)'
    : 'rgba(26,37,64,0.8)';

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: isScanning
          ? '0 0 40px rgba(0,212,255,0.15), 0 0 80px rgba(0,212,255,0.06)'
          : signal?.direction === 'CALL'
          ? '0 0 30px rgba(16,185,129,0.08)'
          : signal?.direction === 'PUT'
          ? '0 0 30px rgba(239,68,68,0.08)'
          : 'none',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#070d1a]/98 border-b border-white/5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {pair.flag && <span className="text-base">{pair.flag}</span>}
            <span className="text-white font-black text-sm tracking-wider">{pair.symbol}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">REAL</span>
            {isScanning && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-500/10">
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[9px] font-bold text-cyan-400">SCANNING</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {INTERVALS.map(iv => (
              <button key={iv.value} onClick={() => setInterval_(iv.value)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all duration-150 ${
                  interval === iv.value
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
                }`}
              >{iv.label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {signal && !isScanning && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black border ${
              signal.direction === 'CALL'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-red-500/20 text-red-400 border-red-500/40'
            }`}>
              {signal.direction === 'CALL' ? '▲' : '▼'} {signal.direction} — {signal.accuracy}%
            </div>
          )}
          <button onClick={handleReload} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-gray-300 transition-all" title="Reload Chart">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-cyan-400 transition-all" title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Chart area ─────────────────────────────────────────────── */}
      <div className={`relative ${chartH} transition-all duration-500 bg-[#060c1a]`}>

        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#060c1a]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(56,100,248,0.15))', border: '1px solid rgba(0,212,255,0.25)' }}>
              <Scan className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-cyan-400/80 text-xs font-mono animate-pulse tracking-widest">LOADING TRADINGVIEW CHART...</p>
            <p className="text-gray-700 text-[10px] mt-1 font-mono">{pair.tvSymbol} • {interval}M • Dhaka TZ</p>
            <div className="flex items-end gap-1 mt-5 h-10">
              {Array.from({ length: 22 }, (_, i) => (
                <div key={i} className="w-2 rounded-sm animate-pulse"
                  style={{
                    height: `${15 + Math.sin(i * 0.7) * 18}px`,
                    background: i % 3 === 0 ? 'rgba(0,212,255,0.35)' : 'rgba(56,189,248,0.15)',
                    animationDelay: `${i * 60}ms`,
                    animationDuration: '1.4s',
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
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
          onLoad={() => setLoaded(true)}
          allowTransparency={true}
          frameBorder="0"
          scrolling="no"
          title={`TradingView — ${pair.symbol}`}
        />

        {/* ── PROFESSIONAL LASER SCANNER OVERLAY ──────────────────── */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* Overlay tint */}
            <div className="absolute inset-0" style={{ background: 'rgba(4,10,22,0.25)' }} />

            {/* Horizontal laser beam */}
            <div className="absolute left-0 right-0 h-[2px] transition-none"
              style={{
                top: `${scanLine}%`,
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.1) 15%, rgba(0,212,255,1) 50%, rgba(0,212,255,0.1) 85%, transparent 100%)',
                boxShadow: '0 0 18px 4px rgba(0,212,255,0.6), 0 0 40px 10px rgba(0,212,255,0.2)',
                filter: 'blur(0.4px)',
              }}
            />

            {/* Vertical laser beam */}
            {(scanPhase === 'vertical' || scanPhase === 'grid' || scanPhase === 'pulse') && (
              <div className="absolute top-0 bottom-0 w-[2px] transition-none"
                style={{
                  left: `${scanVLine}%`,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.1) 15%, rgba(0,212,255,1) 50%, rgba(0,212,255,0.1) 85%, transparent 100%)',
                  boxShadow: '0 0 14px 3px rgba(0,212,255,0.5), 0 0 30px 8px rgba(0,212,255,0.18)',
                  filter: 'blur(0.4px)',
                }}
              />
            )}

            {/* Scan grid lines */}
            {[20, 40, 60, 80].map(pct => (
              <React.Fragment key={pct}>
                <div className="absolute left-0 right-0 h-px"
                  style={{ top: `${pct}%`, background: 'rgba(0,212,255,0.06)' }} />
                <div className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${pct}%`, background: 'rgba(0,212,255,0.06)' }} />
              </React.Fragment>
            ))}

            {/* Corner brackets */}
            {[
              { style: { top: '8%', left: '6%' }, rotate: '0deg' },
              { style: { top: '8%', right: '6%' }, rotate: '90deg' },
              { style: { bottom: '8%', left: '6%' }, rotate: '270deg' },
              { style: { bottom: '8%', right: '6%' }, rotate: '180deg' },
            ].map(({ style, rotate }, i) => (
              <div key={i} className="absolute w-10 h-10" style={style as React.CSSProperties}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ transform: `rotate(${rotate})` }}>
                  <path d="M3 18 L3 3 L18 3" stroke="rgba(0,212,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}

            {/* Center reticle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-28 h-28">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/40" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/40" />
                <div className="absolute inset-6 rounded-full border-2 border-cyan-500/50 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-8 rounded-full border border-cyan-400/70" />
                <div className="absolute inset-10 rounded-full border border-cyan-300/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px rgba(0,212,255,0.9)' }} />
                </div>
              </div>
            </div>

            {/* Scan progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0a1020]/60">
              <div className="h-full transition-none" style={{
                width: `${scanProgress}%`,
                background: 'linear-gradient(90deg, #0ea5e9, #00d4ff, #0ea5e9)',
                boxShadow: '0 0 10px rgba(0,212,255,0.8)',
              }} />
            </div>

            {/* Scan phase indicator */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md"
              style={{ background: 'rgba(4,10,22,0.9)', border: '1px solid rgba(0,212,255,0.45)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 6px #00d4ff' }} />
              <span className="text-cyan-300 text-[10px] font-black tracking-[0.25em] uppercase">
                {scanPhase === 'horizontal' ? 'SCANNING TREND LINE' :
                 scanPhase === 'vertical' ? 'SCANNING MOMENTUM' :
                 scanPhase === 'grid' ? 'DEEP ANALYSIS' : 'SIGNAL VALIDATION'}
              </span>
              <span className="text-cyan-500 text-[10px] font-mono font-bold">{Math.round(scanProgress)}%</span>
            </div>

            {/* Deriv + TradingView merge badge */}
            <div className="absolute bottom-8 right-3 px-2.5 py-1.5 rounded-xl backdrop-blur-md"
              style={{ background: 'rgba(4,10,22,0.85)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="text-[9px] text-cyan-500 font-bold tracking-widest">DERIV + TRADINGVIEW</div>
              <div className="text-[8px] text-gray-600">Signal Fusion Active</div>
            </div>
          </div>
        )}

        {/* Signal overlay when result ready */}
        {signal && !isScanning && loaded && (
          <div className={`absolute bottom-3 left-3 right-3 rounded-xl border backdrop-blur-md px-3 py-2.5 flex items-center gap-3 ${
            signal.direction === 'CALL'
              ? 'bg-emerald-950/80 border-emerald-500/50'
              : 'bg-red-950/80 border-red-500/50'
          }`}>
            <div className={`text-3xl font-black flex-shrink-0 ${signal.direction === 'CALL' ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.direction === 'CALL' ? '▲' : '▼'}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-black ${signal.direction === 'CALL' ? 'text-emerald-400' : 'text-red-400'}`}>
                {signal.direction} — {signal.pair.symbol}
                {signal.isMartingale && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    MTG ×{[1,2,4,8][Math.min(signal.martingaleStep||0,3)]}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                Entry: <span className="text-cyan-400">{signal.entryPrice.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span>
                &nbsp;|&nbsp; SL: <span className="text-red-400">{signal.stopLoss.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span>
                &nbsp;|&nbsp; TP: <span className="text-emerald-400">{signal.takeProfit.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-xl font-black ${signal.accuracy >= 87 ? 'text-emerald-400' : 'text-cyan-400'}`} style={{ textShadow: signal.accuracy >= 87 ? '0 0 10px rgba(16,185,129,0.6)' : '0 0 10px rgba(0,212,255,0.6)' }}>
                {signal.accuracy}%
              </div>
              <div className="text-[9px] text-gray-600">Accuracy</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
export default TradingViewChart;
