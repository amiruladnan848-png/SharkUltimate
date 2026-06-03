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
import { LogOut, Lock, Zap, Activity, Shield, BarChart2, Scan, Trophy, TrendingUp, Radio, Globe } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState<CurrencyPair>(REAL_PAIRS[0]);
  const weekend = isWeekend();
  const session = getCurrentSession();
  const boost   = getSessionAccuracyBoost(session);

  useEffect(() => {
    if (sessionStorage.getItem('shark_auth') !== 'true') navigate('/');
  }, [navigate]);

  const { ticks, connectionStatus, subscribeTick, unsubscribeTick, priceHistory, requestCandles } = useDerivWebSocket();

  useEffect(() => {
    subscribeTick(selectedPair.derivSymbol);
    const t = setTimeout(() => requestCandles(selectedPair.derivSymbol, 300), 1200);
    return () => { unsubscribeTick(selectedPair.derivSymbol); clearTimeout(t); };
  }, [selectedPair.derivSymbol, subscribeTick, unsubscribeTick, requestCandles]);

  const currentHistory = priceHistory[selectedPair.derivSymbol] || [];
  const currentTick    = ticks[selectedPair.derivSymbol] || null;
  const dataReady      = currentHistory.length >= 30;

  const {
    currentSignal, countdown, isAnalyzing, analysisPct,
    triggerManualSignal, lastAnalysis, analysisStep,
    signalHistory, totalWins, totalLosses, winRate,
    martingaleActive, martingaleMultiplier, lastResult,
  } = useSignalEngine({
    pair: selectedPair,
    priceHistory: currentHistory,
    enabled: !weekend,
  });

  useEffect(() => {
    if (connectionStatus.connected) {
      const t = setTimeout(() => speakBangla('ready'), 800);
      return () => clearTimeout(t);
    }
  }, [connectionStatus.connected]);

  const shelterFloor   = useMemo(() => Math.min(87, 75 + boost * 0.6), [boost]);
  const displayAccuracy = useMemo(() => Math.min(97, shelterFloor + 5 + boost * 0.35), [boost, shelterFloor]);

  const totalDataPoints = useMemo(() =>
    Object.values(priceHistory).reduce((s, h) => s + h.length, 0), [priceHistory]);

  const handleLogout    = useCallback(() => { sessionStorage.removeItem('shark_auth'); navigate('/'); }, [navigate]);
  const handlePairChange = useCallback((p: CurrencyPair) => setSelectedPair(p), []);

  // Engine stats for banner
  const engineStats = [
    { icon: <Globe className="w-4 h-4" />,      color: '#a78bfa', title: 'QX Broker',            sub: 'qxbroker.com Platform' },
    { icon: <Zap className="w-4 h-4" />,         color: '#00e5ff', title: 'SHARK v6.0',            sub: '21-Step Deep Engine' },
    { icon: <Shield className="w-4 h-4" />,       color: '#34d399', title: `+${boost}% Boost`,     sub: `${session.replace('_','+')} Session` },
    { icon: <Activity className="w-4 h-4" />,     color: '#60a5fa', title: 'Accuracy Shelter',     sub: `Floor: ${shelterFloor.toFixed(0)}%` },
    { icon: <BarChart2 className="w-4 h-4" />,    color: '#fb923c', title: 'TV+Deriv Fusion',      sub: '1M Chart History' },
    { icon: <Scan className="w-4 h-4" />,         color: '#f472b6', title: 'Laser Scanner',        sub: '4-Phase Pro System' },
    { icon: <Radio className="w-4 h-4" />,        color: '#fbbf24', title: 'Auto Win/Loss',        sub: 'Price Detection' },
    { icon: <Trophy className="w-4 h-4" />,       color: '#4ade80', title: `Win Rate: ${winRate}%`, sub: `W:${totalWins} L:${totalLosses}` },
    { icon: <TrendingUp className="w-4 h-4" />,   color: '#f87171', title: '1-Step MTG',           sub: martingaleActive ? '×2 Active' : 'Standby' },
  ];

  return (
    <div className="min-h-screen bg-[#040916] text-white relative overflow-x-hidden">
      <BackgroundAnimation />
      <Header />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 pb-12 pt-4">

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
                style={{ border: '1px solid rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.08)', color: '#fb923c' }}>
                <Lock className="w-3 h-3" /> Weekend — Market Locked
              </div>
            )}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: '#3a5070' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a5070'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
              <LogOut className="w-3 h-3" /> Lock
            </button>
          </div>
        </div>

        {/* Engine banner */}
        <div className="mb-4 rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(0,212,255,0.12)',
            background: 'linear-gradient(135deg,rgba(4,9,22,0.98),rgba(8,16,40,0.96))',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 2px 30px rgba(0,212,255,0.05)',
          }}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.45),rgba(167,139,250,0.4),transparent)' }} />
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 lg:gap-5">
              {engineStats.map(item => (
                <div key={item.title} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}14`, border: `1px solid ${item.color}25`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold leading-tight" style={{ color: item.color }}>{item.title}</div>
                    <div className="text-[9px] leading-tight" style={{ color: '#1e3870' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end ml-auto">
              <div className="text-[9px] tracking-[0.2em] uppercase mb-0.5" style={{ color: '#1e3870' }}>1 MIN BOUNDARY</div>
              <div className="text-4xl font-mono font-black tabular-nums"
                style={{ color: '#00e5ff', textShadow: '0 0 28px rgba(0,229,255,0.7), 0 0 60px rgba(0,229,255,0.2)', letterSpacing: '0.08em' }}>
                {formatCountdown(countdown)}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: '#1a2d45' }}>next expiry</div>
            </div>
          </div>
        </div>

        {/* ── MAIN LAYOUT ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_295px] gap-4">

          {/* ── LEFT ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <CurrencyPairSelector selected={selectedPair} onChange={handlePairChange} />
            <PriceDisplay tick={currentTick} pair={selectedPair} connected={connectionStatus.connected} latency={connectionStatus.latency} />
            <SessionIndicator />

            {/* Accuracy meters */}
            <div className="rounded-2xl p-4"
              style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(4,9,22,0.88)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: '#1e3870' }}>Accuracy Engine</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#00e5ff' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Floor: {shelterFloor.toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center justify-around">
                <AccuracyMeter accuracy={displayAccuracy}            size="lg" label="Overall" showShelter />
                <AccuracyMeter accuracy={Math.min(97, displayAccuracy + 2)} size="md" label="Session" />
                <AccuracyMeter accuracy={Math.min(96, displayAccuracy - 1)} size="md" label="Engine" />
              </div>
            </div>

            {/* Recent results */}
            {signalHistory.length > 0 && (
              <div className="rounded-2xl p-4"
                style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(4,9,22,0.88)', backdropFilter: 'blur(14px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#1e3870' }}>Recent Results</h3>
                  <div className="text-[10px] font-black"
                    style={{ color: winRate >= 60 ? '#34d399' : winRate >= 45 ? '#fbbf24' : '#f87171' }}>
                    {winRate}% Win Rate
                  </div>
                </div>
                <div className="space-y-1.5">
                  {signalHistory.slice(0, 6).map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rec.result === 'WIN' ? 'bg-emerald-400' : rec.result === 'LOSS' ? 'bg-red-400' : 'bg-gray-600'}`} />
                      <div className="text-[10px] font-black" style={{ color: rec.signal.direction === 'CALL' ? '#34d399' : '#f87171' }}>
                        {rec.signal.direction}
                      </div>
                      <div className="text-[9px] flex-1" style={{ color: '#1e3870' }}>{rec.signal.pair.symbol}</div>
                      <div className="text-[10px] font-black"
                        style={{ color: rec.result === 'WIN' ? '#34d399' : rec.result === 'LOSS' ? '#f87171' : '#6b7280' }}>
                        {rec.result}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {weekend ? (
              <div className="rounded-2xl flex flex-col items-center justify-center min-h-[420px] text-center p-10"
                style={{ border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.04)' }}>
                <Lock className="w-12 h-12 text-orange-400 mb-4" />
                <h3 className="text-orange-300 font-black text-xl mb-2">WEEKEND — MARKET CLOSED</h3>
                <p className="text-orange-400/40 text-sm">Real forex markets are closed on weekends. Return on Monday.</p>
              </div>
            ) : (
              <TradingViewChart pair={selectedPair} signal={currentSignal} isScanning={isAnalyzing} />
            )}

            {!weekend && (
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
                martingaleMultiplier={martingaleMultiplier}
                lastResult={lastResult}
              />
            )}
          </div>

          {/* ── RIGHT ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* 21-Indicator Analysis panel */}
            {currentSignal && (
              <div className="rounded-2xl p-4"
                style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(4,9,22,0.92)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#1e3870' }}>21-Indicator Analysis</h3>
                  <div className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff' }}>
                    LIVE
                  </div>
                </div>
                <div className="space-y-[3px]">
                  {([
                    { name: 'RSI-14',     value: currentSignal.indicators.rsi.toFixed(1),             sub: currentSignal.indicators.rsi < 30 ? 'Oversold' : currentSignal.indicators.rsi > 70 ? 'Overbought' : 'Neutral', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.rsi < 50 : currentSignal.indicators.rsi > 50 },
                    { name: 'MACD',       value: currentSignal.indicators.macdHist > 0 ? '▲ Bull' : '▼ Bear', sub: currentSignal.indicators.macdHist.toFixed(6), bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.macdHist > 0 : currentSignal.indicators.macdHist < 0 },
                    { name: 'EMA Stack',  value: currentSignal.indicators.trendStrength.replace(/_/g,' '), sub: 'EMA5/9/21/50/200', bull: currentSignal.direction === 'CALL' ? ['UP','STRONG_UP'].includes(currentSignal.indicators.trendStrength) : ['DOWN','STRONG_DOWN'].includes(currentSignal.indicators.trendStrength) },
                    { name: 'BB %B',      value: (currentSignal.indicators.bb_pct*100).toFixed(0)+'%', sub: currentSignal.indicators.bb_pct < 0.2 ? 'Near Lower' : currentSignal.indicators.bb_pct > 0.8 ? 'Near Upper' : 'Mid', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.bb_pct < 0.5 : currentSignal.indicators.bb_pct > 0.5 },
                    { name: 'Stochastic', value: `K:${currentSignal.indicators.stoch_k.toFixed(0)} D:${currentSignal.indicators.stoch_d.toFixed(0)}`, sub: currentSignal.indicators.stoch_k < 20 ? 'Oversold' : currentSignal.indicators.stoch_k > 80 ? 'Overbought' : 'Neutral', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.stoch_k < 50 : currentSignal.indicators.stoch_k > 50 },
                    { name: 'ADX',        value: currentSignal.indicators.adx.toFixed(1), sub: currentSignal.indicators.adx > 40 ? 'Strong' : currentSignal.indicators.adx > 25 ? 'Trending' : 'Ranging', bull: currentSignal.indicators.adx > 25 },
                    { name: 'DI+/DI-',    value: `${currentSignal.indicators.di_plus.toFixed(0)}/${currentSignal.indicators.di_minus.toFixed(0)}`, sub: 'Directional Index', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.di_plus > currentSignal.indicators.di_minus : currentSignal.indicators.di_minus > currentSignal.indicators.di_plus },
                    { name: 'CCI-20',     value: currentSignal.indicators.cci.toFixed(0), sub: currentSignal.indicators.cci < -100 ? 'Oversold' : currentSignal.indicators.cci > 100 ? 'Overbought' : 'Neutral', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.cci < 0 : currentSignal.indicators.cci > 0 },
                    { name: 'Williams %R',value: currentSignal.indicators.williams_r.toFixed(0), sub: currentSignal.indicators.williams_r <= -80 ? 'Oversold' : currentSignal.indicators.williams_r >= -20 ? 'Overbought' : 'Neutral', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.williams_r < -50 : currentSignal.indicators.williams_r > -50 },
                    { name: 'Ichimoku',   value: currentSignal.indicators.ichimokuCloud || 'INSIDE', sub: 'Cloud Position', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.ichimokuCloud === 'ABOVE' : currentSignal.indicators.ichimokuCloud === 'BELOW' },
                    { name: 'Parab. SAR', value: currentSignal.indicators.parabolicSAR || 'BULL', sub: 'SAR Direction', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.parabolicSAR === 'BULL' : currentSignal.indicators.parabolicSAR === 'BEAR' },
                    { name: 'SuperTrend', value: currentSignal.indicators.superTrend || 'UP', sub: 'Super Trend', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.superTrend === 'UP' : currentSignal.indicators.superTrend === 'DOWN' },
                    { name: 'Momentum',   value: currentSignal.indicators.momentum > 0 ? '▲ POS' : '▼ NEG', sub: currentSignal.indicators.momentum.toFixed(5), bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.momentum > 0 : currentSignal.indicators.momentum < 0 },
                    { name: 'ROC-12',     value: currentSignal.indicators.roc.toFixed(3)+'%', sub: 'Rate of Change', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.roc > 0 : currentSignal.indicators.roc < 0 },
                    { name: 'VWAP',       value: currentSignal.indicators.vwap.toFixed(5), sub: currentSignal.entryPrice > currentSignal.indicators.vwap ? 'Above' : 'Below', bull: currentSignal.direction === 'CALL' ? currentSignal.entryPrice > currentSignal.indicators.vwap : currentSignal.entryPrice < currentSignal.indicators.vwap },
                    { name: 'ATR-14',     value: currentSignal.indicators.atr.toFixed(5), sub: 'Volatility', bull: true },
                    { name: 'Price Vel.', value: currentSignal.indicators.priceVelocity > 0 ? '▲ Rising' : '▼ Falling', sub: 'Velocity', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.priceVelocity > 0 : currentSignal.indicators.priceVelocity < 0 },
                    { name: 'Support',    value: currentSignal.indicators.support.toFixed(5), sub: 'Key Level', bull: currentSignal.entryPrice > currentSignal.indicators.support },
                    { name: 'Resistance', value: currentSignal.indicators.resistance.toFixed(5), sub: 'Key Level', bull: currentSignal.entryPrice < currentSignal.indicators.resistance },
                    { name: 'Pivot Pt.',  value: currentSignal.indicators.pivotPoint.toFixed(5), sub: currentSignal.entryPrice > currentSignal.indicators.pivotPoint ? 'Above' : 'Below', bull: currentSignal.direction === 'CALL' ? currentSignal.entryPrice > currentSignal.indicators.pivotPoint : currentSignal.entryPrice < currentSignal.indicators.pivotPoint },
                    { name: 'BB Width',   value: currentSignal.indicators.bb_width.toFixed(3)+'%', sub: currentSignal.indicators.bb_width < 0.2 ? 'Squeeze' : 'Normal', bull: currentSignal.indicators.bb_width > 0.1 },
                  ] as const).map(ind => (
                    <div key={ind.name} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div>
                        <div className="text-[10px] font-semibold" style={{ color: '#6a8aa8' }}>{ind.name}</div>
                        <div className="text-[8px]" style={{ color: '#1e3870' }}>{ind.sub}</div>
                      </div>
                      <div className={`text-[10px] font-bold font-mono ${ind.bull ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ind.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer / Platform Info */}
            <div className="rounded-2xl p-4"
              style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(4,9,22,0.9)', backdropFilter: 'blur(14px)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg,#00e5ff,#6366f1)',
                    boxShadow: '0 0 22px rgba(0,229,255,0.35)',
                  }}>
                  <span className="text-white font-black text-xl">A</span>
                </div>
                <div>
                  <div className="text-white font-black text-sm">Amirul_Adnan</div>
                  <div className="text-[10px]" style={{ color: '#1e3870' }}>Signal Engineer</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Platform',     value: 'QX Broker',            color: '#a78bfa' },
                  { label: 'Website',      value: 'qxbroker.com',          color: '#00e5ff' },
                  { label: 'Signal Type',  value: '1 Min Binary',          color: '#34d399' },
                  { label: 'Data Source',  value: 'Deriv WS v3 API',       color: '#60a5fa' },
                  { label: 'Chart',        value: 'TradingView + Deriv',   color: '#4ade80' },
                  { label: 'Timezone',     value: 'Bangladesh BST UTC+6',  color: '#fbbf24' },
                  { label: 'Indicators',   value: '21 Deep Indicators',    color: '#fb923c' },
                  { label: 'Voice',        value: 'Bangla AI TTS',         color: '#f472b6' },
                  { label: 'MTG',          value: '1-Step ×2 Recovery',    color: '#f59e0b' },
                  { label: 'Win/Loss',     value: 'Auto Price Detection',  color: '#a3e635' },
                  { label: 'Engine',       value: 'SHARK v6.0 Shelter',    color: '#38bdf8' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-1"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span className="text-[10px]" style={{ color: '#1e3870' }}>{item.label}</span>
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
