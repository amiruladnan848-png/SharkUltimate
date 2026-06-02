import React, { memo } from 'react';
import { ConnectionStatus } from '@/types/trading';
import { Wifi, WifiOff, Zap, Shield, Radio, Cpu } from 'lucide-react';

interface StatsBarProps {
  connectionStatus: ConnectionStatus;
  dataPoints: number;
}

export const StatsBar: React.FC<StatsBarProps> = memo(({ connectionStatus, dataPoints }) => {
  const badges = [
    {
      show: true,
      connected: connectionStatus.connected,
      icon: connectionStatus.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />,
      label: connectionStatus.connected ? 'Deriv Live' : 'Reconnecting',
      extra: connectionStatus.connected && connectionStatus.latency !== undefined
        ? <span className={`ml-1 text-[9px] font-mono ${connectionStatus.latency < 100 ? 'text-emerald-300' : 'text-yellow-400'}`}>{connectionStatus.latency}ms</span>
        : null,
      color: connectionStatus.connected ? '#10b981' : '#ef4444',
    },
    {
      show: true,
      icon: <Radio className="w-3 h-3 animate-pulse" />,
      label: `${dataPoints.toLocaleString()} ticks`,
      color: '#38bdf8',
    },
    {
      show: true,
      icon: <Zap className="w-3 h-3" />,
      label: 'SHARK v4.0',
      color: '#a78bfa',
    },
    {
      show: true,
      icon: <Shield className="w-3 h-3" />,
      label: 'Accuracy Shelter',
      color: '#f59e0b',
    },
    {
      show: true,
      icon: <Cpu className="w-3 h-3" />,
      label: 'TradingView',
      color: '#34d399',
    },
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
