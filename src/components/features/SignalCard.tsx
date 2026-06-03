import React, { useEffect, useState, memo } from 'react';
import { Signal, SignalResult } from '@/types/trading';
import { AccuracyMeter } from './AccuracyMeter';
import {
  TrendingUp, TrendingDown, Clock, Zap, Activity, Target, CheckCircle,
  Shield, BarChart2, AlertTriangle, Trophy, XCircle, RefreshCw, Volume2, VolumeX
} from 'lucide-react';
import { ANALYSIS_STEPS } from '@/hooks/useSignalEngine';

interface SignalCardProps {
  signal: Signal | null;
  isAnalyzing: boolean;
  analysisPct: number;
  countdown: number;
  lastAnalysis: string;
  analysisStep: number;
  onManualSignal: () => void;
  dataReady: boolean;
  martingaleActive: boolean;
  martingaleMultiplier: number;
  lastResult: SignalResult | null;
}

const fmt  = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const fmtC = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
const fmtP = (p: number, pip: number) => p.toFixed(pip <= 0.001 ? 3 : 5);

const CONF_COLORS = {
  VERY_HIGH: { text: 'text-emerald-300', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.45)', glow: 'rgba(52,211,153,0.3)' },
  HIGH:      { text: 'text-cyan-300',    bg: 'rgba(0,212,255,0.10)',  border: 'rgba(0,212,255,0.40)',  glow: 'rgba(0,212,255,0.25)' },
  MEDIUM:    { text: 'text-yellow-300',  bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.38)', glow: 'rgba(251,191,36,0.2)' },
  LOW:       { text: 'text-gray-400',    bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.22)', glow: 'transparent' },
};

const getResultBadge = (result: SignalResult) => {
  switch (result) {
    case 'WIN':     return { icon: <Trophy className="w-4 h-4" />,   text: 'WIN',     color: '#34d399', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.4)' };
    case 'LOSS':    return { icon: <XCircle className="w-4 h-4" />,  text: 'LOSS',    color: '#f87171', bg: 'rgba(248,113,113,0.12)',  border: 'rgba(248,113,113,0.4)' };
    case 'EXPIRED': return { icon: <Clock className="w-4 h-4" />,    text: 'EXPIRED', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)' };
    default:        return { icon: <Activity className="w-4 h-4" />, text: 'PENDING', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)' };
  }
};

