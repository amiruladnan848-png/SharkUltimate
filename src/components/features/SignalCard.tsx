import React, { useEffect, useState, memo } from 'react';
import { Signal, SignalResult } from '@/types/trading';
import { AccuracyMeter } from './AccuracyMeter';
import {
  TrendingUp, TrendingDown, Clock, Zap, Activity, Target, CheckCircle,
  ChevronRight, Shield, BarChart2, AlertTriangle, Trophy, XCircle, RefreshCw,
  Volume2, VolumeX
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
  martingaleStep: number;
  martingaleMultiplier: number;
  lastResult: SignalResult | null;
}

const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const fmtC = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const fmtP = (p: number, pip: number) => p.toFixed(pip <= 0.001 ? 3 : 5);

const CONF_COLORS = {
  VERY_HIGH: { text: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/40' },
  HIGH:      { text: 'text-cyan-400',    bg: 'bg-cyan-500/12',    border: 'border-cyan-500/40' },
  MEDIUM:    { text: 'text-yellow-400',  bg: 'bg-yellow-500/12',  border: 'border-yellow-500/40' },
  LOW:       { text: 'text-gray-400',    bg: 'bg-gray-500/8',     border: 'border-gray-600/25' },
};

const MTG_MULTIPLIERS = [1, 2, 4, 8];

export const SignalCard: React.FC<SignalCardProps> = memo(({
  signal, isAnalyzing, analysisPct, countdown, lastAnalysis, analysisStep,
  onManualSignal, dataReady, martingaleActive, martingaleStep, martingaleMultiplier, lastResult
}) => {
  const [pulse, setPulse] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    if (signal) { setPulse(true); setTimeout(() => setPulse(false), 800); }
  }, [signal?.id]);

  const isCall = signal?.direction === 'CALL';
  const conf = signal ? CONF_COLORS[signal.analysis.confidence] : CONF_COLORS.LOW;

  const getResultBadge = (result: SignalResult) => {
    switch (result) {
      case 'WIN':     return { icon: <Trophy className="w-3.5 h-3.5" />, text: 'WIN', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' };
      case 'LOSS':    return { icon: <XCircle className="w-3.5 h-3.5" />, text: 'LOSS', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' };
      case 'EXPIRED': return { icon: <Clock className="w-3.5 h-3.5" />, text: 'EXPIRED', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' };
      default:        return { icon: <Activity className="w-3.5 h-3.5" />, text: 'PENDING', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };
    }
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ── MTG Alert Banner ─────────────────────────────────────────── */}
      {martingaleActive && (
        <div className="rounded-2xl p-3.5 flex items-center gap-3" style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,146,60,0.05))',
          border: '1px solid rgba(245,158,11,0.35)',
        }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <RefreshCw className="w-4.5 h-4.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-black text-amber-400 tracking-wider">MTG RECOVERY ACTIVE — STEP {martingaleStep}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">
              Multiply your stake by <span className="font-black text-amber-300">×{martingaleMultiplier}</span> to recover previous loss
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-amber-400">×{martingaleMultiplier}</div>
            <div className="text-[9px] text-amber-700">stake</div>
          </div>
        </div>
      )}

      {/* ── Last Result Badge ─────────────────────────────────────────── */}
      {lastResult && lastResult !== 'PENDING' && (
        <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          style={{
            background: getResultBadge(lastResult).bg,
            border: `1px solid ${getResultBadge(lastResult).border}`,
          }}>
          <div style={{ color: getResultBadge(lastResult).color }}>{getResultBadge(lastResult).icon}</div>
          <div>
            <div className="text-xs font-black" style={{ color: getResultBadge(lastResult).color }}>
              Signal {getResultBadge(lastResult).text}
              {lastResult === 'LOSS' && martingaleActive && ' — MTG Activated'}
              {lastResult === 'WIN' && ' — MTG Reset'}
            </div>
            <div className="text-[9px] text-gray-600">Auto-detected from price movement</div>
          </div>
          <div className="ml-auto text-[9px] text-gray-600 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Auto Detected
          </div>
        </div>
      )}

      {/* ── Voice Toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] text-gray-700 font-semibold flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-cyan-700" />
          Bangla AI Voice System
        </div>
        <button
          onClick={() => setVoiceEnabled(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
          style={{
            background: voiceEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
            border: voiceEnabled ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: voiceEnabled ? '#10b981' : '#4a6080',
          }}
        >
          {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          {voiceEnabled ? 'বাংলা ভয়েস ON' : 'Voice OFF'}
        </button>
      </div>

      {/* ── GENERATE SIGNAL BUTTON ─────────────────────────────────────── */}
      <button
        onClick={onManualSignal}
        disabled={isAnalyzing || !dataReady}
        className="relative w-full py-4 rounded-2xl font-black text-base tracking-widest transition-all duration-200 overflow-hidden group select-none"
        style={isAnalyzing || !dataReady ? {
          opacity: 0.55, cursor: 'not-allowed',
          background: 'rgba(10,18,35,0.7)', border: '1px solid rgba(107,114,128,0.25)', color: '#4a6080',
        } : {
          background: 'linear-gradient(135deg, rgba(0,40,80,0.95), rgba(0,60,120,0.9), rgba(0,40,80,0.95))',
          border: '1px solid rgba(0,212,255,0.5)',
          color: '#00d4ff',
          boxShadow: '0 0 24px rgba(0,212,255,0.12)',
        }}
      >
        {!isAnalyzing && dataReady && (
          <>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-cyan-400/8 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/55 to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent animate-pulse" style={{ animationDelay: '0.6s' }} />
          </>
        )}
        <div className="flex items-center justify-center gap-3 relative z-10">
          {isAnalyzing ? (
            <><div className="w-4 h-4 rounded-full border-2 border-cyan-600/40 border-t-cyan-400 animate-spin" /><span className="text-sm">SHARK ENGINE SCANNING...</span></>
          ) : !dataReady ? (
            <><Activity className="w-4 h-4 animate-pulse" /><span className="text-sm">COLLECTING LIVE DATA...</span></>
          ) : (
            <><Zap className="w-5 h-5 animate-pulse" style={{ filter: 'drop-shadow(0 0 6px #00d4ff)' }} />
              <span style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
                {martingaleActive ? `⚡ MTG RECOVERY SIGNAL ×${martingaleMultiplier}` : '⚡ GENERATE SIGNAL'}
              </span>
            </>
          )}
        </div>
        {!isAnalyzing && dataReady && (
          <div className="text-[10px] font-normal text-cyan-600/60 mt-0.5 relative z-10">
            21-step deep analysis • Deriv + TradingView fusion
          </div>
        )}
      </button>

      {/* ── ANALYSIS PROGRESS ──────────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="rounded-2xl p-4 space-y-3" style={{ border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(5,10,22,0.95)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(0,212,255,0.8)' }}>Deep 21-Step Analysis</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{analysisPct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full transition-all duration-200"
              style={{ width: `${analysisPct}%`, background: 'linear-gradient(90deg, #0ea5e9, #00d4ff, #0ea5e9)', boxShadow: '0 0 10px rgba(0,212,255,0.6)' }}
            />
          </div>
          <div className="space-y-1 max-h-40 overflow-hidden">
            {ANALYSIS_STEPS.slice(Math.max(0, analysisStep - 1), analysisStep + 4).map((step, i) => {
              const gIdx = Math.max(0, analysisStep - 1) + i;
              const done = gIdx < analysisStep;
              const curr = gIdx === analysisStep;
              return (
                <div key={step} className={`flex items-center gap-2 py-0.5 transition-all duration-200 ${curr ? 'opacity-100' : done ? 'opacity-45' : 'opacity-20'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${curr ? 'bg-cyan-400 animate-pulse' : done ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                  <span className={`text-[10px] font-mono ${curr ? 'text-cyan-300' : done ? 'text-emerald-400/60' : 'text-gray-700'}`}>{step}</span>
                  {done && <CheckCircle className="w-2.5 h-2.5 text-emerald-500/70 ml-auto flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NO SIGNAL IDLE STATE ────────────────────────────────────────── */}
      {!signal && !isAnalyzing && (
        <div className="rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] text-center"
          style={{ border: '1px solid rgba(26,37,64,0.7)', background: 'rgba(6,12,26,0.75)', backdropFilter: 'blur(12px)' }}>
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border border-gray-800/60 flex items-center justify-center">
              <BarChart2 className="w-8 h-8 text-gray-700" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500/12 border border-cyan-500/35 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-300 font-bold text-sm mb-1.5">Signal Engine Ready</p>
          <p className="text-gray-600 text-xs mb-4 max-w-[210px] leading-relaxed">
            {lastAnalysis || 'Click Generate Signal for 21-step deep analysis with TradingView + Deriv fusion'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span>Next 1-min boundary: <span className="text-cyan-500 font-mono font-black">{fmtC(countdown)}</span></span>
          </div>
        </div>
      )}

      {/* ── SIGNAL RESULT ──────────────────────────────────────────────── */}
      {signal && !isAnalyzing && (
        <div className={`rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500 ${pulse ? 'scale-[1.008]' : 'scale-100'}`}
          style={{
            border: isCall ? '1px solid rgba(16,185,129,0.55)' : '1px solid rgba(239,68,68,0.55)',
            background: isCall
              ? 'linear-gradient(145deg,rgba(4,20,12,0.9),rgba(6,12,26,0.95))'
              : 'linear-gradient(145deg,rgba(22,5,8,0.9),rgba(6,12,26,0.95))',
            boxShadow: isCall ? '0 4px 40px rgba(16,185,129,0.07)' : '0 4px 40px rgba(239,68,68,0.07)',
          }}>

          {/* Top accent bar */}
          <div className="h-[3px] w-full" style={{
            background: isCall
              ? 'linear-gradient(90deg,#065f46,#10b981,#34d399,#10b981,#065f46)'
              : 'linear-gradient(90deg,#7f1d1d,#ef4444,#f87171,#ef4444,#7f1d1d)',
            backgroundSize: '200% 100%',
            animation: 'shiftBg 2.5s linear infinite',
          }} />

          {/* Header row */}
          <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b ${isCall ? 'border-emerald-900/40' : 'border-red-900/40'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isCall ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{ boxShadow: isCall ? '0 0 6px #10b981' : '0 0 6px #ef4444' }} />
              <span className="text-white font-black text-sm">{signal.pair.symbol}</span>
              {signal.pair.flag && <span>{signal.pair.flag}</span>}
              {signal.isMartingale && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border border-amber-500/35 bg-amber-500/10 text-amber-400">
                  MTG ×{MTG_MULTIPLIERS[Math.min(signal.martingaleStep||0,3)]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {signal.status !== 'PENDING' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black"
                  style={{
                    background: signal.status === 'WIN' ? 'rgba(16,185,129,0.15)' : signal.status === 'LOSS' ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.1)',
                    border: signal.status === 'WIN' ? '1px solid rgba(16,185,129,0.4)' : signal.status === 'LOSS' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(107,114,128,0.25)',
                    color: signal.status === 'WIN' ? '#10b981' : signal.status === 'LOSS' ? '#ef4444' : '#9ca3af',
                  }}>
                  {signal.status === 'WIN' ? <Trophy className="w-3 h-3" /> : signal.status === 'LOSS' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {signal.status}
                </div>
              )}
              <div className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${conf.text} ${conf.bg} ${conf.border}`}>
                {signal.analysis.confidence.replace('_', ' ')} CONFIDENCE
              </div>
            </div>
          </div>

          {/* Direction block */}
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <div className={`flex items-center gap-3 ${isCall ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCall ? <TrendingUp className="w-9 h-9" /> : <TrendingDown className="w-9 h-9" />}
                <span className="text-5xl font-black tracking-widest" style={{
                  textShadow: isCall ? '0 0 30px rgba(16,185,129,0.85)' : '0 0 30px rgba(239,68,68,0.85)',
                }}>{signal.direction}</span>
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="h-1.5 rounded-full w-32 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className={`h-full rounded-full ${isCall ? 'bg-gradient-to-r from-emerald-700 to-cyan-400' : 'bg-gradient-to-r from-red-700 to-orange-400'}`}
                    style={{ width: `${signal.strength}%`, transition: 'width 0.6s ease' }} />
                </div>
                <span className="text-xs text-gray-500">Strength <span className="text-white font-bold">{signal.strength}%</span></span>
              </div>
              <div className="text-xs text-gray-600 mt-0.5">R:R = <span className="text-cyan-400 font-mono font-bold">1:{signal.riskReward}</span></div>
            </div>
            <AccuracyMeter accuracy={signal.accuracy} size="lg" label="Accuracy" showShelter />
          </div>

          {/* Entry / SL / TP */}
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            {[
              { icon: <Clock className="w-3 h-3" />, label: 'ENTRY TIME', value: fmt(signal.entryTime), color: 'text-cyan-400' },
              { icon: <AlertTriangle className="w-3 h-3" />, label: 'STOP LOSS', value: fmtP(signal.stopLoss, signal.pair.pip), color: 'text-red-400' },
              { icon: <Target className="w-3 h-3" />, label: 'TAKE PROFIT', value: fmtP(signal.takeProfit, signal.pair.pip), color: 'text-emerald-400' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-1 text-gray-700 text-[9px] mb-1">{item.icon}{item.label}</div>
                <div className={`${item.color} font-mono font-bold text-[11px]`}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-gray-700 text-[9px] mb-1">ENTRY PRICE</div>
              <div className="text-white font-mono font-bold text-sm">{fmtP(signal.entryPrice, signal.pair.pip)}</div>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-gray-700 text-[9px] mb-1">EXPIRY TIME</div>
              <div className="text-orange-400 font-mono font-bold text-xs">{fmt(signal.expiryTime)}</div>
            </div>
          </div>

          {/* Indicator mini grid */}
          <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'RSI', value: signal.indicators.rsi.toFixed(0), ok: isCall ? signal.indicators.rsi < 50 : signal.indicators.rsi > 50 },
              { label: 'MACD', value: signal.indicators.macdHist > 0 ? '▲' : '▼', ok: isCall ? signal.indicators.macdHist > 0 : signal.indicators.macdHist < 0 },
              { label: 'STOCH', value: signal.indicators.stoch_k.toFixed(0), ok: isCall ? signal.indicators.stoch_k < 50 : signal.indicators.stoch_k > 50 },
              { label: 'ADX', value: signal.indicators.adx.toFixed(0), ok: signal.indicators.adx > 25 },
              { label: 'ICHI', value: signal.indicators.ichimokuCloud || 'INSIDE', ok: isCall ? signal.indicators.ichimokuCloud === 'ABOVE' : signal.indicators.ichimokuCloud === 'BELOW' },
              { label: 'PSAR', value: signal.indicators.parabolicSAR || 'BULL', ok: isCall ? signal.indicators.parabolicSAR === 'BULL' : signal.indicators.parabolicSAR === 'BEAR' },
              { label: 'STRND', value: signal.indicators.superTrend || 'UP', ok: isCall ? signal.indicators.superTrend === 'UP' : signal.indicators.superTrend === 'DOWN' },
              { label: 'EMA', value: (signal.indicators.trendStrength).replace('STRONG_', 'S.').slice(0, 5), ok: isCall ? ['UP','STRONG_UP'].includes(signal.indicators.trendStrength) : ['DOWN','STRONG_DOWN'].includes(signal.indicators.trendStrength) },
            ].map(ind => (
              <div key={ind.label} className="rounded-lg text-center p-1.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-gray-700 text-[8px] uppercase">{ind.label}</div>
                <div className={`font-bold text-[10px] mt-0.5 ${ind.ok ? 'text-emerald-400' : 'text-red-400'}`}>{ind.value}</div>
              </div>
            ))}
          </div>

          {/* Confluence */}
          <div className="px-4 pb-4">
            <div className={`rounded-xl p-3 ${isCall ? 'border border-emerald-500/12 bg-emerald-950/30' : 'border border-red-500/12 bg-red-950/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Signal Confluence</span>
                <span className={`text-xs font-black ${isCall ? 'text-emerald-400' : 'text-red-400'}`}>{signal.analysis.confluenceScore}%</span>
              </div>
              <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
                {(isCall ? signal.analysis.bullSignals : signal.analysis.bearSignals).slice(0, 7).map((s, i) => (
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
        @keyframes shiftBg { 0%{background-position:0% center;} 100%{background-position:200% center;} }
      `}</style>
    </div>
  );
});

SignalCard.displayName = 'SignalCard';
export default SignalCard;
