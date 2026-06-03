import React, { memo } from 'react';
import { ConnectionStatus } from '@/types/trading';
import { Wifi, WifiOff, Zap, Shield, Radio, Cpu, TrendingUp, Globe } from 'lucide-react';

interface StatsBarProps {
  connectionStatus: ConnectionStatus;
  dataPoints: number;
  winRate?: number;
  totalWins?: number;
  totalLosses?: number;
}

export const StatsBar: React.FC<StatsBarProps> = memo(({
  connectionStatus, dataPoints, winRate = 0, totalWins = 0, totalLosses = 0,
}) => {
  const badges = [
    {
      icon: connectionStatus.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />,
      label: connectionStatus.connected ? 'Deriv LIVE' : 'Reconnecting',
      extra: connectionStatus.connected && connectionStatus.latency !== undefined
        ? <span className="ml-1 text-[9px] font-mono" style={{ color: connectionStatus.latency < 80 ? '#34d399' : '#fbbf24' }}>{connectionStatus.latency}ms</span>
        : null,
      color: connectionStatus.connected ? '#34d399' : '#f87171',
    },
    {
      icon: <Globe className="w-3 h-3" />,
      label: 'QX Broker',
      color: '#a78bfa',
      extra: null,
    },
    {
      icon: <Radio className="w-3 h-3 animate-pulse" />,
      label: `${dataPoints.toLocaleString()} ticks`,
      color: '#00e5ff',
      extra: null,
    },
    {
      icon: <Zap className="w-3 h-3" />,
      label: 'SHARK v6.0',
      color: '#60a5fa',
      extra: null,
    },
    {
      icon: <Shield className="w-3 h-3" />,
      label: 'Accuracy Shelter',
      color: '#fbbf24',
      extra: null,
    },
    {
      icon: <Cpu className="w-3 h-3" />,
      label: 'TV+Deriv Fusion',
      color: '#4ade80',
      extra: null,
    },
    ...(totalWins + totalLosses > 0 ? [{
      icon: <TrendingUp className="w-3 h-3" />,
      label: `W:${totalWins} L:${totalLosses} • ${winRate}%`,
      color: winRate >= 60 ? '#34d399' : winRate >= 45 ? '#fbbf24' : '#f87171',
      extra: null as React.ReactNode,
    }] : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((b, i) => (
        <div key={i}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{
            border: `1px solid ${b.color}28`,
            background: `${b.color}0d`,
            color: b.color,
          }}>
          {b.icon}
          <span>{b.label}</span>
          {b.extra}
        </div>
      ))}
    </div>
  );
});

StatsBar.displayName = 'StatsBar';
export default StatsBar;
