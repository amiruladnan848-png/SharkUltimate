import React, { memo } from 'react';
import { ConnectionStatus } from '@/types/trading';
import { Wifi, WifiOff, Zap, Shield, Radio, Cpu, TrendingUp } from 'lucide-react';

interface StatsBarProps {
  connectionStatus: ConnectionStatus;
  dataPoints: number;
  winRate?: number;
  totalWins?: number;
  totalLosses?: number;
}

export const StatsBar: React.FC<StatsBarProps> = memo(({ connectionStatus, dataPoints, winRate = 0, totalWins = 0, totalLosses = 0 }) => {
  const badges = [
    {
      icon: connectionStatus.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />,
      label: connectionStatus.connected ? 'Deriv WS' : 'Reconnecting',
      extra: connectionStatus.connected && connectionStatus.latency !== undefined
        ? <span className={`ml-1 text-[9px] font-mono ${connectionStatus.latency < 80 ? 'text-emerald-300' : 'text-yellow-400'}`}>{connectionStatus.latency}ms</span>
        : null,
      color: connectionStatus.connected ? '#10b981' : '#ef4444',
    },
    {
      icon: <Radio className="w-3 h-3 animate-pulse" />,
      label: `${dataPoints.toLocaleString()} ticks`,
      color: '#00d4ff',
    },
    {
      icon: <Zap className="w-3 h-3" />,
      label: 'SHARK v5.0',
      color: '#818cf8',
    },
    {
      icon: <Shield className="w-3 h-3" />,
      label: 'Accuracy Shelter',
      color: '#f59e0b',
    },
    {
      icon: <Cpu className="w-3 h-3" />,
      label: 'TV + Deriv Fusion',
      color: '#34d399',
    },
    ...(totalWins + totalLosses > 0 ? [{
      icon: <TrendingUp className="w-3 h-3" />,
      label: `W:${totalWins} L:${totalLosses} • ${winRate}%`,
      color: winRate >= 60 ? '#10b981' : winRate >= 45 ? '#f59e0b' : '#ef4444',
      extra: null,
    }] : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((b, i) => (
        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ border: `1px solid ${b.color}22`, background: `${b.color}0a`, color: b.color }}>
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
