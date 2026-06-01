import React, { memo } from 'react';
import { ConnectionStatus } from '@/types/trading';
import { Wifi, WifiOff, Zap, Shield, Radio } from 'lucide-react';

interface StatsBarProps {
  connectionStatus: ConnectionStatus;
  dataPoints: number;
}

export const StatsBar: React.FC<StatsBarProps> = memo(({ connectionStatus, dataPoints }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Connection badge */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
        connectionStatus.connected
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      }`}>
        {connectionStatus.connected
          ? <><Wifi className="w-3 h-3" /> <span>Deriv Live</span></>
          : <><WifiOff className="w-3 h-3" /> <span>Reconnecting</span></>}
        {connectionStatus.latency !== undefined && connectionStatus.connected && (
          <span className={`ml-1 text-[10px] ${connectionStatus.latency < 100 ? 'text-emerald-300' : 'text-yellow-400'}`}>
            {connectionStatus.latency}ms
          </span>
        )}
      </div>

      {/* Data feed */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-cyan-500/25 bg-cyan-500/8 text-cyan-400">
        <Radio className="w-3 h-3 animate-pulse" />
        <span>{dataPoints} ticks</span>
      </div>

      {/* Engine status */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-purple-500/25 bg-purple-500/8 text-purple-400">
        <Zap className="w-3 h-3" />
        <span>SHARK Engine</span>
      </div>

      {/* Never-drop engine */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-500/25 bg-blue-500/8 text-blue-400">
        <Shield className="w-3 h-3" />
        <span>Never Drop</span>
      </div>
    </div>
  );
});

StatsBar.displayName = 'StatsBar';
export default StatsBar;
