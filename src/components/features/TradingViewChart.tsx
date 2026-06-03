import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { CurrencyPair, Signal } from '@/types/trading';
import { Maximize2, Minimize2, RefreshCw, Scan, Activity, Zap } from 'lucide-react';

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
  const [scanH, setScanH]         = useState(50);
  const [scanV, setScanV]         = useState(0);
  const [scanPct, setScanPct]     = useState(0);
  const [phase, setPhase]         = useState(0); // 0=h 1=v 2=grid 3=pulse
  const animRef                   = useRef<number>();
  const startRef                  = useRef(0);
  const TOTAL_MS                  = 4800;

  useEffect(() => {
    if (!isScanning) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setScanPct(0); setScanH(50); setScanV(0); setPhase(0);
      return;
    }
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / TOTAL_MS, 1);
      setScanPct(t * 100);

      if (t < 0.28) {
        setPhase(0);
        setScanH((t / 0.28) * 100);
      } else if (t < 0.52) {
        setPhase(1);
        setScanV(((t - 0.28) / 0.24) * 100);
        setScanH(50);
      } else if (t < 0.76) {
        setPhase(2);
        const sub = (elapsed - TOTAL_MS * 0.52);
        setScanH(50 + Math.sin(sub / 220) * 38);
        setScanV(50 + Math.cos(sub / 280) * 38);
      } else {
        setPhase(3);
        const sub = (elapsed - TOTAL_MS * 0.76);
        setScanH(50 + Math.sin(sub / 120) * 45);
        setScanV(50 + Math.cos(sub / 150) * 45);
      }

      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isScanning]);

  const buildSrc = useCallback(() => {
    const sym = encodeURIComponent(pair.tvSymbol);
    return [
      'https://s.tradingview.com/widgetembed/',
      `?frameElementId=tv_qx_${pair.id}`,
      `&symbol=${sym}`,
      `&interval=${interval}`,
      '&hidesidetoolbar=0',
      '&hidetoptoolbar=0',
      '&saveimage=0',
      '&toolbarbg=040a18',
      '&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies%1FBollingerBandsR%40tv-basicstudies',
      '&theme=dark',
      '&style=1',
      '&timezone=Asia%2FDhaka',
      '&withdateranges=1',
      '&locale=en',
      '&allow_symbol_change=0',
      '&details=0',
      '&hotlist=0',
      '&calendar=0',
      `&utm_source=qxbroker.com&utm_medium=widget_new&utm_campaign=chart&utm_term=${encodeURIComponent(pair.symbol)}`,
    ].join('');
  }, [pair.tvSymbol, pair.id, pair.symbol, interval]);

  useEffect(() => {
    setLoaded(false);
    if (iframeRef.current) iframeRef.current.src = buildSrc();
  }, [buildSrc]);

  const chartH = expanded ? 'h-[720px]' : 'h-[500px]';

  const borderGlow = isScanning
    ? { border: '1px solid rgba(0,212,255,0.85)', shadow: '0 0 50px rgba(0,212,255,0.22), 0 0 100px rgba(0,212,255,0.08)' }
    : signal?.direction === 'CALL'
    ? { border: '1px solid rgba(16,185,129,0.6)', shadow: '0 0 35px rgba(16,185,129,0.1)' }
    : signal?.direction === 'PUT'
    ? { border: '1px solid rgba(239,68,68,0.6)', shadow: '0 0 35px rgba(239,68,68,0.1)' }
    : { border: '1px solid rgba(14,26,56,0.9)', shadow: 'none' };

  const phaseLabel = ['SCANNING TREND LINE', 'SCANNING MOMENTUM', 'DEEP GRID ANALYSIS', 'SIGNAL VALIDATION'][phase] || '';

  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{ border: borderGlow.border, boxShadow: borderGlow.shadow }}>

      {/* ── Chart Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: 'rgba(4,10,24,0.99)', borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {pair.flag && <span className="text-base">{pair.flag}</span>}
            <span className="text-white font-black text-sm tracking-wider">{pair.symbol}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border"
              style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }}>
              REAL
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border"
              style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)' }}>
              QX BROKER
            </span>
            {isScanning && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border"
                style={{ border: '1px solid rgba(0,212,255,0.5)', background: 'rgba(0,212,255,0.1)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[9px] font-black text-cyan-300 tracking-widest">SCANNING</span>
              </div>
            )}
          </div>
          {/* Interval buttons */}
          <div className="flex items-center gap-1">
            {INTERVALS.map(iv => (
              <button key={iv.value} onClick={() => setInterval_(iv.value)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150"
                style={interval === iv.value ? {
                  background: 'rgba(0,212,255,0.18)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.45)',
                } : {
                  color: '#3a5070',
                  background: 'transparent',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { if (interval !== iv.value) (e.currentTarget as HTMLElement).style.color = '#9ab8d0'; }}
                onMouseLeave={e => { if (interval !== iv.value) (e.currentTarget as HTMLElement).style.color = '#3a5070'; }}
              >{iv.label}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {signal && !isScanning && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[11px] border"
              style={signal.direction === 'CALL' ? {
                background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.45)',
              } : {
                background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.45)',
              }}>
              {signal.direction === 'CALL' ? '▲' : '▼'} {signal.direction}
              <span className="font-mono">{signal.accuracy}%</span>
            </div>
          )}
          <button onClick={() => { setLoaded(false); if (iframeRef.current) iframeRef.current.src = buildSrc(); }}
            className="p-1.5 rounded-lg transition-all" title="Reload"
            style={{ color: '#2a4060', border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6a90b0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2a4060'}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg transition-all" title={expanded ? 'Collapse' : 'Expand'}
            style={{ color: '#2a4060', border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00d4ff'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2a4060'}>
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Chart Body ─────────────────────────────────────────────── */}
      <div className={`relative ${chartH} transition-all duration-500`} style={{ background: '#030810' }}>

        {/* Loading Skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{ background: 'linear-gradient(135deg, #040b1e, #050d22)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(99,102,241,0.15))',
                border: '1px solid rgba(0,212,255,0.3)',
                boxShadow: '0 0 30px rgba(0,212,255,0.1)',
              }}>
              <Scan className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-cyan-400 text-xs font-black tracking-[0.3em] animate-pulse uppercase mb-2">
              Loading Live Chart
            </p>
            <p className="text-[10px] font-mono mb-5"
              style={{ color: '#1e3a5f' }}>{pair.tvSymbol} • {interval}M • QX Broker • Dhaka TZ</p>
            {/* Animated bars */}
            <div className="flex items-end gap-1 h-12">
              {Array.from({ length: 28 }, (_, i) => (
                <div key={i} className="w-1.5 rounded-sm animate-pulse"
                  style={{
                    height: `${12 + Math.abs(Math.sin(i * 0.6)) * 32}px`,
                    background: i % 4 === 0
                      ? 'rgba(0,212,255,0.7)'
                      : i % 3 === 0
                      ? 'rgba(16,185,129,0.5)'
                      : 'rgba(0,212,255,0.15)',
                    animationDelay: `${i * 50}ms`,
                    animationDuration: '1.2s',
                  }}
                />
              ))}
            </div>
            {/* Connecting indicator */}
            <div className="mt-4 flex items-center gap-2 text-[10px]" style={{ color: '#2a4060' }}>
              <Activity className="w-3 h-3 animate-pulse" />
              Connecting to TradingView...
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
          allowTransparency
          frameBorder="0"
          scrolling="no"
          title={`${pair.symbol} — QX Broker Live Chart`}
        />

        {/* ── PRO LASER SCANNER OVERLAY ──────────────────────────────── */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* Dark overlay tint */}
            <div className="absolute inset-0" style={{ background: 'rgba(3,8,20,0.30)' }} />

            {/* Horizontal laser */}
            <div className="absolute left-0 right-0 transition-none"
              style={{
                top: `${scanH}%`,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.15) 10%, rgba(0,212,255,0.9) 40%, #ffffff 50%, rgba(0,212,255,0.9) 60%, rgba(0,212,255,0.15) 90%, transparent)',
                boxShadow: '0 0 20px 5px rgba(0,212,255,0.65), 0 0 50px 12px rgba(0,212,255,0.25)',
              }}
            />
            {/* H-trail */}
            <div className="absolute left-0 right-0 transition-none opacity-30"
              style={{
                top: `calc(${scanH}% - 10px)`,
                height: '20px',
                background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.12), transparent)',
              }}
            />

            {/* Vertical laser */}
            {phase >= 1 && (
              <div className="absolute top-0 bottom-0 transition-none"
                style={{
                  left: `${scanV}%`,
                  width: '2px',
                  background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.15) 10%, rgba(0,212,255,0.9) 40%, #ffffff 50%, rgba(0,212,255,0.9) 60%, rgba(0,212,255,0.15) 90%, transparent)',
                  boxShadow: '0 0 16px 4px rgba(0,212,255,0.55), 0 0 40px 10px rgba(0,212,255,0.2)',
                }}
              />
            )}

            {/* Grid reference lines */}
            {[20, 40, 60, 80].map(p => (
              <React.Fragment key={p}>
                <div className="absolute left-0 right-0 h-px" style={{ top: `${p}%`, background: 'rgba(0,212,255,0.05)' }} />
                <div className="absolute top-0 bottom-0 w-px" style={{ left: `${p}%`, background: 'rgba(0,212,255,0.05)' }} />
              </React.Fragment>
            ))}

            {/* Corner brackets */}
            {[
              { top: '6%',   left: '4%',   r: '0' },
              { top: '6%',   right: '4%',  r: '90' },
              { bottom: '6%',left: '4%',   r: '270' },
              { bottom: '6%',right: '4%',  r: '180' },
            ].map((pos, i) => (
              <div key={i} className="absolute w-12 h-12"
                style={{ top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom } as React.CSSProperties}>
                <svg width="48" height="48" fill="none" style={{ transform: `rotate(${pos.r}deg)` }}>
                  <path d="M4 22 L4 4 L22 4" stroke="rgba(0,212,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}

            {/* Center reticle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-32">
                <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: 'rgba(0,212,255,0.35)' }} />
                <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'rgba(0,212,255,0.35)' }} />
                {[7, 10, 13].map((s, i) => (
                  <div key={i} className="absolute rounded-full border border-cyan-500/60"
                    style={{
                      inset: `${s * 4}px`,
                      opacity: i === 0 ? 1 : i === 1 ? 0.5 : 0.25,
                      animation: i === 0 ? 'ping 1.8s ease-in-out infinite' : 'none',
                    }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full border-2 border-cyan-400 bg-cyan-500/30"
                    style={{ boxShadow: '0 0 12px rgba(0,212,255,1)' }} />
                </div>
              </div>
            </div>

            {/* Phase badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full"
              style={{ background: 'rgba(3,8,20,0.92)', border: '1px solid rgba(0,212,255,0.5)', boxShadow: '0 0 20px rgba(0,212,255,0.15)' }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 6px #00d4ff' }} />
              <span className="text-cyan-200 text-[10px] font-black tracking-[0.22em] uppercase">{phaseLabel}</span>
              <span className="text-cyan-500 text-[10px] font-mono font-bold">{Math.round(scanPct)}%</span>
            </div>

            {/* Bottom fusion badge */}
            <div className="absolute bottom-8 right-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(3,8,20,0.9)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="text-cyan-400 text-[9px] font-black tracking-widest">DERIV + TRADINGVIEW</div>
              <div className="text-[8px] mt-0.5" style={{ color: '#2a4060' }}>QX Broker Signal Fusion</div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'rgba(8,16,36,0.8)' }}>
              <div className="h-full"
                style={{
                  width: `${scanPct}%`,
                  background: 'linear-gradient(90deg, #0369a1, #00d4ff, #0ea5e9)',
                  boxShadow: '0 0 12px rgba(0,212,255,0.9)',
                  transition: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Signal overlay when result ready */}
        {signal && !isScanning && loaded && (
          <div className="absolute bottom-4 left-3 right-3 rounded-2xl border px-3 py-2.5 flex items-center gap-3"
            style={{
              background: signal.direction === 'CALL' ? 'rgba(5,30,18,0.95)' : 'rgba(25,5,8,0.95)',
              border: signal.direction === 'CALL' ? '1px solid rgba(16,185,129,0.6)' : '1px solid rgba(239,68,68,0.6)',
              backdropFilter: 'blur(12px)',
              boxShadow: signal.direction === 'CALL' ? '0 4px 30px rgba(16,185,129,0.12)' : '0 4px 30px rgba(239,68,68,0.12)',
            }}>
            <Zap className="w-8 h-8 flex-shrink-0"
              style={{ color: signal.direction === 'CALL' ? '#34d399' : '#f87171', filter: `drop-shadow(0 0 6px ${signal.direction === 'CALL' ? '#10b981' : '#ef4444'})` }} />
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm"
                style={{ color: signal.direction === 'CALL' ? '#34d399' : '#f87171' }}>
                {signal.direction === 'CALL' ? '▲' : '▼'} {signal.direction} — {signal.pair.symbol}
              </div>
              <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#3a5070' }}>
                Entry: <span className="text-cyan-400">{signal.entryPrice.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span>
                &nbsp;|&nbsp; SL: <span className="text-red-400">{signal.stopLoss.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span>
                &nbsp;|&nbsp; TP: <span className="text-emerald-400">{signal.takeProfit.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black tabular-nums"
                style={{
                  color: signal.accuracy >= 88 ? '#34d399' : '#00d4ff',
                  textShadow: signal.accuracy >= 88 ? '0 0 14px rgba(52,211,153,0.7)' : '0 0 14px rgba(0,212,255,0.7)',
                }}>
                {signal.accuracy}%
              </div>
              <div className="text-[9px]" style={{ color: '#2a4060' }}>Accuracy</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
export default TradingViewChart;
