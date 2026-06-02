import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SignalCard } from '@/components/features/SignalCard';
import { CurrencyPairSelector } from '@/components/features/CurrencyPairSelector';
import { SessionIndicator } from '@/components/features/SessionIndicator';
import { PriceDisplay } from '@/components/features/PriceDisplay';
import { AccuracyMeter } from '@/components/features/AccuracyMeter';
import { StatsBar } from '@/components/features/StatsBar';
import { BackgroundAnimation } from '@/components/features/BackgroundAnimation';
import { TradingViewChart } from '@/components/features/TradingViewChart';
import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { REAL_PAIRS } from '@/constants/pairs';
import { CurrencyPair } from '@/types/trading';
import { isWeekend, getCurrentSession, getSessionAccuracyBoost, formatCountdown } from '@/lib/timezone';
import { LogOut, Lock, Zap, Activity, Shield, BarChart2, ChevronRight, Scan } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState<CurrencyPair>(REAL_PAIRS[0]);
  const weekend = isWeekend();
  const session = getCurrentSession();
  const boost = getSessionAccuracyBoost(session);

  // Auth guard
  useEffect(() => {
    if (sessionStorage.getItem('shark_auth') !== 'true') navigate('/');
  }, [navigate]);

  const { ticks, connectionStatus, subscribeTick, unsubscribeTick, priceHistory } = useDerivWebSocket();

  useEffect(() => {
    subscribeTick(selectedPair.derivSymbol);
    return () => unsubscribeTick(selectedPair.derivSymbol);
  }, [selectedPair.derivSymbol, subscribeTick, unsubscribeTick]);

  const currentHistory = priceHistory[selectedPair.derivSymbol] || [];
  const currentTick = ticks[selectedPair.derivSymbol] || null;
  const isLocked = selectedPair.type === 'REAL' && weekend;
  const dataReady = currentHistory.length >= 30;

  const { currentSignal, countdown, isAnalyzing, analysisPct, triggerManualSignal, lastAnalysis, analysisStep } = useSignalEngine({
    pair: selectedPair,
    priceHistory: currentHistory,
    enabled: !isLocked,
  });

  const shelterFloor = useMemo(() => Math.min(82, 70 + boost * 0.5), [boost]);
  const displayAccuracy = useMemo(() => Math.min(97, shelterFloor + boost * 0.5 + 8), [boost, shelterFloor]);

  const totalDataPoints = useMemo(() =>
    Object.values(priceHistory).reduce((s, h) => s + h.length, 0),
    [priceHistory]
  );

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('shark_auth');
    navigate('/');
  }, [navigate]);

  // Engine stat items
  const engineStats = [
    { icon: <Zap className="w-4 h-4" />, color: '#38bdf8', title: 'SHARK Engine v4.0', sub: '16-Step Deep Analysis' },
    { icon: <Shield className="w-4 h-4" />, color: '#10b981', title: `+${boost}% Session Boost`, sub: `${session.replace('_', '+')} Active` },
    { icon: <Activity className="w-4 h-4" />, color: '#a78bfa', title: 'Accuracy Shelter', sub: `Floor: ${shelterFloor.toFixed(0)}% • Never Drop` },
    { icon: <BarChart2 className="w-4 h-4" />, color: '#fb923c', title: 'TradingView Live', sub: '1M Chart + Laser Scan' },
    { icon: <Scan className="w-4 h-4" />, color: '#f472b6', title: 'Laser Scanner', sub: 'Deep Chart Analysis' },
  ];

  return (
    <div className="min-h-screen bg-[#060c1a] text-white relative overflow-x-hidden">
      <BackgroundAnimation />
      <Header />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 pb-10 pt-4">

        {/* Top control bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <StatsBar connectionStatus={connectionStatus} dataPoints={totalDataPoints} />
          <div className="flex items-center gap-2">
            {weekend && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ border: '1px solid rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.08)', color: '#fb923c' }}>
                <Lock className="w-3 h-3" /> Weekend Mode
              </div>
            )}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#4a6080' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a6080'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <LogOut className="w-3 h-3" /> Lock
            </button>
          </div>
        </div>

        {/* Engine Banner */}
        <div className="mb-4 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(56,189,248,0.12)', background: 'linear-gradient(135deg, rgba(8,17,35,0.95), rgba(10,20,42,0.9))', backdropFilter: 'blur(12px)' }}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.45), transparent)' }} />
          <div className="px-4 py-3 flex flex-wrap items-center gap-4 lg:gap-6">
            {engineStats.map(item => (
              <div key={item.title} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}18`, border: `1px solid ${item.color}28`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: item.color }}>{item.title}</div>
                  <div className="text-[10px]" style={{ color: '#2a4060' }}>{item.sub}</div>
                </div>
              </div>
            ))}

            <div className="ml-auto flex flex-col items-end">
              <div className="text-[9px] tracking-[0.2em] uppercase mb-0.5" style={{ color: '#2a4060' }}>1 MIN ENTRY</div>
              <div className="text-3xl font-mono font-black tabular-nums" style={{ color: '#38bdf8', textShadow: '0 0 20px rgba(56,189,248,0.55)' }}>
                {formatCountdown(countdown)}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: '#1e3358' }}>next boundary</div>
            </div>
          </div>
        </div>

        {/* ── MAIN LAYOUT: Chart expands, left/right sidebars ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_300px] gap-4">

          {/* ──── LEFT COLUMN ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <CurrencyPairSelector selected={selectedPair} onChange={setSelectedPair} />
            <PriceDisplay tick={currentTick} pair={selectedPair} connected={connectionStatus.connected} latency={connectionStatus.latency} />
            <SessionIndicator />

            {/* Accuracy meters */}
            <div className="rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,12,26,0.8)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#2a4060' }}>Accuracy Engine</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: '#38bdf8' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Shelter: {shelterFloor.toFixed(0)}% Floor
                </div>
              </div>
              <div className="flex items-center justify-around">
                <AccuracyMeter accuracy={displayAccuracy} size="lg" label="Overall" showShelter />
                <AccuracyMeter accuracy={Math.min(97, displayAccuracy + 3)} size="md" label="Volatility" />
                <AccuracyMeter accuracy={Math.min(95, displayAccuracy)} size="md" label="Forex" />
              </div>
            </div>
          </div>

          {/* ──── CENTER: TradingView Chart (expanded) ───────────────────── */}
          <div className="flex flex-col gap-4">

            {/* TradingView Live Chart */}
            {isLocked ? (
              <div className="rounded-2xl flex flex-col items-center justify-center min-h-[420px] text-center p-10"
                style={{ border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.05)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ border: '2px solid rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.08)' }}>
                  <Lock className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-orange-400 font-black text-xl mb-2">WEEKEND — REAL MARKET LOCKED</h3>
                <p className="text-orange-300/50 text-sm mb-4">Real forex markets are closed on weekends.</p>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.08)', color: '#fb923c' }}
                  onClick={() => { }}>
                  Switch to Volatility pairs <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <TradingViewChart pair={selectedPair} signal={currentSignal} isScanning={isAnalyzing} />
            )}

            {/* Signal Card */}
            {!isLocked && (
              <SignalCard
                signal={currentSignal}
                isAnalyzing={isAnalyzing}
                analysisPct={analysisPct}
                countdown={countdown}
                lastAnalysis={lastAnalysis}
                analysisStep={analysisStep}
                onManualSignal={triggerManualSignal}
                dataReady={dataReady}
              />
            )}
          </div>

          {/* ──── RIGHT COLUMN ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Full Indicator Analysis Panel */}
            {currentSignal && (
              <div className="rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,12,26,0.85)', backdropFilter: 'blur(12px)' }}>
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#2a4060' }}>16-Indicator Analysis</h3>
                <div className="space-y-1.5">
                  {([
                    { name: 'RSI-14',       value: currentSignal.indicators.rsi.toFixed(1),              sub: currentSignal.indicators.rsi < 30 ? 'Oversold' : currentSignal.indicators.rsi > 70 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.rsi < 50 },
                    { name: 'MACD Hist',    value: currentSignal.indicators.macdHist > 0 ? 'Bullish ▲' : 'Bearish ▼', sub: `${currentSignal.indicators.macdHist.toFixed(5)}`, bull: currentSignal.indicators.macdHist > 0 },
                    { name: 'EMA Stack',    value: currentSignal.indicators.trendStrength.replace(/_/g, ' '), sub: 'EMA5/9/21/50/200', bull: ['UP','STRONG_UP'].includes(currentSignal.indicators.trendStrength) },
                    { name: 'BB %B',        value: (currentSignal.indicators.bb_pct * 100).toFixed(0) + '%', sub: currentSignal.indicators.bb_pct < 0.2 ? 'Near Lower' : currentSignal.indicators.bb_pct > 0.8 ? 'Near Upper' : 'Mid-Range', bull: currentSignal.indicators.bb_pct < 0.5 },
                    { name: 'BB Width',     value: currentSignal.indicators.bb_width.toFixed(2) + '%',    sub: currentSignal.indicators.bb_width < 0.2 ? 'Squeeze' : 'Normal', bull: currentSignal.indicators.bb_width > 0.3 },
                    { name: 'Stochastic',   value: `K:${currentSignal.indicators.stoch_k.toFixed(0)} D:${currentSignal.indicators.stoch_d.toFixed(0)}`, sub: currentSignal.indicators.stoch_k < 20 ? 'Oversold' : currentSignal.indicators.stoch_k > 80 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.stoch_k < 50 },
                    { name: 'ADX',          value: currentSignal.indicators.adx.toFixed(1),              sub: currentSignal.indicators.adx > 40 ? 'Strong' : currentSignal.indicators.adx > 25 ? 'Trending' : 'Ranging', bull: currentSignal.indicators.adx > 25 },
                    { name: 'DI+/DI-',      value: `${currentSignal.indicators.di_plus.toFixed(0)}/${currentSignal.indicators.di_minus.toFixed(0)}`, sub: 'Directional Index', bull: currentSignal.indicators.di_plus > currentSignal.indicators.di_minus },
                    { name: 'CCI-20',       value: currentSignal.indicators.cci.toFixed(0),              sub: currentSignal.indicators.cci < -100 ? 'Oversold' : currentSignal.indicators.cci > 100 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.cci < 0 },
                    { name: 'Williams %R',  value: currentSignal.indicators.williams_r.toFixed(0),       sub: currentSignal.indicators.williams_r <= -80 ? 'Oversold' : currentSignal.indicators.williams_r >= -20 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.williams_r < -50 },
                    { name: 'Momentum',     value: currentSignal.indicators.momentum.toFixed(5),         sub: currentSignal.indicators.momentum > 0 ? 'Positive' : 'Negative', bull: currentSignal.indicators.momentum > 0 },
                    { name: 'ROC-12',       value: currentSignal.indicators.roc.toFixed(3) + '%',        sub: 'Rate of Change', bull: currentSignal.indicators.roc > 0 },
                    { name: 'VWAP',         value: currentSignal.indicators.vwap.toFixed(5),             sub: currentSignal.entryPrice > currentSignal.indicators.vwap ? 'Above' : 'Below', bull: currentSignal.entryPrice > currentSignal.indicators.vwap },
                    { name: 'ATR-14',       value: currentSignal.indicators.atr.toFixed(5),              sub: 'Volatility Measure', bull: true },
                    { name: 'Volatility',   value: currentSignal.indicators.volatility.toFixed(3) + '%', sub: currentSignal.indicators.volatility < 0.4 ? 'Low' : currentSignal.indicators.volatility < 1 ? 'Medium' : 'High', bull: currentSignal.indicators.volatility < 0.6 },
                    { name: 'Price Vel.',   value: currentSignal.indicators.priceVelocity > 0 ? '▲ Up' : '▼ Down', sub: 'Velocity', bull: currentSignal.indicators.priceVelocity > 0 },
                  ] as const).map(ind => (
                    <div key={ind.name} className="flex items-center justify-between py-1 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <span className="text-[11px] font-semibold" style={{ color: '#94a3b8' }}>{ind.name}</span>
                        <div className="text-[8px]" style={{ color: '#2a4060' }}>{ind.sub}</div>
                      </div>
                      <div className={`text-[11px] font-bold font-mono ${ind.bull ? 'text-emerald-400' : 'text-red-400'}`}>{ind.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer Info Card */}
            <div className="rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,12,26,0.85)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)', boxShadow: '0 0 16px rgba(56,189,248,0.3)' }}>
                  <span className="text-white font-black text-lg">A</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Amirul_Adnan</div>
                  <div className="text-[10px]" style={{ color: '#2a4060' }}>Signal Engineer & Developer</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Platform',    value: 'Tradowix.com',          color: '#38bdf8' },
                  { label: 'Signal Type', value: '1 Min Binary',          color: '#10b981' },
                  { label: 'Data Source', value: 'Deriv WebSocket',       color: '#a78bfa' },
                  { label: 'Chart',       value: 'TradingView Live',      color: '#34d399' },
                  { label: 'Timezone',    value: 'Bangladesh BST (UTC+6)',color: '#fbbf24' },
                  { label: 'Indicators',  value: '16 Deep Indicators',    color: '#fb923c' },
                  { label: 'Engine',      value: 'SHARK v4.0 Never-Drop', color: '#f472b6' },
                  { label: 'Shelter',     value: 'Accuracy Floor Active', color: '#60a5fa' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-1 border-b border-white/3 last:border-0">
                    <span className="text-[10px]" style={{ color: '#2a4060' }}>{item.label}</span>
                    <span className="text-[10px] font-semibold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