export const SignalCard: React.FC<SignalCardProps> = memo(({
  signal, isAnalyzing, analysisPct, countdown, lastAnalysis, analysisStep,
  onManualSignal, dataReady, martingaleActive, martingaleMultiplier, lastResult,
}) => {
  const [pulse, setPulse]           = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    if (signal) { setPulse(true); setTimeout(() => setPulse(false), 700); }
  }, [signal?.id]);

  const isCall = signal?.direction === 'CALL';
  const conf   = signal ? CONF_COLORS[signal.analysis.confidence] : CONF_COLORS.LOW;

  return (
    <div className="flex flex-col gap-3">

      {/* ── 1-Step MTG Banner ──────────────────────────────────────── */}
      {martingaleActive && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,rgba(251,146,60,0.1),rgba(245,158,11,0.06))', border: '1px solid rgba(251,146,60,0.4)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(251,146,60,0.18)', border: '1px solid rgba(251,146,60,0.35)' }}>
            <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-orange-300 tracking-wider">⚡ 1-STEP MTG RECOVERY ACTIVE</div>
            <div className="text-[10px] text-orange-600 mt-0.5">
              Double your stake <span className="font-black text-orange-300">×{martingaleMultiplier}</span> to recover the previous loss
            </div>
          </div>
          <div className="text-3xl font-black text-orange-400"
            style={{ textShadow: '0 0 16px rgba(251,146,60,0.7)' }}>×{martingaleMultiplier}</div>
        </div>
      )}

      {/* ── Last Result ────────────────────────────────────────────── */}
      {lastResult && lastResult !== 'PENDING' && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: getResultBadge(lastResult).bg, border: `1px solid ${getResultBadge(lastResult).border}` }}>
          <div style={{ color: getResultBadge(lastResult).color }}>{getResultBadge(lastResult).icon}</div>
          <div className="flex-1">
            <div className="text-sm font-black" style={{ color: getResultBadge(lastResult).color }}>
              Signal {getResultBadge(lastResult).text}
              {lastResult === 'LOSS' && martingaleActive && ' — 1-Step MTG Activated'}
              {lastResult === 'WIN'  && ' — MTG Reset to Normal'}
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: '#3a5070' }}>Auto-detected via price movement</div>
          </div>
          <div className="flex items-center gap-1 text-[9px]" style={{ color: '#2a4060' }}>
            <Activity className="w-3 h-3" /> Auto
          </div>
        </div>
      )}

      {/* ── Voice Toggle ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: '#2a4060' }}>
          <Activity className="w-3 h-3 text-cyan-700" />
          Bangla AI Voice System
        </div>
        <button onClick={() => setVoiceEnabled(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all"
          style={{
            background:    voiceEnabled ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
            border:        voiceEnabled ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color:         voiceEnabled ? '#34d399' : '#3a5070',
          }}>
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          {voiceEnabled ? 'বাংলা ভয়েস ON' : 'Voice OFF'}
        </button>
      </div>

      {/* ── GENERATE SIGNAL BUTTON ─────────────────────────────────── */}
      <button onClick={onManualSignal} disabled={isAnalyzing || !dataReady}
        className="relative w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all duration-200 overflow-hidden group select-none"
        style={isAnalyzing || !dataReady ? {
          opacity: 0.5, cursor: 'not-allowed',
          background: 'rgba(8,16,36,0.8)', border: '1px solid rgba(255,255,255,0.06)', color: '#3a5070',
        } : {
          background: martingaleActive
            ? 'linear-gradient(135deg,rgba(60,20,0,0.95),rgba(90,35,0,0.9),rgba(60,20,0,0.95))'
            : 'linear-gradient(135deg,rgba(0,35,70,0.95),rgba(0,60,120,0.9),rgba(0,35,70,0.95))',
          border: martingaleActive ? '1px solid rgba(251,146,60,0.6)' : '1px solid rgba(0,212,255,0.55)',
          color: martingaleActive ? '#fb923c' : '#00e5ff',
          boxShadow: martingaleActive
            ? '0 0 30px rgba(251,146,60,0.18), 0 4px 20px rgba(0,0,0,0.5)'
            : '0 0 30px rgba(0,212,255,0.15), 0 4px 20px rgba(0,0,0,0.5)',
        }}>
        {/* Shimmer */}
        {!isAnalyzing && dataReady && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }}
          />
        )}
        {/* Top glow line */}
        {!isAnalyzing && dataReady && (
          <div className="absolute top-0 left-0 right-0 h-px animate-pulse"
            style={{ background: martingaleActive ? 'linear-gradient(90deg,transparent,rgba(251,146,60,0.7),transparent)' : 'linear-gradient(90deg,transparent,rgba(0,212,255,0.7),transparent)' }}
          />
        )}

        <div className="flex items-center justify-center gap-3 relative z-10">
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-cyan-600/40 border-t-cyan-300 animate-spin" />
              <span>SHARK ENGINE SCANNING...</span>
            </>
          ) : !dataReady ? (
            <><Activity className="w-4 h-4 animate-pulse" /><span>COLLECTING LIVE DATA...</span></>
          ) : (
            <>
              <Zap className="w-5 h-5 animate-pulse"
                style={{ filter: martingaleActive ? 'drop-shadow(0 0 6px #fb923c)' : 'drop-shadow(0 0 6px #00e5ff)' }} />
              <span style={{ textShadow: martingaleActive ? '0 0 14px rgba(251,146,60,0.6)' : '0 0 14px rgba(0,229,255,0.6)' }}>
                {martingaleActive ? `⚡ MTG RECOVERY ×${martingaleMultiplier} SIGNAL` : '⚡ GENERATE SIGNAL'}
              </span>
            </>
          )}
        </div>
        {!isAnalyzing && dataReady && (
          <div className="text-[10px] font-normal mt-0.5 relative z-10 opacity-60">
            21-step deep analysis • Deriv + TradingView + QX Broker fusion
          </div>
        )}
      </button>

      {/* ── ANALYSIS PROGRESS ──────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(4,9,22,0.97)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-[0.2em] uppercase"
              style={{ color: 'rgba(0,229,255,0.85)' }}>Deep 21-Step Engine Analysis</span>
            <span className="text-sm font-mono font-black text-cyan-300">{analysisPct}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${analysisPct}%`,
                background: 'linear-gradient(90deg,#0369a1,#00e5ff,#0ea5e9)',
                boxShadow: '0 0 12px rgba(0,212,255,0.75)',
              }} />
          </div>
          {/* Steps */}
          <div className="space-y-1 max-h-44 overflow-hidden">
            {ANALYSIS_STEPS.slice(Math.max(0, analysisStep - 1), analysisStep + 5).map((step, i) => {
              const gIdx = Math.max(0, analysisStep - 1) + i;
              const done = gIdx < analysisStep;
              const curr = gIdx === analysisStep;
              return (
                <div key={step}
                  className={`flex items-center gap-2 py-0.5 transition-all duration-200 ${curr ? 'opacity-100' : done ? 'opacity-40' : 'opacity-18'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${curr ? 'bg-cyan-300 animate-pulse' : done ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                  <span className={`text-[10px] font-mono truncate ${curr ? 'text-cyan-200' : done ? 'text-emerald-400/60' : 'text-gray-700'}`}>{step}</span>
                  {done && <CheckCircle className="w-2.5 h-2.5 text-emerald-500/70 ml-auto flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── IDLE STATE ─────────────────────────────────────────────── */}
      {!signal && !isAnalyzing && (
        <div className="rounded-2xl p-8 flex flex-col items-center justify-center min-h-[220px] text-center"
          style={{ border: '1px solid rgba(14,26,56,0.8)', background: 'rgba(4,9,22,0.8)' }}>
          <div className="relative mb-5">
            <div className="w-18 h-18 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
              <BarChart2 className="w-10 h-10" style={{ color: '#1e3870' }} />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.4)' }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>
          <p className="text-white font-black text-sm mb-2">Signal Engine Ready</p>
          <p className="text-xs leading-relaxed mb-5 max-w-[220px]"
            style={{ color: '#2a4060' }}>
            {lastAnalysis || 'Click Generate Signal for 21-step deep analysis with QX Broker + TradingView + Deriv fusion'}
          </p>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: '#2a4060' }}>
            <Clock className="w-3.5 h-3.5" />
            Next 1-min: <span className="text-cyan-400 font-mono font-black ml-1">{fmtC(countdown)}</span>
          </div>
        </div>
      )}

      {/* ── SIGNAL RESULT ──────────────────────────────────────────── */}
      {signal && !isAnalyzing && (
        <div className={`rounded-2xl overflow-hidden transition-all duration-500 ${pulse ? 'scale-[1.006]' : 'scale-100'}`}
          style={{
            border: isCall ? '1px solid rgba(52,211,153,0.6)' : '1px solid rgba(248,113,113,0.6)',
            background: isCall
              ? 'linear-gradient(145deg,rgba(3,18,12,0.95),rgba(4,9,22,0.98))'
              : 'linear-gradient(145deg,rgba(20,4,8,0.95),rgba(4,9,22,0.98))',
            boxShadow: isCall ? '0 6px 50px rgba(52,211,153,0.08)' : '0 6px 50px rgba(248,113,113,0.08)',
          }}>

          {/* Top color bar */}
          <div className="h-[3px]" style={{
            background: isCall
              ? 'linear-gradient(90deg,#065f46,#34d399,#6ee7b7,#34d399,#065f46)'
              : 'linear-gradient(90deg,#7f1d1d,#f87171,#fca5a5,#f87171,#7f1d1d)',
            backgroundSize: '200% 100%',
            animation: 'shiftBar 2.8s linear infinite',
          }} />

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between gap-2 flex-wrap"
            style={{ borderBottom: isCall ? '1px solid rgba(52,211,153,0.12)' : '1px solid rgba(248,113,113,0.12)' }}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isCall ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{ boxShadow: isCall ? '0 0 8px #34d399' : '0 0 8px #f87171' }} />
              <span className="text-white font-black text-sm">{signal.pair.symbol}</span>
              {signal.pair.flag && <span className="text-base">{signal.pair.flag}</span>}
              {signal.isMartingale && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black border"
                  style={{ color: '#fb923c', border: '1px solid rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.1)' }}>
                  MTG ×{martingaleMultiplier}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {signal.status !== 'PENDING' && (() => {
                const rb = getResultBadge(signal.status);
                return (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black"
                    style={{ color: rb.color, background: rb.bg, border: `1px solid ${rb.border}` }}>
                    {rb.icon}{rb.text}
                  </div>
                );
              })()}
              <div className="text-[10px] px-2.5 py-1 rounded-full border font-bold"
                style={{ color: conf.text.replace('text-', '').replace('-300', ''), background: conf.bg, border: `1px solid ${conf.border}` }}>
                <span className={conf.text}>{signal.analysis.confidence.replace('_', ' ')} CONF</span>
              </div>
            </div>
          </div>

          {/* Main direction */}
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3" style={{ color: isCall ? '#34d399' : '#f87171' }}>
                {isCall ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
                <span className="text-5xl font-black tracking-[0.15em]" style={{
                  textShadow: isCall
                    ? '0 0 35px rgba(52,211,153,0.9), 0 0 70px rgba(52,211,153,0.3)'
                    : '0 0 35px rgba(248,113,113,0.9), 0 0 70px rgba(248,113,113,0.3)',
                }}>{signal.direction}</span>
              </div>
              {/* Strength bar */}
              <div className="mt-3 flex items-center gap-2.5">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 130, background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${signal.strength}%`,
                      background: isCall
                        ? 'linear-gradient(90deg,#065f46,#10b981,#34d399)'
                        : 'linear-gradient(90deg,#7f1d1d,#ef4444,#f87171)',
                      transition: 'width 0.6s ease',
                    }} />
                </div>
                <span className="text-xs" style={{ color: '#3a5070' }}>
                  Strength <span className="text-white font-bold">{signal.strength}%</span>
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: '#2a4060' }}>
                R:R = <span className="text-cyan-400 font-mono font-bold">1:{signal.riskReward}</span>
              </div>
            </div>
            <AccuracyMeter accuracy={signal.accuracy} size="lg" label="Accuracy" showShelter />
          </div>

          {/* Entry / SL / TP */}
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            {[
              { icon: <Clock className="w-3 h-3" />,        label: 'ENTRY TIME',  value: fmt(signal.entryTime),         color: '#00e5ff' },
              { icon: <AlertTriangle className="w-3 h-3" />, label: 'STOP LOSS',   value: fmtP(signal.stopLoss, signal.pair.pip),   color: '#f87171' },
              { icon: <Target className="w-3 h-3" />,        label: 'TAKE PROFIT', value: fmtP(signal.takeProfit, signal.pair.pip), color: '#34d399' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1 mb-1 text-[9px]" style={{ color: '#2a4060' }}>
                  {item.icon}{item.label}
                </div>
                <div className="font-mono font-bold text-[11px]" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[9px] mb-1" style={{ color: '#2a4060' }}>ENTRY PRICE</div>
              <div className="text-white font-mono font-bold text-sm">{fmtP(signal.entryPrice, signal.pair.pip)}</div>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[9px] mb-1" style={{ color: '#2a4060' }}>EXPIRY TIME</div>
              <div className="font-mono font-bold text-xs" style={{ color: '#fb923c' }}>{fmt(signal.expiryTime)}</div>
            </div>
          </div>

          {/* Indicator mini grid */}
          <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'RSI',   value: signal.indicators.rsi.toFixed(0),          ok: isCall ? signal.indicators.rsi < 50 : signal.indicators.rsi > 50 },
              { label: 'MACD',  value: signal.indicators.macdHist > 0 ? '▲' : '▼', ok: isCall ? signal.indicators.macdHist > 0 : signal.indicators.macdHist < 0 },
              { label: 'STOCH', value: signal.indicators.stoch_k.toFixed(0),       ok: isCall ? signal.indicators.stoch_k < 50 : signal.indicators.stoch_k > 50 },
              { label: 'ADX',   value: signal.indicators.adx.toFixed(0),           ok: signal.indicators.adx > 25 },
              { label: 'ICHI',  value: signal.indicators.ichimokuCloud || '-',     ok: isCall ? signal.indicators.ichimokuCloud === 'ABOVE' : signal.indicators.ichimokuCloud === 'BELOW' },
              { label: 'PSAR',  value: signal.indicators.parabolicSAR || '-',      ok: isCall ? signal.indicators.parabolicSAR === 'BULL' : signal.indicators.parabolicSAR === 'BEAR' },
              { label: 'STRD',  value: signal.indicators.superTrend || '-',        ok: isCall ? signal.indicators.superTrend === 'UP' : signal.indicators.superTrend === 'DOWN' },
              { label: 'EMA',   value: signal.indicators.trendStrength.replace('STRONG_','S.').slice(0,5), ok: isCall ? ['UP','STRONG_UP'].includes(signal.indicators.trendStrength) : ['DOWN','STRONG_DOWN'].includes(signal.indicators.trendStrength) },
            ].map(ind => (
              <div key={ind.label} className="rounded-xl text-center py-2 px-1"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-[8px] uppercase mb-0.5" style={{ color: '#2a4060' }}>{ind.label}</div>
                <div className={`font-bold text-[10px] ${ind.ok ? 'text-emerald-400' : 'text-red-400'}`}>{ind.value}</div>
              </div>
            ))}
          </div>

          {/* Confluence panel */}
          <div className="px-4 pb-4">
            <div className="rounded-xl p-3"
              style={{
                background: isCall ? 'rgba(5,46,22,0.4)' : 'rgba(46,5,10,0.4)',
                border: isCall ? '1px solid rgba(52,211,153,0.14)' : '1px solid rgba(248,113,113,0.14)',
              }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3" style={{ color: isCall ? '#34d399' : '#f87171' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#3a5070' }}>Confluence Signals</span>
                </div>
                <span className="text-xs font-black" style={{ color: isCall ? '#34d399' : '#f87171' }}>
                  {signal.analysis.confluenceScore}%
                </span>
              </div>
              <div className="space-y-0.5 max-h-[90px] overflow-y-auto pr-1">
                {(isCall ? signal.analysis.bullSignals : signal.analysis.bearSignals).slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <CheckCircle className={`w-2.5 h-2.5 flex-shrink-0 mt-0.5 ${isCall ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-gray-300 leading-tight">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shiftBar { 0%{background-position:0% center;} 100%{background-position:200% center;} }
      `}</style>
    </div>
  );
});

SignalCard.displayName = 'SignalCard';
export default SignalCard;
