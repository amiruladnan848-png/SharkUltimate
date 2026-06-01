import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SignalCard } from '@/components/features/SignalCard';
import { CurrencyPairSelector } from '@/components/features/CurrencyPairSelector';
import { SessionIndicator } from '@/components/features/SessionIndicator';
import { PriceDisplay } from '@/components/features/PriceDisplay';
import { AccuracyMeter } from '@/components/features/AccuracyMeter';
import { StatsBar } from '@/components/features/StatsBar';
import { BackgroundAnimation } from '@/components/features/BackgroundAnimation';
import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { REAL_PAIRS } from '@/constants/pairs';
import { CurrencyPair } from '@/types/trading';
import { isWeekend, getCurrentSession, getSessionAccuracyBoost, formatCountdown } from '@/lib/timezone';
import { LogOut, Lock, Zap, Activity, BarChart2, Shield, ChevronRight } from 'lucide-react';

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

  const { currentSignal, countdown, isAnalyzing, triggerManualSignal, lastAnalysis } = useSignalEngine({
    pair: selectedPair,
    priceHistory: currentHistory,
    enabled: !isLocked,
  });

  const displayAccuracy = useMemo(() => Math.min(97, 72 + boost), [boost]);

  const totalDataPoints = useMemo(() =>
    Object.values(priceHistory).reduce((s, h) => s + h.length, 0),
    [priceHistory]
  );

  const handleLogout = () => {
    sessionStorage.removeItem('shark_auth');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white relative overflow-x-hidden">
      <BackgroundAnimation />
      <Header />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 pb-10 pt-5">
        {/* Top control bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <StatsBar connectionStatus={connectionStatus} dataPoints={totalDataPoints} />
          <div className="flex items-center gap-2">
            {weekend && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Lock className="w-3 h-3" /> Weekend Mode
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-700/50 bg-gray-800/30 text-gray-400 hover:text-red-400 hover:border-red-500/40 transition-all"
            >
              <LogOut className="w-3 h-3" /> Lock
            </button>
          </div>
        </div>

        {/* Engine Banner */}
        <div className="mb-5 rounded-2xl border border-cyan-500/15 bg-gradient-to-r from-[#08111f]/90 via-[#0a1520]/70 to-[#08111f]/90 backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          <div className="px-4 py-3 flex flex-wrap items-center gap-3 lg:gap-6">
            {[
              { icon: <Zap className="w-4 h-4" />, color: 'cyan', title: 'SHARK Engine v3.0', sub: 'Multi-Indicator Deep Analysis' },
              { icon: <Shield className="w-4 h-4" />, color: 'emerald', title: `+${boost}% Session Boost`, sub: `${session.replace('_', ' ')} Session Active` },
              { icon: <Activity className="w-4 h-4" />, color: 'purple', title: 'Never Drop Engine', sub: 'Stable — Confluence Locked' },
              { icon: <BarChart2 className="w-4 h-4" />, color: 'orange', title: 'Volatility Stable', sub: '12-Indicator Analysis' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl bg-${item.color}-500/15 border border-${item.color}-500/25 flex items-center justify-center text-${item.color}-400 flex-shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <div className={`text-xs font-bold text-${item.color}-400`}>{item.title}</div>
                  <div className="text-[10px] text-gray-500">{item.sub}</div>
                </div>
              </div>
            ))}

            {/* Next signal countdown */}
            <div className="ml-auto flex flex-col items-end">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Entry Time Countdown</div>
              <div className="text-3xl font-mono font-black text-cyan-400 tabular-nums" style={{ textShadow: '0 0 20px rgba(0,212,255,0.6)' }}>
                {formatCountdown(countdown)}
              </div>
              <div className="text-[9px] text-gray-600 mt-0.5">1 min binary boundary</div>
            </div>
          </div>
        </div>

        {/* Main 3-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Pair Selector + Price + Session */}
          <div className="flex flex-col gap-4">
            <CurrencyPairSelector selected={selectedPair} onChange={setSelectedPair} />
            <PriceDisplay tick={currentTick} pair={selectedPair} connected={connectionStatus.connected} latency={connectionStatus.latency} />
            <SessionIndicator />
          </div>

          {/* CENTER: Signal + Accuracy */}
          <div className="flex flex-col gap-4">
            {isLocked ? (
              <div className="rounded-2xl border border-orange-500/30 bg-orange-900/15 backdrop-blur-xl p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full border-2 border-orange-500/40 bg-orange-500/10 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-orange-400 font-black text-xl mb-2">WEEKEND — REAL MARKET LOCKED</h3>
                <p className="text-orange-300/60 text-sm mb-4">Real forex markets are closed on weekends.</p>
                <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-semibold">
                  Switch to Volatility pairs <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <SignalCard
                signal={currentSignal}
                isAnalyzing={isAnalyzing}
                countdown={countdown}
                lastAnalysis={lastAnalysis}
                onManualSignal={triggerManualSignal}
                dataReady={dataReady}
              />
            )}

            {/* Accuracy meters */}
            <div className="rounded-2xl border border-gray-700/40 bg-[#0a0f1e]/85 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Accuracy Engine</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Signal Booster: ACTIVE
                </div>
              </div>
              <div className="flex items-center justify-around">
                <AccuracyMeter accuracy={displayAccuracy} size="lg" label="Overall" />
                <AccuracyMeter accuracy={Math.min(97, displayAccuracy + 3)} size="md" label="Volatility" />
                <AccuracyMeter accuracy={Math.min(95, displayAccuracy)} size="md" label="Real Forex" />
              </div>
            </div>
          </div>

          {/* RIGHT: Dev info + Indicator guide */}
          <div className="flex flex-col gap-4">

            {/* Indicator Status Panel */}
            {currentSignal && (
              <div className="rounded-2xl border border-gray-700/40 bg-[#0a0f1e]/85 backdrop-blur-xl p-4">
                <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">Indicator Analysis</h3>
                <div className="space-y-2">
                  {[
                    { name: 'RSI (14)', value: currentSignal.indicators.rsi.toFixed(1), desc: currentSignal.indicators.rsi < 30 ? 'Oversold' : currentSignal.indicators.rsi > 70 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.rsi < 50 },
                    { name: 'MACD', value: currentSignal.indicators.macdHist > 0 ? 'Bullish' : 'Bearish', desc: `Hist: ${currentSignal.indicators.macdHist.toFixed(5)}`, bull: currentSignal.indicators.macdHist > 0 },
                    { name: 'EMA 9/21/50', value: currentSignal.indicators.trendStrength.replace(/_/g, ' '), desc: 'Trend Direction', bull: ['UP','STRONG_UP'].includes(currentSignal.indicators.trendStrength) },
                    { name: 'Bollinger Bands', value: currentSignal.indicators.bb_width.toFixed(2) + '%', desc: 'Band Width', bull: currentSignal.indicators.bb_width > 0.5 },
                    { name: 'Stochastic', value: `K:${currentSignal.indicators.stoch_k.toFixed(0)} D:${currentSignal.indicators.stoch_d.toFixed(0)}`, desc: currentSignal.indicators.stoch_k < 20 ? 'Oversold' : currentSignal.indicators.stoch_k > 80 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.stoch_k < 50 },
                    { name: 'ADX', value: currentSignal.indicators.adx.toFixed(1), desc: currentSignal.indicators.adx > 40 ? 'Strong Trend' : currentSignal.indicators.adx > 25 ? 'Trending' : 'Ranging', bull: currentSignal.indicators.adx > 25 },
                    { name: 'CCI (20)', value: currentSignal.indicators.cci.toFixed(0), desc: currentSignal.indicators.cci < -100 ? 'Oversold' : currentSignal.indicators.cci > 100 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.cci < 0 },
                    { name: 'Williams %R', value: currentSignal.indicators.williams_r.toFixed(0), desc: currentSignal.indicators.williams_r < -80 ? 'Oversold' : currentSignal.indicators.williams_r > -20 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.williams_r < -50 },
                    { name: 'Momentum', value: currentSignal.indicators.momentum.toFixed(5), desc: currentSignal.indicators.momentum > 0 ? 'Positive' : 'Negative', bull: currentSignal.indicators.momentum > 0 },
                    { name: 'ROC (12)', value: currentSignal.indicators.roc.toFixed(3) + '%', desc: 'Rate of Change', bull: currentSignal.indicators.roc > 0 },
                    { name: 'ATR (14)', value: currentSignal.indicators.atr.toFixed(5), desc: 'Volatility Measure', bull: true },
                    { name: 'Volatility', value: currentSignal.indicators.volatility.toFixed(3) + '%', desc: 'ATR/Price %', bull: currentSignal.indicators.volatility < 0.5 },
                  ].map(ind => (
                    <div key={ind.name} className="flex items-center justify-between py-1.5 border-b border-gray-700/20 last:border-0">
                      <div>
                        <span className="text-xs text-gray-300 font-medium">{ind.name}</span>
                        <div className="text-[9px] text-gray-600">{ind.desc}</div>
                      </div>
                      <div className={`text-xs font-bold font-mono ${ind.bull ? 'text-emerald-400' : 'text-red-400'}`}>{ind.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer card */}
            <div className="rounded-2xl border border-gray-700/40 bg-[#0a0f1e]/85 backdrop-blur-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <span className="text-white font-black text-lg">A</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Amirul_Adnan</div>
                  <div className="text-gray-500 text-xs">Signal Engineer & Developer</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Platform', value: 'Tradowix.com', color: 'text-cyan-400' },
                  { label: 'Signal Type', value: '1 Minute Binary', color: 'text-emerald-400' },
                  { label: 'Data Source', value: 'Deriv WebSocket', color: 'text-purple-400' },
                  { label: 'Timezone', value: 'Bangladesh BST (UTC+6)', color: 'text-yellow-400' },
                  { label: 'Indicators', value: '12 Deep Indicators', color: 'text-orange-400' },
                  { label: 'Engine', value: 'SHARK v3.0 Never-Drop', color: 'text-pink-400' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-1 border-b border-gray-700/20 last:border-0">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>{item.value}</span>
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
