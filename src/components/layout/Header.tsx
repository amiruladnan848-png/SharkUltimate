import React, { memo } from 'react';
import { LiveClock } from '@/components/features/LiveClock';

export const Header: React.FC = memo(() => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#060c1a]/95 backdrop-blur-2xl">
      {/* Top shimmer line */}
      <div className="h-px w-full" style={{
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6) 30%, rgba(56,189,248,0.8) 50%, rgba(0,212,255,0.6) 70%, transparent)',
        boxShadow: '0 0 12px rgba(0,212,255,0.3)',
      }} />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                boxShadow: '0 0 20px rgba(14,165,233,0.4), 0 4px 12px rgba(0,0,0,0.5)',
              }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                <path d="M2 12C2 12 4 5.5 8.5 5.5C10.5 5.5 11.2 8 12 8C12.8 8 13.8 3.5 17.5 3.5C21 3.5 22.5 8 22.5 8L20.5 12L22.5 16C22.5 16 21 20.5 17.5 20.5C13.8 20.5 12.8 16 12 16C11.2 16 10.5 18.5 8.5 18.5C4 18.5 2 12 2 12Z" fill="currentColor" />
                <ellipse cx="18.5" cy="7.5" rx="1" ry="1.3" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#060c1a] animate-pulse"
              style={{ boxShadow: '0 0 5px #10b981' }} />
          </div>
          <div>
            <div className="font-black text-xl tracking-widest leading-none">
              <span style={{ color: '#38bdf8', textShadow: '0 0 10px rgba(56,189,248,0.5)' }}>SHARK</span>
              <span className="text-[#1e3a5f]">—</span>
              <span style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ULTIMATE</span>
            </div>
            <div className="text-[8px] text-[#1e3a5f] tracking-[0.3em] uppercase mt-0.5 font-semibold">Binary Signal Engine v4.0</div>
          </div>
        </div>

        {/* Center status */}
        <div className="hidden lg:flex items-center gap-2">
          {[
            { label: 'Real Forex', color: '#38bdf8' },
            { label: 'Volatility', color: '#fb923c' },
            { label: 'TradingView Live', color: '#a78bfa' },
            { label: 'Tradowix.com', color: '#34d399' },
          ].map(b => (
            <div key={b.label}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold"
              style={{ border: `1px solid ${b.color}25`, background: `${b.color}10`, color: b.color }}>
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
