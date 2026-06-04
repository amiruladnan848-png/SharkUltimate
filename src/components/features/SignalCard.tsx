import React, { useEffect, useState, memo } from 'react';
import { Signal, SignalResult } from '@/types/trading';
import { AccuracyMeter } from './AccuracyMeter';
import {
  TrendingUp, TrendingDown, Clock, Zap, Activity, Target, CheckCircle,
  Shield, BarChart2, AlertTriangle, Trophy, XCircle, RefreshCw, Volume2, VolumeX, Cpu
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
  VERY_HIGH: { text: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.5)',  glow: 'rgba(52,211,153,0.35)' },
  HIGH:      { text: '#00e5ff', bg: 'rgba(0,229,255,0.1)',    border: 'rgba(0,229,255,0.45)',   glow: 'rgba(0,229,255,0.28)' },
  MEDIUM:    { text: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.38)',  glow: 'rgba(251,191,36,0.22)' },
  LOW:       { text: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.2)',  glow: 'transparent' },
};

const getResultBadge = (result: SignalResult) => {
  switch (result) {
    case 'WIN':     return { icon: <Trophy className="w-4 h-4" />,   text: 'WIN',     color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.45)' };
    case 'LOSS':    return { icon: <XCircle className="w-4 h-4" />,  text: 'LOSS',    color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.4)' };
    case 'EXPIRED': return { icon: <Clock className="w-4 h-4" />,    text: 'EXPIRED', color: '#6b7280', bg: 'rgba(107,114,128,0.07)',border: 'rgba(107,114,128,0.22)' };
    default:        return { icon: <Activity className="w-4 h-4" />, text: 'PENDING', color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.22)' };
  }
};

