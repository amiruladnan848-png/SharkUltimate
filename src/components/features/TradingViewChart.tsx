import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { CurrencyPair, Signal } from '@/types/trading';
import { Maximize2, Minimize2, RefreshCw, Scan, Activity, Zap, Target, TrendingUp, TrendingDown } from 'lucide-react';

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
  const [interval, setInterval_]  = useState('1');
  const [expanded, setExpanded]   = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const iframeRef                 = useRef<HTMLIFrameElement | null>(null);

  // ── Pro Laser Scanner State ────────────────────────────────────────────────
  const [scanH, setScanH]       = useState(50);
  const [scanV, setScanV]       = useState(50);
  const [scanPct, setScanPct]   = useState(0);
  const [phase, setPhase]       = useState(0);
  const [pulseR, setPulseR]     = useState(0);
  const animRef                 = useRef<number>();
  const startRef                = useRef(0);
  const TOTAL_MS                = 5200;

  useEffect(() => {
    if (!isScanning) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setScanPct(0); setScanH(50); setScanV(50); setPhase(0); setPulseR(0);
      return;
    }
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const t       = Math.min(elapsed / TOTAL_MS, 1);
      setScanPct(t * 100);

      if (t < 0.22) {
        // Phase 0: Horizontal sweep top→bottom
        setPhase(0);
        setScanH((t / 0.22) * 100);
        setScanV(50);
      } else if (t < 0.44) {
        // Phase 1: Vertical sweep left→right
        setPhase(1);
        const sub = (t - 0.22) / 0.22;
        setScanV(sub * 100);
        setScanH(50);
      } else if (t < 0.66) {
        // Phase 2: Diagonal grid scan (X pattern)
        setPhase(2);
        const sub = (elapsed - TOTAL_MS * 0.44);
        setScanH(50 + Math.sin(sub / 180) * 42);
        setScanV(50 + Math.cos(sub / 220) * 42);
      } else if (t < 0.85) {
        // Phase 3: Rapid scan spiral
        setPhase(3);
        const sub = (elapsed - TOTAL_MS * 0.66);
        const r = 38 * (1 - (sub / (TOTAL_MS * 0.19)));
        setScanH(50 + Math.sin(sub / 90) * r);
        setScanV(50 + Math.cos(sub / 90) * r);
      } else {
        // Phase 4: Pulse validation at center
        setPhase(4);
        const sub = (elapsed - TOTAL_MS * 0.85);
        setScanH(50 + Math.sin(sub / 60) * 5);
        setScanV(50 + Math.cos(sub / 60) * 5);
        setPulseR((sub / (TOTAL_MS * 0.15)) * 100);
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
      `?frameElementId=tv_shark_${pair.id}`,
      `&symbol=${sym}`,
      `&interval=${interval}`,
      '&hidesidetoolbar=0',
      '&hidetoptoolbar=0',
      '&saveimage=0',
      '&toolbarbg=030810',
      '&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies%1FBollingerBandsR%40tv-basicstudies%1FStochasticRSI%40tv-basicstudies',
      '&theme=dark',
      '&style=1',
      '&timezone=Asia%2FDhaka',
      '&withdateranges=1',
      '&locale=en',
      '&allow_symbol_change=0',
      '&details=0',
      '&hotlist=0',
      '&calendar=0',
      `&utm_source=qxbroker.com&utm_medium=widget&utm_campaign=shark_ultimate`,
    ].join('');
  }, [pair.tvSymbol, pair.id, pair.symbol, interval]);

  useEffect(() => {
    setLoaded(false);
    if (iframeRef.current) iframeRef.current.src = buildSrc();
  }, [buildSrc]);

  const chartH = expanded ? 'h-[780px]' : 'h-[520px]';

  const borderGlow = isScanning
    ? { border: '1px solid rgba(0,212,255,0.9)', shadow: '0 0 60px rgba(0,212,255,0.25), 0 0 120px rgba(0,212,255,0.1)' }
    : signal?.direction === 'CALL'
    ? { border: '1px solid rgba(52,211,153,0.65)', shadow: '0 0 40px rgba(52,211,153,0.12)' }
    : signal?.direction === 'PUT'
    ? { border: '1px solid rgba(248,113,113,0.65)', shadow: '0 0 40px rgba(248,113,113,0.12)' }
    : { border: '1px solid rgba(14,26,56,0.9)', shadow: 'none' };

  const phaseLabels = [
    'PHASE 1: TREND SCAN',
    'PHASE 2: MOMENTUM SCAN',
    'PHASE 3: DEEP GRID ANALYSIS',
    'PHASE 4: SPIRAL CONVERGENCE',
    'PHASE 5: SIGNAL VALIDATION',
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{ border: borderGlow.border, boxShadow: borderGlow.shadow }}>

      {/* ── Chart Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b flex-wrap gap-2"
        style={{ background: 'rgba(3,8,20,0.99)', borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2.5 flex-wrap">
          {pair.flag && <span className="text-lg">{pair.flag}</span>}
          <span className="text-white font-black text-sm tracking-wider">{pair.symbol}</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-black border"
            style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }}>
            REAL
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-black border"
            style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)' }}>
            QX BROKER
          </span>
          {isScanning && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
              style={{ border: '1px solid rgba(0,212,255,0.55)', background: 'rgba(0,212,255,0.12)' }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" style={{ boxShadow: '0 0 6px #00d4ff' }} />
              <span className="text-[9px] font-black text-cyan-200 tracking-widest">SCANNING</span>
            </div>
          )}
          {/* Interval buttons */}
          <div className="flex items-center gap-1">
            {INTERVALS.map(iv => (
              <button key={iv.value} onClick={() => setInterval_(iv.value)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150"
                style={interval === iv.value ? {
                  background: 'rgba(0,212,255,0.18)', color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.45)',
                } : { color: '#2a4060', background: 'transparent', border: '1px solid transparent' }}>
                {iv.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {signal && !isScanning && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[11px] border"
              style={signal.direction === 'CALL' ? {
                background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.5)',
              } : {
                background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.5)',
              }}>
              {signal.direction === 'CALL' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {signal.direction}
              <span className="font-mono">{signal.accuracy}%</span>
            </div>
          )}
          <button onClick={() => { setLoaded(false); if (iframeRef.current) iframeRef.current.src = buildSrc(); }}
            className="p-1.5 rounded-lg transition-colors" title="Reload"
            style={{ color: '#2a4060', border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6a90b0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2a4060'}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg transition-colors" title={expanded ? 'Collapse' : 'Expand'}
            style={{ color: '#2a4060', border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00d4ff'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#2a4060'}>
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Chart Body ── */}
      <div className={`relative ${chartH} transition-all duration-500`} style={{ background: '#020609' }}>

        {/* Loading Skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{ background: 'linear-gradient(135deg, #030a1e, #04091c)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg,rgba(0,212,255,0.18),rgba(99,102,241,0.12))',
                border: '1px solid rgba(0,212,255,0.35)',
                boxShadow: '0 0 40px rgba(0,212,255,0.12)',
              }}>
              <Scan className="w-9 h-9 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-cyan-300 text-[11px] font-black tracking-[0.3em] animate-pulse uppercase mb-2">
              Loading Live Chart
            </p>
            <p className="text-[10px] font-mono mb-6" style={{ color: '#1e3a5f' }}>
              {pair.tvSymbol} • {interval}M • QX Broker • Bangladesh TZ
            </p>
            <div className="flex items-end gap-1 h-14">
              {Array.from({ length: 32 }, (_, i) => (
                <div key={i} className="w-1.5 rounded-sm"
                  style={{
                    height: `${10 + Math.abs(Math.sin(i * 0.55)) * 38}px`,
                    background: i % 4 === 0
                      ? 'rgba(0,212,255,0.75)'
                      : i % 3 === 0
                      ? 'rgba(52,211,153,0.55)'
                      : i % 5 === 0
                      ? 'rgba(248,113,113,0.45)'
                      : 'rgba(0,212,255,0.12)',
                    animation: 'pulse 1.3s ease-in-out infinite',
                    animationDelay: `${i * 45}ms`,
                  }}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 text-[10px]" style={{ color: '#1e3a5f' }}>
              <Activity className="w-3 h-3 animate-pulse" />
              Connecting to TradingView + Deriv Fusion...
            </div>
          </div>
        )}

        {/* TradingView iframe */}
        <iframe
          ref={iframeRef}
          src={buildSrc()}
          className="w-full h-full border-0"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}
          onLoad={() => setLoaded(true)}
          allowTransparency
          frameBorder="0"
          scrolling="no"
          title={`${pair.symbol} — SHARK Ultimate QX Chart`}
        />

        {/* ── PRO LASER SCANNER OVERLAY v7.0 ── */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* Dark tint */}
            <div className="absolute inset-0" style={{ background: 'rgba(2,6,18,0.32)' }} />

            {/* ── Horizontal laser beam ── */}
            <div className="absolute left-0 right-0"
              style={{
                top: `${scanH}%`,
                height: '3px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.1) 8%, rgba(0,212,255,0.85) 35%, rgba(255,255,255,0.98) 50%, rgba(0,212,255,0.85) 65%, rgba(0,212,255,0.1) 92%, transparent 100%)',
                boxShadow: '0 0 24px 6px rgba(0,212,255,0.7), 0 0 60px 14px rgba(0,212,255,0.28)',
                filter: 'blur(0.3px)',
              }}
            />
            {/* H-trail glow */}
            <div className="absolute left-0 right-0"
              style={{
                top: `calc(${scanH}% - 15px)`,
                height: '30px',
                background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.08) 40%, rgba(0,212,255,0.14) 50%, rgba(0,212,255,0.08) 60%, transparent)',
                filter: 'blur(4px)',
              }}
            />

            {/* ── Vertical laser beam ── */}
            {phase >= 1 && (
              <>
                <div className="absolute top-0 bottom-0"
                  style={{
                    left: `${scanV}%`,
                    width: '3px',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.1) 8%, rgba(0,212,255,0.85) 35%, rgba(255,255,255,0.98) 50%, rgba(0,212,255,0.85) 65%, rgba(0,212,255,0.1) 92%, transparent 100%)',
                    boxShadow: '0 0 20px 5px rgba(0,212,255,0.65), 0 0 50px 12px rgba(0,212,255,0.22)',
                    filter: 'blur(0.3px)',
                  }}
                />
                {/* V-trail */}
                <div className="absolute top-0 bottom-0"
                  style={{
                    left: `calc(${scanV}% - 12px)`,
                    width: '24px',
                    background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.07) 40%, rgba(0,212,255,0.13) 50%, rgba(0,212,255,0.07) 60%, transparent)',
                    filter: 'blur(4px)',
                  }}
                />
              </>
            )}

            {/* ── Intersection hotspot ── */}
            {phase >= 1 && (
              <div className="absolute"
                style={{
                  left: `calc(${scanV}% - 8px)`,
                  top: `calc(${scanH}% - 8px)`,
                  width: 16, height: 16,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 0 20px 6px rgba(0,212,255,1), 0 0 50px 14px rgba(0,212,255,0.55)',
                  filter: 'blur(0.5px)',
                }}
              />
            )}

            {/* ── Fine grid reference lines ── */}
            {[20, 40, 60, 80].map(p => (
              <React.Fragment key={p}>
                <div className="absolute left-0 right-0 h-px" style={{ top: `${p}%`, background: 'rgba(0,212,255,0.06)' }} />
                <div className="absolute top-0 bottom-0 w-px" style={{ left: `${p}%`, background: 'rgba(0,212,255,0.06)' }} />
              </React.Fragment>
            ))}

            {/* ── Phase 4: Validation pulse rings ── */}
            {phase >= 4 && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[40, 70, 100, 130].map((r, i) => (
                  <div key={i} className="absolute rounded-full border border-cyan-400"
                    style={{
                      width: r * (pulseR / 100 + 0.3),
                      height: r * (pulseR / 100 + 0.3),
                      opacity: Math.max(0, 1 - (pulseR / 100 + i * 0.2)),
                      borderColor: `rgba(0,212,255,${0.8 - i * 0.18})`,
                      boxShadow: `0 0 12px rgba(0,212,255,${0.5 - i * 0.12})`,
                      transition: 'none',
                    }}
                  />
                ))}
              </div>
            )}

            {/* ── Corner brackets ── */}
            {[
              { top: '5%',    left: '3%',   rot: 0 },
              { top: '5%',    right: '3%',  rot: 90 },
              { bottom: '5%', left: '3%',   rot: 270 },
              { bottom: '5%', right: '3%',  rot: 180 },
            ].map((pos, i) => (
              <div key={i} className="absolute w-14 h-14"
                style={{ top: pos.top, left: (pos as Record<string,string>).left, right: (pos as Record<string,string>).right, bottom: pos.bottom } as React.CSSProperties}>
                <svg width="56" height="56" fill="none" style={{ transform: `rotate(${pos.rot}deg)` }}>
                  <path d="M4 26 L4 4 L26 4" stroke="rgba(0,212,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Inner bracket tick */}
                  <path d="M4 14 L10 14" stroke="rgba(0,212,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 4 L14 10" stroke="rgba(0,212,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            ))}

            {/* ── Center crosshair reticle ── */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <div className="absolute top-1/2 left-4 right-4 h-px" style={{ background: 'rgba(0,212,255,0.3)', transform: 'translateY(-50%)' }} />
                <div className="absolute left-1/2 top-4 bottom-4 w-px" style={{ background: 'rgba(0,212,255,0.3)', transform: 'translateX(-50%)' }} />
                {[16, 24, 34].map((r, idx) => (
                  <div key={idx} className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full border"
                      style={{
                        width: r * 2, height: r * 2,
                        borderColor: `rgba(0,212,255,${0.7 - idx * 0.2})`,
                        boxShadow: idx === 0 ? '0 0 14px rgba(0,212,255,0.6)' : 'none',
                        animation: idx === 0 ? 'ping 1.6s ease-in-out infinite' : 'none',
                      }}
                    />
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full"
                    style={{ background: 'radial-gradient(circle, #ffffff 0%, rgba(0,212,255,0.8) 60%, transparent 100%)', boxShadow: '0 0 18px rgba(0,212,255,1), 0 0 40px rgba(0,212,255,0.5)' }} />
                </div>
              </div>
            </div>

            {/* ── Phase badge ── */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full"
              style={{ background: 'rgba(2,6,18,0.95)', border: '1px solid rgba(0,212,255,0.55)', boxShadow: '0 0 24px rgba(0,212,255,0.18)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 8px #00d4ff' }} />
              <span className="text-cyan-200 text-[10px] font-black tracking-[0.2em] uppercase">
                {phaseLabels[phase] || 'SCANNING...'}
              </span>
              <span className="text-cyan-500 text-[10px] font-mono font-black ml-1">{Math.round(scanPct)}%</span>
            </div>

            {/* ── Fusion badge (bottom right) ── */}
            <div className="absolute bottom-10 right-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(2,6,18,0.94)', border: '1px solid rgba(0,212,255,0.22)', boxShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
              <div className="text-cyan-400 text-[9px] font-black tracking-widest">DERIV + TRADINGVIEW</div>
              <div className="text-[8px] mt-0.5" style={{ color: '#2a4060' }}>SHARK v7.0 Signal Fusion</div>
            </div>

            {/* ── Scan data readouts (left side) ── */}
            <div className="absolute left-3 bottom-10 space-y-1">
              {[
                { label: 'H-POS', value: `${scanH.toFixed(1)}%` },
                { label: 'V-POS', value: `${scanV.toFixed(1)}%` },
                { label: 'PHASE', value: `${phase + 1}/5` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-[9px] font-mono"
                  style={{ color: '#1e4060' }}>
                  <span style={{ color: '#0e2840' }}>{item.label}:</span>
                  <span style={{ color: '#2a6080' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* ── Progress bar ── */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'rgba(6,12,28,0.85)' }}>
              <div className="h-full"
                style={{
                  width: `${scanPct}%`,
                  background: 'linear-gradient(90deg, #0369a1 0%, #00d4ff 50%, #0ea5e9 80%, #ffffff 100%)',
                  boxShadow: '0 0 16px rgba(0,212,255,0.95), 0 0 4px rgba(255,255,255,0.5)',
                  transition: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Signal overlay when result ready */}
        {signal && !isScanning && loaded && (
          <div className="absolute bottom-4 left-3 right-3 rounded-2xl border px-4 py-3 flex items-center gap-3"
            style={{
              background: signal.direction === 'CALL' ? 'rgba(4,22,12,0.96)' : 'rgba(22,4,6,0.96)',
              border: signal.direction === 'CALL' ? '1px solid rgba(52,211,153,0.65)' : '1px solid rgba(248,113,113,0.65)',
              backdropFilter: 'blur(16px)',
              boxShadow: signal.direction === 'CALL' ? '0 4px 40px rgba(52,211,153,0.14)' : '0 4px 40px rgba(248,113,113,0.14)',
            }}>
            {signal.direction === 'CALL'
              ? <TrendingUp className="w-9 h-9 flex-shrink-0 text-emerald-400" style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} />
              : <TrendingDown className="w-9 h-9 flex-shrink-0 text-red-400" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }} />
            }
            <div className="flex-1 min-w-0">
              <div className="font-black text-base" style={{ color: signal.direction === 'CALL' ? '#34d399' : '#f87171' }}>
                {signal.direction === 'CALL' ? '▲' : '▼'} {signal.direction} Signal — {signal.pair.symbol}
              </div>
              <div className="text-[10px] mt-0.5 font-mono flex items-center gap-2 flex-wrap" style={{ color: '#2a4060' }}>
                <span>Entry: <span className="text-cyan-400">{signal.entryPrice.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span></span>
                <span>SL: <span className="text-red-400">{signal.stopLoss.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span></span>
                <span>TP: <span className="text-emerald-400">{signal.takeProfit.toFixed(signal.pair.pip <= 0.001 ? 3 : 5)}</span></span>
                <span>R:R <span className="text-cyan-300">1:{signal.riskReward}</span></span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black tabular-nums"
                style={{
                  color: signal.accuracy >= 90 ? '#34d399' : '#00d4ff',
                  textShadow: signal.accuracy >= 90 ? '0 0 18px rgba(52,211,153,0.8)' : '0 0 18px rgba(0,212,255,0.8)',
                }}>
                {signal.accuracy}%
              </div>
              <div className="text-[9px]" style={{ color: '#1e3a5f' }}>Accuracy</div>
              <div className="text-[8px] mt-0.5 font-bold" style={{ color: signal.analysis.confidence === 'VERY_HIGH' ? '#34d399' : signal.analysis.confidence === 'HIGH' ? '#00e5ff' : '#fbbf24' }}>
                {signal.analysis.confidence.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
export default TradingViewChart;
