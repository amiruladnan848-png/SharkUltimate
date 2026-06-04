import React, { useState, useEffect, memo } from 'react';
import { SessionType } from '@/types/trading';
import { getCurrentSession, getSessionAccuracyBoost, getSessionDetails } from '@/lib/timezone';
import { TrendingUp } from 'lucide-react';

const ALL_SESSIONS: SessionType[] = ['OVERLAP', 'LONDON', 'NEW_YORK', 'ASIAN'];

export const SessionIndicator: React.FC = memo(() => {
  const [session, setSession] = useState<SessionType>(getCurrentSession());

  useEffect(() => {
    const id = setInterval(() => setSession(getCurrentSession()), 10000);
    return () => clearInterval(id);
  }, []);

  const boost   = getSessionAccuracyBoost(session);
  const current = getSessionDetails(session);

  return (
    <div className="rounded-2xl p-4"
      style={{ border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(4,9,22,0.9)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: '#1e3070' }}>
          Trading Sessions
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full"
          style={{
            border: `1px solid ${current.color}45`,
            background: `${current.color}10`,
            color: current.color,
          }}>
          <TrendingUp className="w-2.5 h-2.5" />
          +{boost}% Active
        </div>
      </div>

      {/* Active session highlight */}
      <div className="rounded-xl p-3 mb-3"
        style={{ background: `${current.color}0d`, border: `1px solid ${current.color}38` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: current.color, boxShadow: `0 0 8px ${current.color}, 0 0 16px ${current.color}55` }} />
            <span className="font-black text-[12px]" style={{ color: current.color }}>{current.label}</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-black"
            style={{ background: `${current.color}18`, border: `1px solid ${current.color}40`, color: current.color }}>
            {current.quality}
          </span>
        </div>
        <div className="text-[9px] mt-1.5" style={{ color: '#2a4060' }}>{current.utcRange}</div>
        <div className="text-[9px] mt-0.5" style={{ color: '#2a4870' }}>{current.description}</div>
      </div>

      {/* All sessions grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {ALL_SESSIONS.map(s => {
          const info   = getSessionDetails(s);
          const active = s === session;
          const sBoost = getSessionAccuracyBoost(s);
          return (
            <div key={s} className="rounded-xl px-2.5 py-2 transition-all duration-300"
              style={{
                border: active ? `1px solid ${info.color}40` : '1px solid rgba(255,255,255,0.04)',
                background: active ? `${info.color}0a` : 'rgba(255,255,255,0.015)',
              }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: active ? info.color : '#1e3070',
                    boxShadow: active ? `0 0 5px ${info.color}` : 'none',
                  }}
                />
                <span className="text-[10px] font-bold leading-tight"
                  style={{ color: active ? info.color : '#2a4060' }}>
                  {info.label.split(' ')[0]}
                </span>
              </div>
              <div className="text-[9px] font-black" style={{ color: active ? info.color : '#1a2840' }}>
                +{sBoost}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SessionIndicator.displayName = 'SessionIndicator';
export default SessionIndicator;
