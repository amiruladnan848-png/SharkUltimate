import React, { useState, useEffect, memo } from 'react';
import { getBangladeshTimeString, getBangladeshDateString } from '@/lib/timezone';

export const LiveClock: React.FC = memo(() => {
  const [time, setTime] = useState(getBangladeshTimeString());
  const [date, setDate] = useState(getBangladeshDateString());
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getBangladeshTimeString());
      setDate(getBangladeshDateString());
      setTick(t => !t);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end select-none">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 5px #10b981' }} />
        <div className="font-mono font-black text-sm tabular-nums" style={{ color: '#38bdf8', textShadow: '0 0 8px rgba(56,189,248,0.5)', letterSpacing: '0.05em' }}>
          {time}
        </div>
      </div>
      <div className="text-[9px] text-[#1e3358] font-semibold tracking-wider">
        BD • UTC+6
      </div>
    </div>
  );
});

LiveClock.displayName = 'LiveClock';
export default LiveClock;
