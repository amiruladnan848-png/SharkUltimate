import React, { useState, useEffect, memo } from 'react';
import { getBangladeshTimeString, getBangladeshDateString, getCurrentSession } from '@/lib/timezone';
import { SessionType } from '@/types/trading';

const SESSION_STYLES: Record<SessionType, { color: string; label: string }> = {
  OVERLAP:  { color: 'text-emerald-400', label: '🟢 LON+NY Overlap' },
  LONDON:   { color: 'text-blue-400',    label: '🔵 London Session' },
  NEW_YORK: { color: 'text-cyan-400',    label: '🔵 New York Session' },
  ASIAN:    { color: 'text-yellow-400',  label: '🟡 Asian Session' },
  OFF:      { color: 'text-gray-400',    label: '⚫ Market Off-Hours' },
};

export const LiveClock: React.FC = memo(() => {
  const [time, setTime] = useState(getBangladeshTimeString());
  const [date, setDate] = useState(getBangladeshDateString());
  const [session, setSession] = useState<SessionType>(getCurrentSession());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getBangladeshTimeString());
      setDate(getBangladeshDateString());
      setSession(getCurrentSession());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const style = SESSION_STYLES[session];

  return (
    <div className="flex flex-col items-end">
      <div className="text-right">
        <div className="text-xl font-mono font-black text-cyan-400 tracking-widest tabular-nums" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
          {time}
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">Bangladesh BST (UTC+6)</div>
        <div className="text-[10px] text-gray-600">{date}</div>
      </div>
      <div className={`mt-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border border-current/25 bg-current/8 ${style.color}`}>
        {style.label}
      </div>
    </div>
  );
});

LiveClock.displayName = 'LiveClock';
export default LiveClock;
