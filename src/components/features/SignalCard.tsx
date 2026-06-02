import React, { useEffect, useState, memo } from 'react';
import { Signal } from '@/types/trading';
import { AccuracyMeter } from './AccuracyMeter';
import { TrendingUp, TrendingDown, Clock, Zap, Activity, Target, CheckCircle, ChevronRight, Shield, BarChart2, AlertTriangle } from 'lucide-react';
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
}

const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const fmtC = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const fmtPrice = (p: number, pip: number) => p.toFixed(pip <= 0.00001 ? 5 : pip <= 0.001 ? 3 : 2);

const CONF_COLORS = {
  VERY_HIGH: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  HIGH:      { text: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/40' },
  MEDIUM:    { text: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/40' },
  LOW:       { text: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-600/30' },
};

export const SignalCard: React.FC<SignalCardProps> = memo(({
  signal, isAnalyzing, analysisPct, countdown, lastAnalysis, analysisStep, onManualSignal, dataReady
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (signal) { setPulse(true); setTimeout(() => setPulse(false), 900); }
  }, [signal?.id]);

  const isCall = signal?.direction === 'CALL';
  const conf = signal ? CONF_COLORS[signal.analysis.confidence] : CONF_COLORS.LOW;

  return (
    <div className="flex flex-col gap-3">

      {/* ── GENERATE SIGNAL BUTTON ─────────────────────────────────────── */}
      <button
        onClick={onManualSignal}
        disabled={isAnalyzing || !dataReady}
        className={`relative w-full py-4 rounded-2xl font-black text-base tracking-widest transition-all duration-200 overflow-hidden group select-none ${
          isAnalyzing || !dataReady
            ? 'opacity-60 cursor-not-allowed bg-[#0d1628]/60 border border-gray-700/40 text-gray-500'
            : 'bg-gradient-to-r from-[#0d3358] via-[#0a4070] to-[#0d3358] border border-cyan-500/50 text-cyan-300 hover:border-cyan-400/80 hover:shadow-xl hover:shadow-cyan-500/25 active:scale-[0.98]'
        }`}
      >
        {/* Shimmer */}
        {!isAnalyzing && dataReady && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent pointer-events-none" />
        )}
        {/* Scan border animation */}
        {!isAnalyzing && dataReady && (
          <>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        <div className="flex items-center justify-center gap-3 relative z-10">
          {isAnalyzing ? (
            <><div className="w-4 h-4 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 animate-spin" /><span className="text-sm">SHARK ENGINE SCANNING...</span></>
          ) : !dataReady ? (
            <><Activity className="w-4 h-4 animate-pulse" /><span className="text-sm">COLLECTING LIVE DATA...</span></>
          ) : (
            <><Zap className="w-5 h-5 animate-pulse text-cyan-400" /><span>⚡ GENERATE SIGNAL</span></>
          )}
        </div>
        {!isAnalyzing && dataReady && (
          <div className="text-[10px] font-normal text-cyan-500/60 mt-0.5 relative z-10">Deep 16-step market analysis engine</div>
        )}
      </button>

      {/* ── ANALYSIS PROGRESS ──────────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="rounded-2xl border border-cyan-500/25 bg-[#070d1a]/90 backdrop-blur-xl p-4 space-y-3">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-cyan-400/80 font-bold tracking-widest uppercase">Deep Analysis</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">{analysisPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-800/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
              style={{ width: `${analysisPct}%`, boxShadow: '0 0 8px rgba(0,212,255,0.5)' }}
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 gap-1 max-h-36 overflow-hidden">
            {ANALYSIS_STEPS.slice(Math.max(0, analysisStep - 2), analysisStep + 3).map((step, i) => {
              const globalIdx = Math.max(0, analysisStep - 2) + i;
              const isDone = globalIdx < analysisStep;
              const isCurrent = globalIdx === analysisStep;
              return (
                <div key={step} className={`flex items-center gap-2 py-0.5 transition-all duration-200 ${isCurrent ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-25'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? 'bg-cyan-400 animate-pulse' : isDone ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  <span className={`text-[10px] font-mono ${isCurrent ? 'text-cyan-300' : isDone ? 'text-emerald-400/70' : 'text-gray-600'}`}>{step}</span>
                  {isDone && <CheckCircle className="w-2.5 h-2.5 text-emerald-500 ml-auto flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NO SIGNAL STATE ──────────────────────────────────────────────── */}
      {!signal && !isAnalyzing && (
        <div className="rounded-2xl border border-[#1a2540]/80 bg-[#070d1a]/70 backdrop-blur-xl p-6 flex flex-col items-center justify-center min-h-[240px] text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border border-gray-700/50 flex items-center justify-center">
              <BarChart2 className="w-8 h-8 text-gray-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-300 font-bold text-sm mb-1">Signal Engine Ready</p>
          <p className="text-gray-600 text-xs mb-4 max-w-[220px] leading-relaxed">
            {lastAnalysis || 'Click Generate Signal to run 16-step deep analysis with laser chart scan'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span>Next 1-min entry: <span className="text-cyan-500 font-mono font-bold">{fmtC(countdown)}</span></span>
          </div>
        </div>
      )}

      {/* ── SIGNAL RESULT ─────────────────────────────────────────────────── */}
      {signal && !isAnalyzing && (
        <div className={`rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-500 overflow-hidden ${
          isCall
            ? 'border-emerald-500/60 bg-gradient-to-br from-[#061a0e]/80 via-[#070d1a]/95 to-[#070d1a]/95 shadow-emerald-500/10'
            : 'border-red-500/60 bg-gradient-to-br from-[#1a0609]/80 via-[#070d1a]/95 to-[#070d1a]/95 shadow-red-500/10'
        } ${pulse ? 'scale-[1.01]' : 'scale-100'}`}>

          {/* Top accent bar */}
          <div className={`h-[3px] w-full ${
            isCall ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-red-600 via-red-400 to-orange-400'
          }`} style={{ backgroundSize: '200% 100%', animation: 'bgShift 2s linear infinite' }} />

          {/* Header */}
          <div className={`px-4 py-3 border-b ${isCall ? 'border-emerald-500/20' : 'border-red-500/20'} flex items-center justify-between flex-wrap gap-2`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isCall ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{ boxShadow: isCall ? '0 0 6px #10b981' : '0 0 6px #ef4444' }} />
              <span className="text-white font-black text-sm">{signal.pair.symbol}</span>
              {signal.pair.flag && <span>{signal.pair.flag}</span>}
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${isCall ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}>
                {signal.pair.type}
              </span>
            </div>
            <div className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${conf.text} ${conf.bg} ${conf.border}`}>
              {signal.analysis.confidence.replace('_', ' ')} CONFIDENCE
            </div>
          </div>

          {/* Main direction block */}
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <div className={`flex items-center gap-3 ${isCall ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCall ? <TrendingUp className="w-9 h-9" /> : <TrendingDown className="w-9 h-9" />}
                <span className="text-5xl font-black tracking-widest" style={{
                  textShadow: isCall ? '0 0 28px rgba(16,185,129,0.9)' : '0 0 28px rgba(239,68,68,0.9)'
                }}>{signal.direction}</span>
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="h-1.5 rounded-full w-32 bg-gray-800/50 overflow-hidden">
                  <div className={`h-full rounded-full ${isCall ? 'bg-gradient-to-r from-emerald-600 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-orange-400'}`}
                    style={{ width: `${signal.strength}%`, transition: 'width 0.6s ease' }} />
                </div>
                <span className="text-xs text-gray-400">Strength <span className="text-white font-bold">{signal.strength}%</span></span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                R:R = <span className="text-cyan-400 font-mono font-bold">1:{signal.riskReward}</span>
              </div>
            </div>
            <AccuracyMeter accuracy={signal.accuracy} size="lg" label="Accuracy" />
          </div>

          {/* Entry / SL / TP grid */}
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            {[
              { icon: <Clock className="w-3 h-3" />, label: 'ENTRY TIME', value: fmt(signal.entryTime), color: 'text-cyan-400' },
              { icon: <AlertTriangle className="w-3 h-3" />, label: 'STOP LOSS', value: fmtPrice(signal.stopLoss, signal.pair.pip), color: 'text-red-400' },
              { icon: <Target className="w-3 h-3" />, label: 'TAKE PROFIT', value: fmtPrice(signal.takeProfit, signal.pair.pip), color: 'text-emerald-400' },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-[#0a1020]/60 border border-white/5 p-2.5">
                <div className="flex items-center gap-1 text-gray-600 text-[9px] mb-1">{item.icon}{item.label}</div>
                <div className={`${item.color} font-mono font-bold text-xs`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Entry price + expiry */}
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#0a1020]/60 border border-white/5 p-2.5">
              <div className="text-gray-600 text-[9px] mb-1">ENTRY PRICE</div>
              <div className="text-white font-mono font-bold text-sm">{fmtPrice(signal.entryPrice, signal.pair.pip)}</div>
            </div>
            <div className="rounded-xl bg-[#0a1020]/60 border border-white/5 p-2.5">
              <div className="text-gray-600 text-[9px] mb-1">EXPIRY TIME</div>
              <div className="text-orange-400 font-mono font-bold text-xs">{fmt(signal.expiryTime)}</div>
            </div>
          </div>

          {/* SL/TP pips info */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <Shield className="w-3 h-3 text-gray-600" />
              <span>SL: <span className="text-red-400 font-mono">{signal.analysis.slPips > 0 ? signal.analysis.slPips.toFixed(1) : '—'} pips</span></span>
              <span className="text-gray-700">|</span>
              <span>TP: <span className="text-emerald-400 font-mono">{signal.analysis.tpPips > 0 ? signal.analysis.tpPips.toFixed(1) : '—'} pips</span></span>
              <span className="text-gray-700">|</span>
              <span>Session: <span className="text-cyan-400 font-semibold">{signal.session.replace('_', '+')}</span></span>
            </div>
          </div>

          {/* Mini indicator grid */}
          <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'RSI', value: signal.indicators.rsi.toFixed(0), ok: isCall ? signal.indicators.rsi < 50 : signal.indicators.rsi > 50 },
              { label: 'MACD', value: signal.indicators.macdHist > 0 ? '▲' : '▼', ok: isCall ? signal.indicators.macdHist > 0 : signal.indicators.macdHist < 0 },
              { label: 'STOCH', value: signal.indicators.stoch_k.toFixed(0), ok: isCall ? signal.indicators.stoch_k < 50 : signal.indicators.stoch_k > 50 },
              { label: 'ADX', value: signal.indicators.adx.toFixed(0), ok: signal.indicators.adx > 25 },
              { label: 'CCI', value: signal.indicators.cci.toFixed(0), ok: isCall ? signal.indicators.cci < 0 : signal.indicators.cci > 0 },
              { label: 'WR%', value: signal.indicators.williams_r.toFixed(0), ok: isCall ? signal.indicators.williams_r < -50 : signal.indicators.williams_r > -50 },
              { label: 'MOM', value: signal.indicators.momentum > 0 ? '▲' : '▼', ok: isCall ? signal.indicators.momentum > 0 : signal.indicators.momentum < 0 },
              { label: 'EMA', value: signal.indicators.trendStrength.replace('STRONG_', 'S.').slice(0, 6), ok: isCall ? ['UP','STRONG_UP'].includes(signal.indicators.trendStrength) : ['DOWN','STRONG_DOWN'].includes(signal.indicators.trendStrength) },
            ].map(ind => (
              <div key={ind.label} className="rounded-lg bg-[#0a1020]/60 border border-white/5 p-1.5 text-center">
                <div className="text-gray-700 text-[8px] uppercase tracking-wider">{ind.label}</div>
                <div className={`font-bold text-[11px] mt-0.5 ${ind.ok ? 'text-emerald-400' : 'text-red-400'}`}>{ind.value}</div>
              </div>
            ))}
          </div>

          {/* Confluence */}
          <div className="px-4 pb-4">
            <div className={`rounded-xl border p-3 ${isCall ? 'border-emerald-500/15 bg-emerald-900/8' : 'border-red-500/15 bg-red-900/8'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Signal Confluence</span>
                <span className={`text-xs font-black ${isCall ? 'text-emerald-400' : 'text-red-400'}`}>{signal.analysis.confluenceScore}%</span>
              </div>
              <div className="space-y-0.5 max-h-20 overflow-y-auto">
                {(isCall ? signal.analysis.bullSignals : signal.analysis.bearSignals).slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <CheckCircle className={`w-2.5 h-2.5 flex-shrink-0 mt-0.5 ${isCall ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-gray-300 leading-tight">{s}</span>
                  </div>
                ))}
                {signal.analysis.neutralSignals.slice(0, 1).map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <ChevronRight className="w-2.5 h-2.5 flex-shrink-0 text-gray-600" />
                    <span className="text-gray-600">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bgShift {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
});

SignalCard.displayName = 'SignalCard';
export default SignalCard;
