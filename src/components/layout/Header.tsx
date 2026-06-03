import React, { memo } from 'react';
import { LiveClock } from '@/components/features/LiveClock';

export const Header: React.FC = memo(() => {
  return (
    <header className="sticky top-0 z-50 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(5,9,20,0.97)', backdropFilter: 'blur(24px)' }}>
      {/* Top scan line */}
      <div className="h-[2px] w-full" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.3) 20%, rgba(0,212,255,0.9) 50%, rgba(0,212,255,0.3) 80%, transparent 100%)',
        boxShadow: '0 0 16px rgba(0,212,255,0.35)',
      }} />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0369a1, #1d4ed8, #4338ca)',
                boxShadow: '0 0 24px rgba(0,212,255,0.35), 0 4px 16px rgba(0,0,0,0.6)',
              }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
                <path d="M2 12C2 12 4 5.5 8.5 5.5C10.5 5.5 11.2 8 12 8C12.8 8 13.8 3.5 17.5 3.5C21 3.5 22.5 8 22.5 8L20.5 12L22.5 16C22.5 16 21 20.5 17.5 20.5C13.8 20.5 12.8 16 12 16C11.2 16 10.5 18.5 8.5 18.5C4 18.5 2 12 2 12Z" fill="currentColor" />
                <ellipse cx="18.5" cy="7.5" rx="1.1" ry="1.4" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-xl border border-cyan-400/20 animate-spin" style={{ animationDuration: '12s' }} />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#050912] animate-pulse"
              style={{ boxShadow: '0 0 8px #10b981' }} />
          </div>
          <div>
            <div className="font-black text-xl tracking-widest leading-none flex items-center gap-1">
              <span style={{ color: '#00d4ff', textShadow: '0 0 12px rgba(0,212,255,0.55)' }}>SHARK</span>
              <span style={{ color: '#1e3050' }}>—</span>
              <span style={{ background: 'linear-gradient(90deg, #00d4ff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ULTIMATE</span>
            </div>
            <div className="text-[8px] tracking-[0.3em] uppercase mt-0.5 font-semibold" style={{ color: '#1e3050' }}>Binary Signal Engine v5.0</div>
          </div>
        </div>

        {/* Center status badges */}
        <div className="hidden lg:flex items-center gap-2">
          {[
            { label: 'Real Forex Only', color: '#00d4ff' },
            { label: 'TradingView Live', color: '#818cf8' },
            { label: 'Deriv WebSocket', color: '#34d399' },
            { label: 'Tradowix.com', color: '#10b981' },
            { label: 'Bangla AI Voice', color: '#f472b6' },
            { label: 'Auto Win/Loss', color: '#fbbf24' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-semibold"
              style={{ border: `1px solid ${b.color}22`, background: `${b.color}0d`, color: b.color }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: b.color }} />
              {b.label}
            </div>
          ))}
        </div>

        {/* Clock */}
        <LiveClock />
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
