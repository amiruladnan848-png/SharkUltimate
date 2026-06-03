import React, { useState, useEffect, memo } from 'react';
import { getBangladeshTimeString, getBangladeshDateString } from '@/lib/timezone';

export const LiveClock: React.FC = memo(() => {
  const [time, setTime] = useState(getBangladeshTimeString());
  const [date, setDate] = useState(getBangladeshDateString());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getBangladeshTimeString());
      setDate(getBangladeshDateString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end select-none">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
          style={{ boxShadow: '0 0 7px rgba(52,211,153,0.9), 0 0 14px rgba(52,211,153,0.4)' }} />
        <div className="font-mono font-black text-sm tabular-nums"
          style={{ color: '#00e5ff', textShadow: '0 0 12px rgba(0,229,255,0.65)', letterSpacing: '0.06em' }}>
          {time}
        </div>
      </div>
      <div className="text-[9px] font-semibold tracking-wider" style={{ color: '#1e3870' }}>
        BD • UTC+6
      </div>
    </div>
  );
});

LiveClock.displayName = 'LiveClock';
export default LiveClock;
