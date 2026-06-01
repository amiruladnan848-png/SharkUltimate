import React, { useEffect, useState, memo } from 'react';
import { Signal } from '@/types/trading';
import { AccuracyMeter } from './AccuracyMeter';
import { TrendingUp, TrendingDown, Clock, Zap, Activity, Target, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

interface SignalCardProps {
  signal: Signal | null;
  isAnalyzing: boolean;
  countdown: number;
  lastAnalysis: string;
  onManualSignal: () => void;
  dataReady: boolean;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

const formatCountdown = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const CONFIDENCE_COLORS = {
  VERY_HIGH: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  HIGH: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
  MEDIUM: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/40',
  LOW: 'text-gray-400 bg-gray-500/15 border-gray-500/40',
};

export const SignalCard: React.FC<SignalCardProps> = memo(({ signal, isAnalyzing, countdown, lastAnalysis, onManualSignal, dataReady }) => {
  const [pulse, setPulse] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    if (signal) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(t);
    }
  }, [signal?.id]);

  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisStep(0);
      const id = setInterval(() => setAnalysisStep(s => s + 1), 220);
      return () => clearInterval(id);
    }
  }, [isAnalyzing]);

  const isCall = signal?.direction === 'CALL';

  return (
    <div className="flex flex-col gap-4">
      {/* Manual Signal Button */}
      <button
        onClick={onManualSignal}
        disabled={isAnalyzing || !dataReady}
        className={`relative w-full py-4 rounded-2xl font-black text-lg tracking-widest transition-all duration-200 overflow-hidden group ${
          isAnalyzing || !dataReady
            ? 'opacity-60 cursor-not-allowed border border-gray-700/50 bg-gray-800/30 text-gray-500'
            : 'border border-cyan-500/50 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-cyan-600/20 text-cyan-400 hover:from-cyan-500/30 hover:via-blue-500/30 hover:to-cyan-500/30 hover:border-cyan-400/70 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98]'
        }`}
      >
        {/* Animated shine */}
        {!isAnalyzing && dataReady && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        )}
        <div className="flex items-center justify-center gap-3">
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 animate-spin" />
              <span className="text-sm">ANALYZING MARKET...</span>
            </>
          ) : !dataReady ? (
            <>
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="text-sm">LOADING LIVE DATA...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 animate-pulse" />
              <span>⚡ GENERATE SIGNAL</span>
            </>
          )}
        </div>
        {!isAnalyzing && dataReady && (
          <div className="text-[10px] font-normal text-cyan-500/70 mt-0.5">
            Click to run deep market analysis
          </div>
        )}
      </button>

      {/* Analysis progress */}
      {isAnalyzing && lastAnalysis && (
        <div className="rounded-xl border border-cyan-500/20 bg-[#0a0f1e]/80 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`w-1.5 h-4 rounded-sm transition-all duration-200 ${
                i <= (analysisStep % 5) ? 'bg-cyan-400' : 'bg-gray-700'
              }`} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <span className="text-cyan-400/80 text-xs font-mono animate-pulse">{lastAnalysis}</span>
        </div>
      )}

      {/* No data yet */}
      {!signal && !isAnalyzing && (
        <div className="rounded-2xl border border-gray-700/40 bg-[#0a0f1e]/70 backdrop-blur-xl p-6 flex flex-col items-center justify-center min-h-[260px] text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border border-gray-700/50 flex items-center justify-center">
              <Activity className="w-8 h-8 text-gray-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 font-bold text-base mb-1">Signal Engine Ready</p>
          <p className="text-gray-600 text-xs mb-4 max-w-[200px] leading-relaxed">
            {lastAnalysis || 'Click Generate Signal to run deep multi-indicator analysis'}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span>Entry at next minute boundary</span>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-cyan-500/70">{formatCountdown(countdown)}</div>
        </div>
      )}

      {/* Signal Result */}
      {signal && (
        <div className={`rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-500 overflow-hidden ${
          isCall
            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-900/25 via-[#0a0f1e]/90 to-[#0a0f1e]/90 shadow-emerald-500/15'
            : 'border-red-500/50 bg-gradient-to-br from-red-900/25 via-[#0a0f1e]/90 to-[#0a0f1e]/90 shadow-red-500/15'
        } ${pulse ? 'scale-[1.015]' : 'scale-100'}`}>

          {/* Top accent bar */}
          <div className={`h-1 w-full ${isCall ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500' : 'bg-gradient-to-r from-red-500 via-orange-400 to-red-500'}`}
            style={{ animation: 'shimmer 2s linear infinite', backgroundSize: '200% 100%' }}
          />

          {/* Header */}
          <div className={`px-5 py-3.5 border-b ${isCall ? 'border-emerald-500/25' : 'border-red-500/25'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isCall ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse shadow-lg`}
                style={{ boxShadow: isCall ? '0 0 8px #10b981' : '0 0 8px #ef4444' }} />
              <span className="text-white font-bold">{signal.pair.symbol}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${isCall ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                {signal.pair.type}
              </span>
            </div>
            <div className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${CONFIDENCE_COLORS[signal.analysis.confidence]}`}>
              {signal.analysis.confidence.replace('_', ' ')} CONFIDENCE
            </div>
          </div>

          {/* Main direction */}
          <div className="px-5 py-5 flex items-center justify-between">
            <div>
              <div className={`flex items-center gap-3 ${isCall ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCall ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
                <span className="text-5xl font-black tracking-wider" style={{
                  textShadow: isCall ? '0 0 24px rgba(16,185,129,0.8), 0 0 48px rgba(16,185,129,0.3)' : '0 0 24px rgba(239,68,68,0.8), 0 0 48px rgba(239,68,68,0.3)'
                }}>
                  {signal.direction}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-1.5 rounded-full flex-1 max-w-[140px] bg-gray-700/50 overflow-hidden`}>
                  <div className={`h-full rounded-full transition-all duration-700 ${isCall ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                    style={{ width: `${signal.strength}%` }} />
                </div>
                <span className="text-xs text-gray-400">Strength: <span className="text-white font-bold">{signal.strength}%</span></span>
              </div>
            </div>
            <AccuracyMeter accuracy={signal.accuracy} size="lg" label="Accuracy" />
          </div>

          {/* Entry / Expiry */}
          <div className="px-5 pb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#0d1628]/70 border border-gray-700/30 p-3">
              <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mb-1"><Clock className="w-3 h-3" /> ENTRY TIME</div>
              <div className="text-cyan-400 font-mono font-bold text-sm">{formatTime(signal.entryTime)}</div>
            </div>
            <div className="rounded-xl bg-[#0d1628]/70 border border-gray-700/30 p-3">
              <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mb-1"><Target className="w-3 h-3" /> EXPIRY TIME</div>
              <div className="text-orange-400 font-mono font-bold text-sm">{formatTime(signal.expiryTime)}</div>
            </div>
          </div>

          {/* Indicators mini */}
          <div className="px-5 pb-4 grid grid-cols-4 gap-1.5">
            {[
              { label: 'RSI', value: signal.indicators.rsi.toFixed(0), ok: isCall ? signal.indicators.rsi < 50 : signal.indicators.rsi > 50 },
              { label: 'MACD', value: signal.indicators.macdHist > 0 ? '▲' : '▼', ok: isCall ? signal.indicators.macdHist > 0 : signal.indicators.macdHist < 0 },
              { label: 'STOCH', value: signal.indicators.stoch_k.toFixed(0), ok: isCall ? signal.indicators.stoch_k < 50 : signal.indicators.stoch_k > 50 },
              { label: 'ADX', value: signal.indicators.adx.toFixed(0), ok: signal.indicators.adx > 25 },
              { label: 'CCI', value: signal.indicators.cci.toFixed(0), ok: isCall ? signal.indicators.cci < 0 : signal.indicators.cci > 0 },
              { label: 'WR%', value: signal.indicators.williams_r.toFixed(0), ok: isCall ? signal.indicators.williams_r < -50 : signal.indicators.williams_r > -50 },
              { label: 'MOM', value: signal.indicators.momentum > 0 ? '▲' : '▼', ok: isCall ? signal.indicators.momentum > 0 : signal.indicators.momentum < 0 },
              { label: 'EMA', value: signal.indicators.trendStrength.replace('STRONG_', 'S.'), ok: isCall ? ['UP','STRONG_UP'].includes(signal.indicators.trendStrength) : ['DOWN','STRONG_DOWN'].includes(signal.indicators.trendStrength) },
            ].map(ind => (
              <div key={ind.label} className="rounded-lg bg-[#0d1628]/70 border border-gray-700/25 p-1.5 text-center">
                <div className="text-gray-600 text-[9px] uppercase">{ind.label}</div>
                <div className={`font-bold text-xs mt-0.5 ${ind.ok ? 'text-emerald-400' : 'text-red-400'}`}>{ind.value}</div>
              </div>
            ))}
          </div>

          {/* Signal confluence */}
          <div className="px-5 pb-5">
            <div className={`rounded-xl border p-3 ${isCall ? 'border-emerald-500/20 bg-emerald-900/10' : 'border-red-500/20 bg-red-900/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-semibold">Signal Confluence</span>
                <span className={`text-xs font-bold ${isCall ? 'text-emerald-400' : 'text-red-400'}`}>{signal.analysis.confluenceScore}%</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                {(isCall ? signal.analysis.bullSignals : signal.analysis.bearSignals).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <CheckCircle className={`w-3 h-3 flex-shrink-0 ${isCall ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-gray-300">{s}</span>
                  </div>
                ))}
                {signal.analysis.neutralSignals.slice(0, 2).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-600" />
                    <span className="text-gray-500">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
});

SignalCard.displayName = 'SignalCard';
export default SignalCard;
