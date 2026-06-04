import React, { memo } from 'react';
import { LiveClock } from '@/components/features/LiveClock';
import { Activity } from 'lucide-react';

export const Header: React.FC = memo(() => {
  return (
    <header className="sticky top-0 z-50"
      style={{ background: 'rgba(3,8,20,0.99)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(0,212,255,0.07)' }}>

      {/* Top accent bar */}
      <div className="h-[3px] w-full" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.4) 10%, #00d4ff 35%, rgba(100,220,255,0.9) 50%, #00d4ff 65%, rgba(0,212,255,0.4) 90%, transparent 100%)',
        boxShadow: '0 0 24px rgba(0,212,255,0.65), 0 2px 40px rgba(0,212,255,0.18)',
      }} />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0284c7, #1d4ed8, #4f46e5)',
                boxShadow: '0 0 30px rgba(0,212,255,0.5), 0 0 70px rgba(0,212,255,0.15), 0 4px 20px rgba(0,0,0,0.7)',
              }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white">
                <path d="M2 12C2 12 4 5.5 8.5 5.5C10.5 5.5 11.2 8 12 8C12.8 8 13.8 3.5 17.5 3.5C21 3.5 22.5 8 22.5 8L20.5 12L22.5 16C22.5 16 21 20.5 17.5 20.5C13.8 20.5 12.8 16 12 16C11.2 16 10.5 18.5 8.5 18.5C4 18.5 2 12 2 12Z" fill="currentColor" />
                <ellipse cx="18.5" cy="7.5" rx="1.1" ry="1.4" fill="white" opacity="0.95" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-[14px] border border-cyan-400/20 animate-spin" style={{ animationDuration: '12s' }} />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
              style={{ background: '#10b981', borderColor: 'rgba(4,9,22,0)', boxShadow: '0 0 12px #10b981, 0 0 24px rgba(16,185,129,0.4)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div>
            <div className="font-black text-2xl tracking-widest leading-none flex items-center gap-1">
              <span style={{ color: '#00e5ff', textShadow: '0 0 20px rgba(0,229,255,0.8), 0 0 50px rgba(0,212,255,0.3)' }}>SHARK</span>
              <span style={{ color: '#1a2e50', margin: '0 3px' }}>—</span>
              <span style={{
                background: 'linear-gradient(90deg,#00e5ff,#a78bfa,#34d399,#00e5ff)',
                backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'textFlow 4s linear infinite',
              }}>ULTIMATE</span>
            </div>
            <div className="text-[8px] tracking-[0.35em] uppercase mt-0.5 font-bold" style={{ color: '#1a3060' }}>
              Signal Engine v7.0 • QX Broker
            </div>
          </div>
        </div>

        {/* Center status badges */}
        <div className="hidden lg:flex items-center gap-1">
          {[
            { label: 'QX Broker',     color: '#a78bfa' },
            { label: 'Real Forex',    color: '#00e5ff' },
            { label: 'TV Live Chart', color: '#38bdf8' },
            { label: 'Deriv WebSocket', color: '#34d399' },
            { label: 'Bangla Voice',  color: '#f472b6' },
            { label: 'Auto W/L',      color: '#fbbf24' },
            { label: '1-Step MTG',    color: '#fb923c' },
            { label: 'Shelter v7.0',  color: '#4ade80' },
          ].map(b => (
            <div key={b.label}
              className="flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-full font-semibold"
              style={{ border: `1px solid ${b.color}28`, background: `${b.color}0c`, color: b.color }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: b.color, boxShadow: `0 0 4px ${b.color}` }} />
              {b.label}
            </div>
          ))}
        </div>

        {/* Right: Live badge + Clock */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>
            <Activity className="w-3 h-3 animate-pulse" />
            LIVE
          </div>
          <LiveClock />
        </div>
      </div>

      <style>{`
        @keyframes textFlow {
          0%   { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
      `}</style>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
