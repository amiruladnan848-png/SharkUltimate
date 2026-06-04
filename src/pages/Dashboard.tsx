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
import {
  isWeekend, getCurrentSession, getSessionAccuracyBoost, getSessionDetails, formatCountdown
} from '@/lib/timezone';
import {
  LogOut, Lock, Zap, Activity, Shield, BarChart2, Scan, Trophy, TrendingUp, Radio, Globe, Cpu, Target
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState<CurrencyPair>(REAL_PAIRS[0]);
  const weekend = isWeekend();
  const session = getCurrentSession();
  const boost   = getSessionAccuracyBoost(session);
  const sesInfo = getSessionDetails(session);

  useEffect(() => {
    if (sessionStorage.getItem('shark_auth') !== 'true') navigate('/');
  }, [navigate]);

  const { ticks, connectionStatus, subscribeTick, unsubscribeTick, priceHistory, requestCandles } = useDerivWebSocket();

  useEffect(() => {
    subscribeTick(selectedPair.derivSymbol);
    const t = setTimeout(() => requestCandles(selectedPair.derivSymbol, 500), 1000);
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
      const t = setTimeout(() => speakBangla('connected'), 600);
      const t2 = setTimeout(() => speakBangla('ready'), 2400);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [connectionStatus.connected]);

  // Dynamic accuracy display — based on session + shelter
  const shelterFloor    = useMemo(() => Math.min(90, 80 + boost * 0.55), [boost]);
  const displayAccuracy = useMemo(() => Math.min(97, shelterFloor + boost * 0.38 + 3), [boost, shelterFloor]);
  const sessionAccuracy = useMemo(() => Math.min(97, displayAccuracy + 2), [displayAccuracy]);
  const engineAccuracy  = useMemo(() => Math.min(96, displayAccuracy - 1), [displayAccuracy]);

  const totalDataPoints = useMemo(() =>
    Object.values(priceHistory).reduce((s, h) => s + h.length, 0), [priceHistory]);

  const handleLogout     = useCallback(() => { sessionStorage.removeItem('shark_auth'); navigate('/'); }, [navigate]);
  const handlePairChange = useCallback((p: CurrencyPair) => setSelectedPair(p), []);

  // Engine info cards for banner
  const engineStats = [
    { icon: <Globe className="w-4 h-4" />,    color: '#a78bfa', title: 'QX Broker',           sub: 'qxbroker.com' },
    { icon: <Zap className="w-4 h-4" />,       color: '#00e5ff', title: 'SHARK v7.0',           sub: '24-Step Engine' },
    { icon: <Shield className="w-4 h-4" />,     color: '#34d399', title: `+${boost}% Session`,  sub: sesInfo.quality + ' Boost' },
    { icon: <Activity className="w-4 h-4" />,   color: '#60a5fa', title: 'Shelter v7.0',        sub: `Floor: ${shelterFloor.toFixed(0)}%` },
    { icon: <BarChart2 className="w-4 h-4" />,  color: '#fb923c', title: 'TV+Deriv Fusion',     sub: '1M + Tick Data' },
    { icon: <Scan className="w-4 h-4" />,       color: '#f472b6', title: '5-Phase Scanner',     sub: 'Pro Laser' },
    { icon: <Radio className="w-4 h-4" />,      color: '#fbbf24', title: 'Auto Win/Loss',       sub: 'Price Detection' },
    { icon: <Trophy className="w-4 h-4" />,     color: '#4ade80', title: `Win: ${winRate}%`,    sub: `W${totalWins} L${totalLosses}` },
    { icon: <TrendingUp className="w-4 h-4" />, color: '#f87171', title: '1-Step MTG',          sub: martingaleActive ? '×2 Active!' : 'Standby' },
    { icon: <Cpu className="w-4 h-4" />,        color: '#38bdf8', title: 'Bangla Voice',        sub: 'AI TTS Active' },
  ];

  return (
    <div className="min-h-screen bg-[#030812] text-white relative overflow-x-hidden">
      <BackgroundAnimation />
      <Header />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 pb-12 pt-4">

        {/* ── Top Control Bar ── */}
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
                style={{ border: '1px solid rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.07)', color: '#fb923c' }}>
                <Lock className="w-3 h-3" /> Weekend — Market Locked
              </div>
            )}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)', color: '#2a4060' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#2a4060'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}>
              <LogOut className="w-3 h-3" /> Lock
            </button>
          </div>
        </div>

        {/* ── Engine Banner ── */}
        <div className="mb-4 rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(0,212,255,0.1)',
            background: 'linear-gradient(135deg,rgba(3,8,20,0.99),rgba(6,14,36,0.97))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 2px 40px rgba(0,212,255,0.04)',
          }}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.5),rgba(167,139,250,0.35),rgba(52,211,153,0.3),transparent)' }} />
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              {engineStats.map(item => (
                <div key={item.title} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}22`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-black leading-tight" style={{ color: item.color }}>{item.title}</div>
                    <div className="text-[8px] leading-tight" style={{ color: '#1a2e50' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Countdown */}
            <div className="flex flex-col items-end ml-auto flex-shrink-0">
              <div className="text-[9px] tracking-[0.2em] uppercase mb-0.5" style={{ color: '#1a2e50' }}>1 MIN BOUNDARY</div>
              <div className="text-5xl font-mono font-black tabular-nums"
                style={{ color: '#00e5ff', textShadow: '0 0 32px rgba(0,229,255,0.75), 0 0 80px rgba(0,229,255,0.2)', letterSpacing: '0.08em' }}>
                {formatCountdown(countdown)}
              </div>
              <div className="text-[8px] mt-0.5" style={{ color: '#141e30' }}>next expiry</div>
            </div>
          </div>
        </div>

        {/* ── Main 3-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[310px_1fr_300px] gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-4">
            <CurrencyPairSelector selected={selectedPair} onChange={handlePairChange} />
            <PriceDisplay tick={currentTick} pair={selectedPair} connected={connectionStatus.connected} latency={connectionStatus.latency} />
            <SessionIndicator />

            {/* Accuracy Engine Panel */}
            <div className="rounded-2xl p-4"
              style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(3,8,20,0.92)', backdropFilter: 'blur(18px)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: '#1a3060' }}>
                  Accuracy Engine
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff' }}>
                  <Shield className="w-2.5 h-2.5" />
                  Floor: {shelterFloor.toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center justify-around gap-2">
                <AccuracyMeter accuracy={Math.round(displayAccuracy)} size="lg" label="Overall" showShelter />
                <div className="flex flex-col gap-3">
                  <AccuracyMeter accuracy={Math.round(sessionAccuracy)} size="md" label="Session" />
                  <AccuracyMeter accuracy={Math.round(engineAccuracy)} size="md" label="Engine" />
                </div>
              </div>
              {/* Session boost indicator */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: '#1a3060' }}>Session Boost</span>
                  <span className="font-black" style={{ color: sesInfo.color }}>+{boost}% {sesInfo.quality}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(boost / 22) * 100}%`, background: `linear-gradient(90deg,${sesInfo.color}80,${sesInfo.color})`, boxShadow: `0 0 8px ${sesInfo.color}60` }} />
                </div>
              </div>
            </div>

            {/* Recent Results */}
            {signalHistory.length > 0 && (
              <div className="rounded-2xl p-4"
                style={{ border: '1px solid rgba(0,212,255,0.07)', background: 'rgba(3,8,20,0.9)', backdropFilter: 'blur(14px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#1a3060' }}>
                    Recent Results
                  </h3>
                  <div className="text-[10px] font-black"
                    style={{ color: winRate >= 65 ? '#34d399' : winRate >= 50 ? '#fbbf24' : '#f87171' }}>
                    {winRate}% Win Rate
                  </div>
                </div>
                <div className="space-y-1.5">
                  {signalHistory.slice(0, 6).map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rec.result === 'WIN' ? 'bg-emerald-400' : rec.result === 'LOSS' ? 'bg-red-400' : 'bg-gray-600'}`}
                        style={rec.result === 'WIN' ? { boxShadow: '0 0 5px #34d399' } : rec.result === 'LOSS' ? { boxShadow: '0 0 5px #f87171' } : {}} />
                      <div className="text-[10px] font-black" style={{ color: rec.signal.direction === 'CALL' ? '#34d399' : '#f87171' }}>
                        {rec.signal.direction}
                      </div>
                      <div className="text-[9px] flex-1" style={{ color: '#1a2e50' }}>{rec.signal.pair.symbol}</div>
                      <div className="text-[9px]" style={{ color: '#1a2e50' }}>{rec.signal.accuracy}%</div>
                      <div className="text-[10px] font-black"
                        style={{ color: rec.result === 'WIN' ? '#34d399' : rec.result === 'LOSS' ? '#f87171' : '#4b5563' }}>
                        {rec.result}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER COLUMN ── */}
          <div className="flex flex-col gap-4">
            {weekend ? (
              <div className="rounded-2xl flex flex-col items-center justify-center min-h-[460px] text-center p-10"
                style={{ border: '1px solid rgba(251,146,60,0.25)', background: 'rgba(251,146,60,0.03)' }}>
                <Lock className="w-14 h-14 text-orange-400 mb-5" style={{ filter: 'drop-shadow(0 0 12px rgba(251,146,60,0.5))' }} />
                <h3 className="text-orange-300 font-black text-2xl mb-2 tracking-wider">WEEKEND — MARKET CLOSED</h3>
                <p className="text-sm max-w-xs" style={{ color: 'rgba(251,146,60,0.4)' }}>Real forex markets are closed Saturday & Sunday. Return on Monday for prime signals.</p>
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

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-4">

            {/* 24-Indicator Analysis Panel */}
            {currentSignal && (
              <div className="rounded-2xl p-4"
                style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(3,8,20,0.94)', backdropFilter: 'blur(18px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#1a3060' }}>
                    24-Indicator Analysis
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    LIVE
                  </div>
                </div>
                <div className="space-y-[3px] max-h-[460px] overflow-y-auto pr-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,255,0.2) transparent' }}>
                  {([
                    { name: 'RSI-14',      value: currentSignal.indicators.rsi.toFixed(1),  sub: currentSignal.indicators.rsi < 30 ? 'Oversold ↑' : currentSignal.indicators.rsi > 70 ? 'Overbought ↓' : 'Neutral',  bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.rsi < 50 : currentSignal.indicators.rsi > 50 },
                    { name: 'MACD Hist',   value: currentSignal.indicators.macdHist > 0 ? '▲ Positive' : '▼ Negative', sub: currentSignal.indicators.macdHist.toFixed(6), bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.macdHist > 0 : currentSignal.indicators.macdHist < 0 },
                    { name: 'EMA Stack',   value: currentSignal.indicators.trendStrength.replace(/_/g,' '),  sub: 'EMA5/9/21/50/200', bull: currentSignal.direction === 'CALL' ? ['UP','STRONG_UP'].includes(currentSignal.indicators.trendStrength) : ['DOWN','STRONG_DOWN'].includes(currentSignal.indicators.trendStrength) },
                    { name: 'BB %B',       value: (currentSignal.indicators.bb_pct*100).toFixed(0)+'%', sub: currentSignal.indicators.bb_pct < 0.2 ? 'Near Lower' : currentSignal.indicators.bb_pct > 0.8 ? 'Near Upper' : 'Middle', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.bb_pct < 0.5 : currentSignal.indicators.bb_pct > 0.5 },
                    { name: 'Stochastic',  value: `K:${currentSignal.indicators.stoch_k.toFixed(0)} D:${currentSignal.indicators.stoch_d.toFixed(0)}`, sub: currentSignal.indicators.stoch_k < 20 ? 'Oversold' : currentSignal.indicators.stoch_k > 80 ? 'Overbought' : 'Neutral', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.stoch_k < 50 : currentSignal.indicators.stoch_k > 50 },
                    { name: 'ADX',         value: currentSignal.indicators.adx.toFixed(1), sub: currentSignal.indicators.adx > 50 ? 'Very Strong' : currentSignal.indicators.adx > 35 ? 'Strong' : currentSignal.indicators.adx > 25 ? 'Trending' : 'Ranging', bull: currentSignal.indicators.adx > 25 },
                    { name: 'DI+/DI-',     value: `+${currentSignal.indicators.di_plus.toFixed(0)} / -${currentSignal.indicators.di_minus.toFixed(0)}`, sub: 'Directional Index', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.di_plus > currentSignal.indicators.di_minus : currentSignal.indicators.di_minus > currentSignal.indicators.di_plus },
                    { name: 'CCI-20',      value: currentSignal.indicators.cci.toFixed(0), sub: currentSignal.indicators.cci < -100 ? 'Oversold' : currentSignal.indicators.cci > 100 ? 'Overbought' : 'Neutral', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.cci < 0 : currentSignal.indicators.cci > 0 },
                    { name: 'Williams %R', value: currentSignal.indicators.williams_r.toFixed(0), sub: currentSignal.indicators.williams_r <= -80 ? 'Oversold' : currentSignal.indicators.williams_r >= -20 ? 'Overbought' : 'Neutral', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.williams_r < -50 : currentSignal.indicators.williams_r > -50 },
                    { name: 'Ichimoku',    value: currentSignal.indicators.ichimokuCloud || 'INSIDE', sub: 'Cloud Position', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.ichimokuCloud === 'ABOVE' : currentSignal.indicators.ichimokuCloud === 'BELOW' },
                    { name: 'Parab. SAR',  value: currentSignal.indicators.parabolicSAR || 'BULL', sub: 'SAR Direction', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.parabolicSAR === 'BULL' : currentSignal.indicators.parabolicSAR === 'BEAR' },
                    { name: 'SuperTrend',  value: currentSignal.indicators.superTrend || 'UP', sub: '3×ATR Band', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.superTrend === 'UP' : currentSignal.indicators.superTrend === 'DOWN' },
                    { name: 'Momentum',    value: currentSignal.indicators.momentum > 0 ? '▲ Positive' : '▼ Negative', sub: currentSignal.indicators.momentum.toFixed(5), bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.momentum > 0 : currentSignal.indicators.momentum < 0 },
                    { name: 'ROC-12',      value: currentSignal.indicators.roc.toFixed(4)+'%', sub: 'Rate of Change', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.roc > 0 : currentSignal.indicators.roc < 0 },
                    { name: 'VWAP',        value: currentSignal.indicators.vwap.toFixed(5), sub: currentSignal.entryPrice > currentSignal.indicators.vwap ? 'Price Above' : 'Price Below', bull: currentSignal.direction === 'CALL' ? currentSignal.entryPrice > currentSignal.indicators.vwap : currentSignal.entryPrice < currentSignal.indicators.vwap },
                    { name: 'ATR-14',      value: currentSignal.indicators.atr.toFixed(5), sub: 'Avg True Range', bull: true },
                    { name: 'Price Vel.',  value: currentSignal.indicators.priceVelocity > 0 ? '▲ Rising' : '▼ Falling', sub: 'Velocity', bull: currentSignal.direction === 'CALL' ? currentSignal.indicators.priceVelocity > 0 : currentSignal.indicators.priceVelocity < 0 },
                    { name: 'Support',     value: currentSignal.indicators.support.toFixed(5), sub: 'Key Level', bull: currentSignal.entryPrice > currentSignal.indicators.support },
                    { name: 'Resistance',  value: currentSignal.indicators.resistance.toFixed(5), sub: 'Key Level', bull: currentSignal.entryPrice < currentSignal.indicators.resistance },
                    { name: 'Pivot Pt.',   value: currentSignal.indicators.pivotPoint.toFixed(5), sub: currentSignal.entryPrice > currentSignal.indicators.pivotPoint ? 'Above' : 'Below', bull: currentSignal.direction === 'CALL' ? currentSignal.entryPrice > currentSignal.indicators.pivotPoint : currentSignal.entryPrice < currentSignal.indicators.pivotPoint },
                    { name: 'BB Width',    value: currentSignal.indicators.bb_width.toFixed(3)+'%', sub: currentSignal.indicators.bb_width < 0.15 ? 'Squeeze ⚡' : 'Normal', bull: currentSignal.indicators.bb_width > 0.08 },
                    { name: 'EMA5',        value: currentSignal.indicators.ema5.toFixed(5), sub: 'Fast EMA', bull: currentSignal.direction === 'CALL' ? currentSignal.entryPrice > currentSignal.indicators.ema5 : currentSignal.entryPrice < currentSignal.indicators.ema5 },
                    { name: 'EMA200',      value: currentSignal.indicators.ema200.toFixed(5), sub: 'Trend Filter', bull: currentSignal.direction === 'CALL' ? currentSignal.entryPrice > currentSignal.indicators.ema200 : currentSignal.entryPrice < currentSignal.indicators.ema200 },
                    { name: 'Confluence',  value: currentSignal.analysis.confluenceScore + '%', sub: currentSignal.analysis.confidence.replace('_',' '), bull: currentSignal.analysis.confluenceScore > 55 },
                  ] as const).map(ind => (
                    <div key={ind.name}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                      style={{
                        background: ind.bull ? 'rgba(0,229,255,0.025)' : 'rgba(248,113,113,0.02)',
                        border: `1px solid ${ind.bull ? 'rgba(0,229,255,0.07)' : 'rgba(248,113,113,0.06)'}`,
                      }}>
                      <div>
                        <div className="text-[10px] font-semibold" style={{ color: '#4a6a88' }}>{ind.name}</div>
                        <div className="text-[8px]" style={{ color: '#1a2e50' }}>{ind.sub}</div>
                      </div>
                      <div className={`text-[10px] font-black font-mono ${ind.bull ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ind.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer / Platform Info */}
            <div className="rounded-2xl p-4"
              style={{ border: '1px solid rgba(0,212,255,0.07)', background: 'rgba(3,8,20,0.92)', backdropFilter: 'blur(14px)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg,#0369a1,#4f46e5)',
                    boxShadow: '0 0 24px rgba(0,212,255,0.3)',
                  }}>
                  <span className="text-white font-black text-xl">A</span>
                </div>
                <div>
                  <div className="text-white font-black text-sm">Amirul_Adnan</div>
                  <div className="text-[10px]" style={{ color: '#1a3060' }}>Signal Engineer</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Platform',    value: 'QX Broker',           color: '#a78bfa' },
                  { label: 'Website',     value: 'qxbroker.com',         color: '#00e5ff' },
                  { label: 'Signal Type', value: '1 Min Binary',         color: '#34d399' },
                  { label: 'Data Source', value: 'Deriv WebSocket v3',   color: '#60a5fa' },
                  { label: 'Chart',       value: 'TradingView + Deriv',  color: '#4ade80' },
                  { label: 'Timezone',    value: 'Bangladesh UTC+6',     color: '#fbbf24' },
                  { label: 'Indicators',  value: '24 Deep Indicators',   color: '#fb923c' },
                  { label: 'Voice',       value: 'Bangla AI TTS v7',     color: '#f472b6' },
                  { label: 'MTG',         value: '1-Step ×2 Recovery',   color: '#f59e0b' },
                  { label: 'Win/Loss',    value: 'Auto Price Detection', color: '#a3e635' },
                  { label: 'Engine',      value: 'SHARK v7.0 Shelter',   color: '#38bdf8' },
                  { label: 'Session',     value: sesInfo.label,           color: sesInfo.color },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-1"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    <span className="text-[10px]" style={{ color: '#1a2e50' }}>{item.label}</span>
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
