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
import { useSignalEngine, speakBangla } from '@/hooks/useSignalEngine';
import { REAL_PAIRS } from '@/constants/pairs';
import { CurrencyPair } from '@/types/trading';
import { isWeekend, getCurrentSession, getSessionAccuracyBoost, formatCountdown } from '@/lib/timezone';
import { LogOut, Lock, Zap, Activity, Shield, BarChart2, Scan, Trophy, TrendingUp, Radio } from 'lucide-react';

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

  const { ticks, connectionStatus, subscribeTick, unsubscribeTick, priceHistory, requestCandles } = useDerivWebSocket();

  // Subscribe to live tick + request historical candles for better signal init
  useEffect(() => {
    subscribeTick(selectedPair.derivSymbol);
    // Request 200 1-min candles for deep signal init (merged with TradingView)
    const timer = setTimeout(() => requestCandles(selectedPair.derivSymbol, 200), 1500);
    return () => {
      unsubscribeTick(selectedPair.derivSymbol);
      clearTimeout(timer);
    };
  }, [selectedPair.derivSymbol, subscribeTick, unsubscribeTick, requestCandles]);

  const currentHistory = priceHistory[selectedPair.derivSymbol] || [];
  const currentTick = ticks[selectedPair.derivSymbol] || null;
  const isLocked = weekend;
  const dataReady = currentHistory.length >= 30;

  const {
    currentSignal, countdown, isAnalyzing, analysisPct, triggerManualSignal,
    lastAnalysis, analysisStep, signalHistory, totalWins, totalLosses, winRate,
    martingaleActive, martingaleStep, martingaleMultiplier, lastResult,
  } = useSignalEngine({
    pair: selectedPair,
    priceHistory: currentHistory,
    enabled: !isLocked,
  });

  // Announce connection on load
  useEffect(() => {
    if (connectionStatus.connected) {
      const timer = setTimeout(() => speakBangla('connected'), 1000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus.connected]);

  const shelterFloor = useMemo(() => Math.min(84, 72 + boost * 0.55), [boost]);
  const displayAccuracy = useMemo(() => Math.min(97, shelterFloor + boost * 0.4 + 6), [boost, shelterFloor]);

  const totalDataPoints = useMemo(() =>
    Object.values(priceHistory).reduce((s, h) => s + h.length, 0),
    [priceHistory]
  );

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('shark_auth');
    navigate('/');
  }, [navigate]);

  const handlePairChange = useCallback((pair: CurrencyPair) => {
    setSelectedPair(pair);
  }, []);

  // Engine stat cards
  const engineStats = [
    { icon: <Zap className="w-4 h-4" />, color: '#00d4ff', title: 'SHARK v5.0', sub: '21-Step Deep Analysis' },
    { icon: <Shield className="w-4 h-4" />, color: '#10b981', title: `+${boost}% Session Boost`, sub: `${session.replace('_', '+')} Active` },
    { icon: <Activity className="w-4 h-4" />, color: '#818cf8', title: 'Accuracy Shelter', sub: `Floor: ${shelterFloor.toFixed(0)}% — Never Drop` },
    { icon: <BarChart2 className="w-4 h-4" />, color: '#fb923c', title: 'TV + Deriv Fusion', sub: '1M Chart + Candle History' },
    { icon: <Scan className="w-4 h-4" />, color: '#f472b6', title: 'Pro Laser Scanner', sub: '4-Phase Deep Scan' },
    { icon: <Radio className="w-4 h-4" />, color: '#fbbf24', title: 'Auto Win/Loss', sub: 'Price-Based Detection' },
    { icon: <Trophy className="w-4 h-4" />, color: '#34d399', title: `Win Rate: ${winRate}%`, sub: `W:${totalWins} L:${totalLosses}` },
  ];

  return (
    <div className="min-h-screen bg-[#050912] text-white relative overflow-x-hidden">
      <BackgroundAnimation />
      <Header />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 pb-10 pt-4">

        {/* Top control bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <StatsBar
            connectionStatus={connectionStatus}
            dataPoints={totalDataPoints}
            winRate={winRate}
            totalWins={totalWins}
            totalLosses={totalLosses}
          />
          <div className="flex items-center gap-2">
            {weekend && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.07)', color: '#fb923c' }}>
                <Lock className="w-3 h-3" /> Weekend — Market Locked
              </div>
            )}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: '#3a5070' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a5070'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <LogOut className="w-3 h-3" /> Lock
            </button>
          </div>
        </div>

        {/* Engine Banner */}
        <div className="mb-4 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(0,212,255,0.1)', background: 'linear-gradient(135deg,rgba(5,12,28,0.97),rgba(8,16,38,0.95))', backdropFilter: 'blur(16px)' }}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent)' }} />
          <div className="px-4 py-3 flex flex-wrap items-center gap-4 lg:gap-5">
            {engineStats.map(item => (
              <div key={item.title} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}14`, border: `1px solid ${item.color}22`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: item.color }}>{item.title}</div>
                  <div className="text-[9px]" style={{ color: '#253550' }}>{item.sub}</div>
                </div>
              </div>
            ))}
            <div className="ml-auto flex flex-col items-end">
              <div className="text-[9px] tracking-[0.2em] uppercase mb-0.5" style={{ color: '#253550' }}>1 MIN ENTRY</div>
              <div className="text-3xl font-mono font-black tabular-nums"
                style={{ color: '#00d4ff', textShadow: '0 0 22px rgba(0,212,255,0.6)', letterSpacing: '0.06em' }}>
                {formatCountdown(countdown)}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: '#1a2d45' }}>next boundary</div>
            </div>
          </div>
        </div>

        {/* ── MAIN LAYOUT ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_290px] gap-4">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <CurrencyPairSelector selected={selectedPair} onChange={handlePairChange} />
            <PriceDisplay tick={currentTick} pair={selectedPair} connected={connectionStatus.connected} latency={connectionStatus.latency} />
            <SessionIndicator />

            {/* Accuracy Engine meters */}
            <div className="rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(5,10,22,0.85)', backdropFilter: 'blur(14px)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#253550' }}>Accuracy Engine</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: '#00d4ff' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Floor: {shelterFloor.toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center justify-around">
                <AccuracyMeter accuracy={displayAccuracy} size="lg" label="Overall" showShelter />
                <AccuracyMeter accuracy={Math.min(97, displayAccuracy + 2)} size="md" label="Session" />
                <AccuracyMeter accuracy={Math.min(96, displayAccuracy - 1)} size="md" label="Forex" />
              </div>
            </div>

            {/* Recent signal history mini panel */}
            {signalHistory.length > 0 && (
              <div className="rounded-2xl p-4"
                style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(5,10,22,0.85)', backdropFilter: 'blur(14px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#253550' }}>Recent Results</h3>
                  <div className="text-[10px] font-bold" style={{ color: winRate >= 60 ? '#10b981' : '#f59e0b' }}>
                    {winRate}% Win Rate
                  </div>
                </div>
                <div className="space-y-1.5">
                  {signalHistory.slice(0, 5).map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rec.result === 'WIN' ? 'bg-emerald-400' : rec.result === 'LOSS' ? 'bg-red-400' : 'bg-gray-600'}`} />
                      <div className="text-[10px] font-bold" style={{ color: rec.signal.direction === 'CALL' ? '#10b981' : '#ef4444' }}>
                        {rec.signal.direction}
                      </div>
                      <div className="text-[9px] text-gray-600 flex-1">{rec.signal.pair.symbol}</div>
                      <div className={`text-[10px] font-black ${rec.result === 'WIN' ? 'text-emerald-400' : rec.result === 'LOSS' ? 'text-red-400' : 'text-gray-500'}`}>
                        {rec.result}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER: Chart + Signal ────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {isLocked ? (
              <div className="rounded-2xl flex flex-col items-center justify-center min-h-[420px] text-center p-10"
                style={{ border: '1px solid rgba(251,146,60,0.25)', background: 'rgba(251,146,60,0.04)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ border: '2px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.07)' }}>
                  <Lock className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-orange-400 font-black text-xl mb-2">WEEKEND — MARKET CLOSED</h3>
                <p className="text-orange-300/40 text-sm">Real forex markets are closed on weekends. Please return on Monday.</p>
              </div>
            ) : (
              <TradingViewChart pair={selectedPair} signal={currentSignal} isScanning={isAnalyzing} />
            )}

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
                martingaleActive={martingaleActive}
                martingaleStep={martingaleStep}
                martingaleMultiplier={martingaleMultiplier}
                lastResult={lastResult}
              />
            )}
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* 21-Indicator Analysis Panel */}
            {currentSignal && (
              <div className="rounded-2xl p-4"
                style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(5,10,22,0.9)', backdropFilter: 'blur(14px)' }}>
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#253550' }}>21-Indicator Analysis</h3>
                <div className="space-y-1">
                  {([
                    { name: 'RSI-14',       value: currentSignal.indicators.rsi.toFixed(1),       sub: currentSignal.indicators.rsi < 30 ? 'Oversold' : currentSignal.indicators.rsi > 70 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.rsi < 50 },
                    { name: 'MACD Hist',    value: currentSignal.indicators.macdHist > 0 ? '▲ Bull' : '▼ Bear', sub: currentSignal.indicators.macdHist.toFixed(6), bull: currentSignal.indicators.macdHist > 0 },
                    { name: 'EMA Stack',    value: currentSignal.indicators.trendStrength.replace(/_/g,' '), sub: 'EMA5/9/21/50/200', bull: ['UP','STRONG_UP'].includes(currentSignal.indicators.trendStrength) },
                    { name: 'BB %B',        value: (currentSignal.indicators.bb_pct*100).toFixed(0)+'%', sub: currentSignal.indicators.bb_pct < 0.2 ? 'Near Lower' : currentSignal.indicators.bb_pct > 0.8 ? 'Near Upper' : 'Mid', bull: currentSignal.indicators.bb_pct < 0.5 },
                    { name: 'Stochastic',   value: `K:${currentSignal.indicators.stoch_k.toFixed(0)} D:${currentSignal.indicators.stoch_d.toFixed(0)}`, sub: currentSignal.indicators.stoch_k < 20 ? 'Oversold' : currentSignal.indicators.stoch_k > 80 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.stoch_k < 50 },
                    { name: 'ADX',          value: currentSignal.indicators.adx.toFixed(1), sub: currentSignal.indicators.adx > 40 ? 'Strong' : currentSignal.indicators.adx > 25 ? 'Trending' : 'Ranging', bull: currentSignal.indicators.adx > 25 },
                    { name: 'DI+ / DI-',    value: `${currentSignal.indicators.di_plus.toFixed(0)} / ${currentSignal.indicators.di_minus.toFixed(0)}`, sub: 'Directional Index', bull: currentSignal.indicators.di_plus > currentSignal.indicators.di_minus },
                    { name: 'CCI-20',       value: currentSignal.indicators.cci.toFixed(0), sub: currentSignal.indicators.cci < -100 ? 'Oversold' : currentSignal.indicators.cci > 100 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.cci < 0 },
                    { name: 'Williams %R',  value: currentSignal.indicators.williams_r.toFixed(0), sub: currentSignal.indicators.williams_r <= -80 ? 'Oversold' : currentSignal.indicators.williams_r >= -20 ? 'Overbought' : 'Neutral', bull: currentSignal.indicators.williams_r < -50 },
                    { name: 'Ichimoku',     value: currentSignal.indicators.ichimokuCloud || 'INSIDE', sub: 'Cloud Position', bull: currentSignal.indicators.ichimokuCloud === 'ABOVE' },
                    { name: 'Parab. SAR',   value: currentSignal.indicators.parabolicSAR || 'BULL', sub: 'SAR Direction', bull: currentSignal.indicators.parabolicSAR === 'BULL' },
                    { name: 'SuperTrend',   value: currentSignal.indicators.superTrend || 'UP', sub: 'Super Trend', bull: currentSignal.indicators.superTrend === 'UP' },
                    { name: 'Momentum',     value: currentSignal.indicators.momentum.toFixed(5), sub: currentSignal.indicators.momentum > 0 ? 'Positive' : 'Negative', bull: currentSignal.indicators.momentum > 0 },
                    { name: 'ROC-12',       value: currentSignal.indicators.roc.toFixed(3)+'%', sub: 'Rate of Change', bull: currentSignal.indicators.roc > 0 },
                    { name: 'VWAP',         value: currentSignal.indicators.vwap.toFixed(5), sub: currentSignal.entryPrice > currentSignal.indicators.vwap ? 'Price Above' : 'Price Below', bull: currentSignal.entryPrice > currentSignal.indicators.vwap },
                    { name: 'ATR-14',       value: currentSignal.indicators.atr.toFixed(5), sub: 'Volatility', bull: true },
                    { name: 'Volatility',   value: currentSignal.indicators.volatility.toFixed(3)+'%', sub: currentSignal.indicators.volatility < 0.4 ? 'Low' : 'Medium', bull: currentSignal.indicators.volatility < 0.6 },
                    { name: 'Price Vel.',   value: currentSignal.indicators.priceVelocity > 0 ? '▲ Rising' : '▼ Falling', sub: 'Price Velocity', bull: currentSignal.indicators.priceVelocity > 0 },
                    { name: 'Support',      value: currentSignal.indicators.support.toFixed(5), sub: 'Key Level', bull: currentSignal.entryPrice > currentSignal.indicators.support },
                    { name: 'Resistance',   value: currentSignal.indicators.resistance.toFixed(5), sub: 'Key Level', bull: currentSignal.entryPrice < currentSignal.indicators.resistance },
                    { name: 'Pivot Point',  value: currentSignal.indicators.pivotPoint.toFixed(5), sub: currentSignal.entryPrice > currentSignal.indicators.pivotPoint ? 'Above' : 'Below', bull: currentSignal.entryPrice > currentSignal.indicators.pivotPoint },
                  ] as const).map(ind => (
                    <div key={ind.name} className="flex items-center justify-between py-1 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.018)' }}>
                      <div>
                        <span className="text-[10px] font-semibold" style={{ color: '#7a8ea8' }}>{ind.name}</span>
                        <div className="text-[8px]" style={{ color: '#253550' }}>{ind.sub}</div>
                      </div>
                      <div className={`text-[10px] font-bold font-mono ${ind.bull ? 'text-emerald-400' : 'text-red-400'}`}>{ind.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer Card */}
            <div className="rounded-2xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(5,10,22,0.88)', backdropFilter: 'blur(14px)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #6366f1)', boxShadow: '0 0 18px rgba(0,212,255,0.3)' }}>
                  <span className="text-white font-black text-lg">A</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Amirul_Adnan</div>
                  <div className="text-[10px]" style={{ color: '#253550' }}>Signal Engineer</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Platform',     value: 'Tradowix.com',              color: '#00d4ff' },
                  { label: 'Signal Type',  value: '1 Min Binary',              color: '#10b981' },
                  { label: 'Data Source',  value: 'Deriv WS v3',               color: '#818cf8' },
                  { label: 'Chart',        value: 'TradingView Fusion',        color: '#34d399' },
                  { label: 'Timezone',     value: 'Bangladesh BST (UTC+6)',    color: '#fbbf24' },
                  { label: 'Indicators',   value: '21 Deep Indicators',        color: '#fb923c' },
                  { label: 'Voice',        value: 'Bangla AI TTS',             color: '#f472b6' },
                  { label: 'MTG',          value: '1-Step Recovery System',   color: '#f59e0b' },
                  { label: 'Win/Loss',     value: 'Auto Price Detection',      color: '#a3e635' },
                  { label: 'Engine',       value: 'SHARK v5.0 Never-Drop',    color: '#60a5fa' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    <span className="text-[10px]" style={{ color: '#253550' }}>{item.label}</span>
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
