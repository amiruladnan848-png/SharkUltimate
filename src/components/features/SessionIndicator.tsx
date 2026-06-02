import React, { useState, useEffect, memo } from 'react';
import { SessionType } from '@/types/trading';
import { getCurrentSession, getSessionAccuracyBoost } from '@/lib/timezone';

interface SInfo {
  key: SessionType;
  label: string;
  utcRange: string;
  color: string;
  bg: string;
  border: string;
  boost: number;
  quality: string;
}

const SESSIONS: SInfo[] = [
  { key: 'OVERLAP',  label: 'LDN+NY Overlap', utcRange: '12:00–16:00 UTC', color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.4)',  boost: 18, quality: 'PRIME' },
  { key: 'LONDON',   label: 'London',          utcRange: '07:00–12:00 UTC', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.4)',  boost: 14, quality: 'HIGH'  },
  { key: 'NEW_YORK', label: 'New York',         utcRange: '16:00–21:00 UTC', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.4)', boost: 12, quality: 'HIGH'  },
  { key: 'ASIAN',    label: 'Asian',            utcRange: '21:00–07:00 UTC', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.4)',  boost: 8,  quality: 'MED'   },
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
    <div className="rounded-2xl border border-[#1a2540]/80 bg-[#070d1a]/80 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black text-[#2a4060] tracking-[0.2em] uppercase">Trading Sessions</h3>
        <div className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ border: `1px solid ${current?.border ?? '#333'}`, background: current?.bg ?? 'transparent', color: current?.color ?? '#888' }}>
          +{boost}% Boost Active
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SESSIONS.map(s => {
          const active = s.key === session;
          return (
            <div key={s.key}
              className="rounded-xl p-2.5 transition-all duration-300"
              style={{
                border: `1px solid ${active ? s.border : 'rgba(255,255,255,0.04)'}`,
                background: active ? s.bg : 'rgba(255,255,255,0.02)',
              }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: active ? s.color : '#1e3a5f', boxShadow: active ? `0 0 4px ${s.color}` : 'none', animation: active ? 'pulse 1.5s infinite' : 'none' }} />
                <span className="text-[11px] font-bold" style={{ color: active ? s.color : '#2a4060' }}>{s.label}</span>
                {active && (
                  <span className="text-[8px] px-1.5 rounded font-black ml-auto"
                    style={{ border: `1px solid ${s.border}`, background: s.bg, color: s.color }}>{s.quality}</span>
                )}
              </div>
              <div className="text-[9px]" style={{ color: active ? '#6b8090' : '#1e3a5f' }}>{s.utcRange}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: active ? s.color : '#1e3a5f' }}>+{s.boost}% accuracy</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SessionIndicator.displayName = 'SessionIndicator';
export default SessionIndicator;
