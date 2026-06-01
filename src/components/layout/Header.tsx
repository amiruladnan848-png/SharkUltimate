import React, { memo } from 'react';
import { LiveClock } from '@/components/features/LiveClock';

export const Header: React.FC = memo(() => {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/10 bg-[#050814]/92 backdrop-blur-2xl">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <div
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(0,212,255,0.35), 0 4px 12px rgba(0,0,0,0.4)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
                <path d="M2 12C2 12 4 5.5 8.5 5.5C10.5 5.5 11.2 8 12 8C12.8 8 13.8 3.5 17.5 3.5C21 3.5 22.5 8 22.5 8L20.5 12L22.5 16C22.5 16 21 20.5 17.5 20.5C13.8 20.5 12.8 16 12 16C11.2 16 10.5 18.5 8.5 18.5C4 18.5 2 12 2 12Z" fill="currentColor" />
                <ellipse cx="18.5" cy="7.5" rx="1.2" ry="1.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050814] animate-pulse" style={{ boxShadow: '0 0 6px #10b981' }} />
          </div>
          <div>
            <div className="font-black text-[22px] tracking-widest leading-none">
              <span className="text-cyan-400" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>SHARK</span>
              <span className="text-gray-400">-</span>
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">ULTIMATE</span>
            </div>
            <div className="text-[9px] text-gray-600 tracking-[0.25em] uppercase mt-0.5">Binary Signal Engine v3.0</div>
          </div>
        </div>

        {/* Center badges */}
        <div className="hidden lg:flex items-center gap-2">
          {[
            { label: 'Real Forex', color: 'cyan', dot: true },
            { label: 'Volatility', color: 'orange', dot: true },
            { label: 'Tradowix.com', color: 'purple', dot: false },
          ].map(b => (
            <div
              key={b.label}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border border-${b.color}-500/25 bg-${b.color}-500/8 text-${b.color}-400`}
            >
              {b.dot && <div className={`w-1.5 h-1.5 rounded-full bg-${b.color}-400 animate-pulse`} />}
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