export const SignalCard: React.FC<SignalCardProps> = memo(({
  signal, isAnalyzing, analysisPct, countdown, lastAnalysis, analysisStep,
  onManualSignal, dataReady, martingaleActive, martingaleMultiplier, lastResult,
}) => {
  const [pulse, setPulse]             = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    if (signal) { setPulse(true); setTimeout(() => setPulse(false), 800); }
  }, [signal?.id]);

  const isCall = signal?.direction === 'CALL';
  const conf   = signal ? CONF_COLORS[signal.analysis.confidence] : CONF_COLORS.LOW;

  return (
    <div className="flex flex-col gap-3">

      {/* ── 1-Step MTG Banner ── */}
      {martingaleActive && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg,rgba(60,20,0,0.95),rgba(80,30,0,0.9))',
            border: '1px solid rgba(251,146,60,0.55)',
            boxShadow: '0 4px 30px rgba(251,146,60,0.1)',
          }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.4)' }}>
            <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" style={{ animationDuration: '2.5s' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-orange-300 tracking-wider">⚡ 1-STEP MTG RECOVERY</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(251,146,60,0.55)' }}>
              Double stake <span className="font-black text-orange-300">×{martingaleMultiplier}</span> — Next signal auto-activates MTG
            </div>
          </div>
          <div className="text-4xl font-black text-orange-400"
            style={{ textShadow: '0 0 20px rgba(251,146,60,0.8)' }}>×2</div>
        </div>
      )}

      {/* ── Last Result ── */}
      {lastResult && lastResult !== 'PENDING' && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: getResultBadge(lastResult).bg, border: `1px solid ${getResultBadge(lastResult).border}` }}>
          <div style={{ color: getResultBadge(lastResult).color }}>{getResultBadge(lastResult).icon}</div>
          <div className="flex-1">
            <div className="text-sm font-black" style={{ color: getResultBadge(lastResult).color }}>
              Signal {getResultBadge(lastResult).text}
              {lastResult === 'LOSS' && martingaleActive && ' — MTG Recovery Activated'}
              {lastResult === 'WIN' && ' — Position Closed Successfully'}
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: '#3a5070' }}>
              Auto-detected via live price comparison
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px]" style={{ color: '#2a4060' }}>
            <Cpu className="w-3 h-3" /> AUTO
          </div>
        </div>
      )}

      {/* ── Voice Toggle ── */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: '#1e3060' }}>
          <Activity className="w-3 h-3" style={{ color: '#2a4880' }} />
          Bangla AI Voice
        </div>
        <button onClick={() => setVoiceEnabled(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all"
          style={{
            background:  voiceEnabled ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
            border:      voiceEnabled ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(255,255,255,0.07)',
            color:       voiceEnabled ? '#34d399' : '#3a5070',
          }}>
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          {voiceEnabled ? 'বাংলা Voice ON' : 'Voice OFF'}
        </button>
      </div>

      {/* ── GENERATE SIGNAL BUTTON ── */}
      <button onClick={onManualSignal} disabled={isAnalyzing || !dataReady}
        className="relative w-full py-5 rounded-2xl font-black text-sm tracking-[0.15em] transition-all duration-200 overflow-hidden group select-none"
        style={isAnalyzing || !dataReady ? {
          opacity: 0.45, cursor: 'not-allowed',
          background: 'rgba(6,12,28,0.8)', border: '1px solid rgba(255,255,255,0.05)', color: '#2a4060',
        } : {
          background: martingaleActive
            ? 'linear-gradient(135deg,rgba(55,18,0,0.98),rgba(80,28,0,0.95),rgba(55,18,0,0.98))'
            : 'linear-gradient(135deg,rgba(0,30,60,0.98),rgba(0,50,100,0.95),rgba(0,30,60,0.98))',
          border: martingaleActive ? '1px solid rgba(251,146,60,0.65)' : '1px solid rgba(0,212,255,0.6)',
          color: martingaleActive ? '#fb923c' : '#00e5ff',
          boxShadow: martingaleActive
            ? '0 0 40px rgba(251,146,60,0.2), 0 6px 24px rgba(0,0,0,0.6)'
            : '0 0 40px rgba(0,212,255,0.18), 0 6px 24px rgba(0,0,0,0.6)',
        }}>
        {/* Hover shimmer */}
        {!isAnalyzing && dataReady && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }} />
        )}
        {/* Top glow line */}
        {!isAnalyzing && dataReady && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: martingaleActive
                ? 'linear-gradient(90deg,transparent,rgba(251,146,60,0.75),rgba(251,200,60,0.6),rgba(251,146,60,0.75),transparent)'
                : 'linear-gradient(90deg,transparent,rgba(0,212,255,0.75),rgba(100,230,255,0.6),rgba(0,212,255,0.75),transparent)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        )}
        {/* Bottom glow line */}
        {!isAnalyzing && dataReady && (
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: martingaleActive
                ? 'linear-gradient(90deg,transparent,rgba(251,146,60,0.4),transparent)'
                : 'linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent)',
            }}
          />
        )}

        <div className="flex flex-col items-center justify-center gap-1.5 relative z-10">
          {isAnalyzing ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-cyan-700/40 border-t-cyan-300 animate-spin" />
              <span>SHARK ENGINE ANALYSING...</span>
            </div>
          ) : !dataReady ? (
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>COLLECTING LIVE DATA...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5"
                style={{
                  filter: martingaleActive ? 'drop-shadow(0 0 8px #fb923c)' : 'drop-shadow(0 0 8px #00e5ff)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              <span style={{ textShadow: martingaleActive ? '0 0 18px rgba(251,146,60,0.7)' : '0 0 18px rgba(0,229,255,0.7)', letterSpacing: '0.18em' }}>
                {martingaleActive ? `⚡ MTG ×2 RECOVERY SIGNAL` : '⚡ GENERATE SIGNAL'}
              </span>
            </div>
          )}
          {!isAnalyzing && dataReady && (
            <div className="text-[10px] font-normal opacity-50 tracking-normal">
              24-step deep analysis • Deriv + TradingView + QX Broker fusion
            </div>
          )}
        </div>
      </button>

      {/* ── ANALYSIS PROGRESS ── */}
      {isAnalyzing && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(3,8,20,0.98)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: 'rgba(0,229,255,0.85)' }}>
              24-Step SHARK Engine Analysis
            </span>
            <span className="text-sm font-mono font-black text-cyan-300">{analysisPct}%</span>
          </div>

          {/* Progress bar with glow */}
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${analysisPct}%`,
                background: 'linear-gradient(90deg, #0369a1, #0ea5e9, #00e5ff, #0ea5e9)',
                boxShadow: '0 0 14px rgba(0,229,255,0.8), 0 0 4px rgba(255,255,255,0.4)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1s linear infinite',
              }} />
          </div>

          {/* Analysis steps */}
          <div className="space-y-1 max-h-48 overflow-hidden">
            {ANALYSIS_STEPS.slice(Math.max(0, analysisStep - 1), analysisStep + 6).map((step, i) => {
              const gIdx = Math.max(0, analysisStep - 1) + i;
              const done = gIdx < analysisStep;
              const curr = gIdx === analysisStep;
              return (
                <div key={step}
                  className={`flex items-center gap-2.5 py-0.5 transition-all duration-200`}
                  style={{ opacity: curr ? 1 : done ? 0.35 : 0.14 }}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${curr ? 'bg-cyan-300 animate-pulse' : done ? 'bg-emerald-400' : 'bg-gray-700'}`}
                    style={curr ? { boxShadow: '0 0 6px #00e5ff' } : {}} />
                  <span className={`text-[10px] font-mono truncate ${curr ? 'text-cyan-200' : done ? 'text-emerald-400/60' : 'text-gray-700'}`}>
                    {step}
                  </span>
                  {done && <CheckCircle className="w-3 h-3 text-emerald-500/60 ml-auto flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── IDLE STATE ── */}
      {!signal && !isAnalyzing && (
        <div className="rounded-2xl p-8 flex flex-col items-center justify-center min-h-[220px] text-center"
          style={{ border: '1px solid rgba(14,26,56,0.7)', background: 'rgba(3,8,20,0.85)' }}>
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.09)' }}>
              <BarChart2 className="w-10 h-10" style={{ color: '#1a3260' }} />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.4)' }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 6px #00d4ff' }} />
            </div>
          </div>
          <p className="text-white font-black text-sm mb-2">Signal Engine Ready</p>
          <p className="text-xs leading-relaxed mb-5 max-w-[240px]" style={{ color: '#1e3050' }}>
            {lastAnalysis || 'Click Generate Signal for 24-step deep analysis — Accuracy Shelter v7.0 active'}
          </p>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: '#1e3050' }}>
            <Clock className="w-3.5 h-3.5" />
            Next 1-min boundary:
            <span className="text-cyan-400 font-mono font-black ml-1" style={{ textShadow: '0 0 8px rgba(0,212,255,0.5)' }}>{fmtC(countdown)}</span>
          </div>
        </div>
      )}

      {/* ── SIGNAL RESULT ── */}
      {signal && !isAnalyzing && (
        <div className={`rounded-2xl overflow-hidden transition-all duration-500 ${pulse ? 'scale-[1.008]' : 'scale-100'}`}
          style={{
            border: isCall ? '1px solid rgba(52,211,153,0.65)' : '1px solid rgba(248,113,113,0.65)',
            background: isCall
              ? 'linear-gradient(145deg,rgba(2,14,8,0.98),rgba(3,8,20,0.99))'
              : 'linear-gradient(145deg,rgba(16,3,5,0.98),rgba(3,8,20,0.99))',
            boxShadow: isCall ? '0 8px 60px rgba(52,211,153,0.1)' : '0 8px 60px rgba(248,113,113,0.1)',
          }}>

          {/* Top animated bar */}
          <div className="h-[3px]" style={{
            background: isCall
              ? 'linear-gradient(90deg, #064e3b, #10b981, #34d399, #6ee7b7, #34d399, #10b981, #064e3b)'
              : 'linear-gradient(90deg, #7f1d1d, #ef4444, #f87171, #fca5a5, #f87171, #ef4444, #7f1d1d)',
            backgroundSize: '200% 100%',
            animation: 'shiftBar 3s linear infinite',
          }} />

          {/* Signal Header */}
          <div className="px-4 py-3 flex items-center justify-between gap-2 flex-wrap"
            style={{ borderBottom: isCall ? '1px solid rgba(52,211,153,0.1)' : '1px solid rgba(248,113,113,0.1)' }}>
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full animate-pulse ${isCall ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{ boxShadow: isCall ? '0 0 10px #34d399, 0 0 20px rgba(52,211,153,0.4)' : '0 0 10px #f87171, 0 0 20px rgba(248,113,113,0.4)' }} />
              <span className="text-white font-black text-sm">{signal.pair.symbol}</span>
              {signal.pair.flag && <span className="text-lg">{signal.pair.flag}</span>}
              {signal.isMartingale && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black"
                  style={{ color: '#fb923c', border: '1px solid rgba(251,146,60,0.4)', background: 'rgba(251,146,60,0.1)' }}>
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
              <div className="px-2.5 py-1 rounded-lg text-[10px] font-black"
                style={{ color: conf.text, background: conf.bg, border: `1px solid ${conf.border}`, boxShadow: `0 0 12px ${conf.glow}` }}>
                {signal.analysis.confidence.replace('_', ' ')} CONF
              </div>
            </div>
          </div>

          {/* Main Signal Direction */}
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3" style={{ color: isCall ? '#34d399' : '#f87171' }}>
                {isCall ? <TrendingUp className="w-12 h-12" /> : <TrendingDown className="w-12 h-12" />}
                <span className="text-5xl font-black tracking-[0.12em]" style={{
                  textShadow: isCall
                    ? '0 0 40px rgba(52,211,153,1), 0 0 80px rgba(52,211,153,0.35)'
                    : '0 0 40px rgba(248,113,113,1), 0 0 80px rgba(248,113,113,0.35)',
                }}>{signal.direction}</span>
              </div>
              {/* Strength bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 rounded-full overflow-hidden" style={{ width: 140, background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${signal.strength}%`,
                      background: isCall
                        ? 'linear-gradient(90deg,#064e3b,#059669,#34d399)'
                        : 'linear-gradient(90deg,#7f1d1d,#dc2626,#f87171)',
                      boxShadow: isCall ? '0 0 8px rgba(52,211,153,0.6)' : '0 0 8px rgba(248,113,113,0.6)',
                    }} />
                </div>
                <span className="text-xs" style={{ color: '#2a4060' }}>
                  <span className="text-white font-black">{signal.strength}%</span> strength
                </span>
              </div>
              <div className="text-xs mt-1.5 flex items-center gap-2" style={{ color: '#1e3050' }}>
                <span>R:R = <span className="text-cyan-400 font-mono font-black">1:{signal.riskReward}</span></span>
                <span className="text-[#1a2a40]">•</span>
                <span>Confluence: <span style={{ color: conf.text }} className="font-black">{signal.analysis.confluenceScore}%</span></span>
              </div>
            </div>
            <AccuracyMeter accuracy={signal.accuracy} size="lg" label="Accuracy" showShelter />
          </div>

          {/* Entry / SL / TP / Expiry */}
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            {[
              { icon: <Clock className="w-3 h-3" />,        label: 'ENTRY TIME',  value: fmt(signal.entryTime),  color: '#00e5ff' },
              { icon: <Clock className="w-3 h-3" />,        label: 'EXPIRY TIME', value: fmt(signal.expiryTime), color: '#fb923c' },
              { icon: <AlertTriangle className="w-3 h-3" />, label: 'STOP LOSS',  value: fmtP(signal.stopLoss, signal.pair.pip),   color: '#f87171' },
              { icon: <Target className="w-3 h-3" />,        label: 'TAKE PROFIT',value: fmtP(signal.takeProfit, signal.pair.pip), color: '#34d399' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-1 mb-1 text-[9px]" style={{ color: '#1e3050' }}>
                  {item.icon}{item.label}
                </div>
                <div className="font-mono font-black text-[11px]" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Entry price */}
          <div className="px-4 pb-3">
            <div className="rounded-xl p-2.5 flex items-center justify-between"
              style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
              <div className="text-[9px]" style={{ color: '#1e3050' }}>ENTRY PRICE</div>
              <div className="text-white font-mono font-black text-sm"
                style={{ textShadow: '0 0 8px rgba(0,229,255,0.3)' }}>
                {fmtP(signal.entryPrice, signal.pair.pip)}
              </div>
            </div>
          </div>

          {/* 8 Indicator Mini Grid */}
          <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'RSI',   v: signal.indicators.rsi.toFixed(0),          ok: isCall ? signal.indicators.rsi < 50 : signal.indicators.rsi > 50 },
              { label: 'MACD',  v: signal.indicators.macdHist > 0 ? '▲' : '▼', ok: isCall ? signal.indicators.macdHist > 0 : signal.indicators.macdHist < 0 },
              { label: 'STOCH', v: signal.indicators.stoch_k.toFixed(0),       ok: isCall ? signal.indicators.stoch_k < 50 : signal.indicators.stoch_k > 50 },
              { label: 'ADX',   v: signal.indicators.adx.toFixed(0),           ok: signal.indicators.adx > 25 },
              { label: 'ICHI',  v: (signal.indicators.ichimokuCloud || 'IN').slice(0, 3), ok: isCall ? signal.indicators.ichimokuCloud === 'ABOVE' : signal.indicators.ichimokuCloud === 'BELOW' },
              { label: 'PSAR',  v: (signal.indicators.parabolicSAR || 'B').slice(0, 4),  ok: isCall ? signal.indicators.parabolicSAR === 'BULL' : signal.indicators.parabolicSAR === 'BEAR' },
              { label: 'STRD',  v: (signal.indicators.superTrend || 'U').slice(0, 2),    ok: isCall ? signal.indicators.superTrend === 'UP' : signal.indicators.superTrend === 'DOWN' },
              { label: 'EMA',   v: signal.indicators.trendStrength.replace('STRONG_', 'S').slice(0, 4), ok: isCall ? ['UP','STRONG_UP'].includes(signal.indicators.trendStrength) : ['DOWN','STRONG_DOWN'].includes(signal.indicators.trendStrength) },
            ].map(ind => (
              <div key={ind.label} className="rounded-xl text-center py-2 px-1 transition-all"
                style={{
                  background: ind.ok ? (isCall ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)') : 'rgba(255,255,255,0.02)',
                  border: ind.ok
                    ? (isCall ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(248,113,113,0.2)')
                    : '1px solid rgba(255,255,255,0.04)',
                }}>
                <div className="text-[8px] uppercase mb-0.5" style={{ color: '#1e3050' }}>{ind.label}</div>
                <div className={`font-black text-[11px] ${ind.ok ? (isCall ? 'text-emerald-400' : 'text-red-400') : 'text-gray-600'}`}>{ind.v}</div>
              </div>
            ))}
          </div>

          {/* Confluence Panel */}
          <div className="px-4 pb-4">
            <div className="rounded-xl p-3"
              style={{
                background: isCall ? 'rgba(3,22,12,0.5)' : 'rgba(20,3,5,0.5)',
                border: isCall ? '1px solid rgba(52,211,153,0.16)' : '1px solid rgba(248,113,113,0.16)',
              }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" style={{ color: isCall ? '#34d399' : '#f87171' }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: '#2a4060' }}>
                    Confluence ({(isCall ? signal.analysis.bullSignals : signal.analysis.bearSignals).length} signals)
                  </span>
                </div>
                <span className="text-sm font-black" style={{ color: isCall ? '#34d399' : '#f87171' }}>
                  {signal.analysis.confluenceScore}%
                </span>
              </div>
              <div className="space-y-0.5 max-h-[100px] overflow-y-auto pr-1 custom-scroll">
                {(isCall ? signal.analysis.bullSignals : signal.analysis.bearSignals).slice(0, 10).map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <CheckCircle className={`w-2.5 h-2.5 flex-shrink-0 mt-0.5 ${isCall ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-gray-400 leading-tight">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shiftBar {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .custom-scroll::-webkit-scrollbar { width: 2px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 1px; }
      `}</style>
    </div>
  );
});

SignalCard.displayName = 'SignalCard';
export default SignalCard;
