import React from 'react';
import { Signal } from '@/types/trading';
import { TrendingUp, TrendingDown, Check, X, Clock } from 'lucide-react';

interface SignalHistoryProps {
  signals: Signal[];
  winRate: number;
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

export const SignalHistory: React.FC<SignalHistoryProps> = ({ signals, winRate }) => {
  const wins = signals.filter(s => s.status === 'WIN').length;
  const losses = signals.filter(s => s.status === 'LOSS').length;
  const pending = signals.filter(s => s.status === 'PENDING').length;

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-[#0a0f1e]/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Signal History</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400 font-bold">{wins}W</span>
          <span className="text-gray-600">/</span>
          <span className="text-red-400 font-bold">{losses}L</span>
          {pending > 0 && <><span className="text-gray-600">/</span><span className="text-yellow-400 font-bold">{pending}P</span></>}
        </div>
      </div>

      {/* Win Rate Bar */}
      {signals.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-700/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Win Rate</span>
            <span className="text-xs font-bold text-cyan-400">{winRate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-700/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${winRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Signal List */}
      <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {signals.length === 0 ? (
          <div className="p-6 text-center text-gray-600 text-sm">No signals yet</div>
        ) : (
          signals.map((signal, i) => {
            const isCall = signal.direction === 'CALL';
            return (
              <div
                key={signal.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-700/20 transition-colors hover:bg-gray-700/10 ${i === 0 ? 'bg-gray-800/20' : ''}`}
              >
                {/* Direction Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCall ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {isCall ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-bold">{signal.pair.symbol}</span>
                    <span className={`text-[10px] font-bold ${isCall ? 'text-emerald-400' : 'text-red-400'}`}>
                      {signal.direction}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-auto">{signal.accuracy}%</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(signal.entryTime)} → {formatTime(signal.expiryTime)}
                  </div>
                </div>

                {/* Status */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  signal.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' :
                  signal.status === 'LOSS' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {signal.status === 'WIN' ? <Check className="w-3.5 h-3.5" /> :
                   signal.status === 'LOSS' ? <X className="w-3.5 h-3.5" /> :
                   <Clock className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SignalHistory;
