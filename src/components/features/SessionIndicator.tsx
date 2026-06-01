import React, { useState, useEffect, memo } from 'react';
import { SessionType } from '@/types/trading';
import { getCurrentSession, getSessionAccuracyBoost } from '@/lib/timezone';

interface SessionInfo {
  key: SessionType;
  label: string;
  utcRange: string;
  color: string;
  bgColor: string;
  borderColor: string;
  boost: number;
  quality: string;
}

const SESSIONS: SessionInfo[] = [
  { key: 'OVERLAP', label: 'LON+NY Overlap', utcRange: '12:00–16:00 UTC', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', borderColor: 'border-emerald-500/50', boost: 18, quality: 'BEST' },
  { key: 'LONDON', label: 'London', utcRange: '07:00–12:00 UTC', color: 'text-blue-400', bgColor: 'bg-blue-500/15', borderColor: 'border-blue-500/50', boost: 14, quality: 'HIGH' },
  { key: 'NEW_YORK', label: 'New York', utcRange: '16:00–21:00 UTC', color: 'text-cyan-400', bgColor: 'bg-cyan-500/15', borderColor: 'border-cyan-500/50', boost: 12, quality: 'HIGH' },
  { key: 'ASIAN', label: 'Asian', utcRange: '21:00–07:00 UTC', color: 'text-yellow-400', bgColor: 'bg-yellow-500/15', borderColor: 'border-yellow-500/50', boost: 8, quality: 'MEDIUM' },
];

export const SessionIndicator: React.FC = memo(() => {
  const [session, setSession] = useState<SessionType>(getCurrentSession());

  useEffect(() => {
    const id = setInterval(() => setSession(getCurrentSession()), 15000);
    return () => clearInterval(id);
  }, []);

  const boost = getSessionAccuracyBoost(session);
  const current = SESSIONS.find(s => s.key === session);

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-[#0a0f1e]/85 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Trading Sessions</h3>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${current?.bgColor ?? ''} ${current?.color ?? 'text-gray-400'} ${current?.borderColor ?? 'border-gray-700'}`}>
          +{boost}% Accuracy Boost
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SESSIONS.map(s => {
          const active = s.key === session;
          return (
            <div
              key={s.key}
              className={`rounded-xl p-2.5 border transition-all duration-300 ${
                active ? `${s.bgColor} ${s.borderColor} shadow-sm` : 'border-gray-700/25 bg-gray-800/15'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${active ? s.color.replace('text-', 'bg-') + ' animate-pulse' : 'bg-gray-600'}`} />
                <span className={`text-[11px] font-bold ${active ? s.color : 'text-gray-500'}`}>{s.label}</span>
                {active && (
                  <span className={`text-[8px] px-1.5 rounded font-black ml-auto ${s.bgColor} ${s.color} border ${s.borderColor}`}>
                    {s.quality}
                  </span>
                )}
              </div>
              <div className={`text-[9px] ${active ? 'text-gray-400' : 'text-gray-600'}`}>{s.utcRange}</div>
              <div className={`text-[10px] font-semibold mt-0.5 ${active ? s.color : 'text-gray-600'}`}>+{s.boost}% boost</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SessionIndicator.displayName = 'SessionIndicator';
export default SessionIndicator;
