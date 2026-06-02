import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import sharkBg from '@/assets/shark-bg.jpg';

const CORRECT_PIN = '090909';

const PinLock: React.FC = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('shark_auth') === 'true') navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    if (!locked || lockTimer <= 0) return;
    timerRef.current = setInterval(() => {
      setLockTimer(t => {
        if (t <= 1) { setLocked(false); setAttempts(0); if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [locked, lockTimer]);

  const verifyPin = useCallback((p: string) => {
    if (p === CORRECT_PIN) {
      setSuccess(true);
      sessionStorage.setItem('shark_auth', 'true');
      setTimeout(() => navigate('/dashboard'), 1400);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setError(true);
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 600);
      if (next >= 5) { setLocked(true); setLockTimer(30); }
    }
  }, [attempts, navigate]);

  const handleDigit = useCallback((d: string) => {
    if (locked || success) return;
    setPin(prev => {
      if (prev.length >= 6) return prev;
      const next = prev + d;
      if (next.length === 6) setTimeout(() => verifyPin(next), 80);
      return next;
    });
    setError(false);
  }, [locked, success, verifyPin]);

  const handleDelete = useCallback(() => {
    if (locked || success) return;
    setPin(p => p.slice(0, -1));
    setError(false);
  }, [locked, success]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === 'Backspace' || e.key === 'Delete') handleDelete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDigit, handleDelete]);

  const buttons = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#060c1a]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={sharkBg} alt="" className="w-full h-full object-cover" style={{ opacity: 0.2 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,12,26,0.6) 0%, rgba(6,12,26,0.35) 50%, rgba(6,12,26,0.88) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(6,12,26,0.75) 0%, transparent 35%, transparent 65%, rgba(6,12,26,0.75) 100%)' }} />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
        {[300, 480, 660, 840].map((size, i) => (
          <div key={i} className="absolute rounded-full animate-ping"
            style={{
              width: size, height: size,
              border: '1px solid rgba(56,189,248,0.06)',
              animationDuration: `${(i + 1) * 2.8}s`,
              animationDelay: `${i * 0.7}s`,
            }} />
        ))}
      </div>

      {/* Particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }, (_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: 2, height: 2,
              background: 'rgba(56,189,248,0.7)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: '0 0 4px rgba(56,189,248,0.9)',
              animation: `particle${(i % 3) + 1} ${7 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className={`relative z-10 w-full max-w-sm mx-4 transition-all duration-300 ${shake ? 'animate-[shakeX_0.5s_ease-in-out]' : ''}`}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #2563eb, #4f46e5)',
                boxShadow: '0 0 50px rgba(14,165,233,0.4), 0 0 100px rgba(14,165,233,0.15), 0 8px 32px rgba(0,0,0,0.5)',
              }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14 text-white">
                <path d="M2 12C2 12 4 5.5 8.5 5.5C10.5 5.5 11.2 8 12 8C12.8 8 13.8 3.5 17.5 3.5C21 3.5 22.5 8 22.5 8L20.5 12L22.5 16C22.5 16 21 20.5 17.5 20.5C13.8 20.5 12.8 16 12 16C11.2 16 10.5 18.5 8.5 18.5C4 18.5 2 12 2 12Z" fill="currentColor" />
                <ellipse cx="18.5" cy="7.5" rx="1.2" ry="1.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-sky-400/20 animate-spin" style={{ animationDuration: '10s' }} />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#060c1a]"
              style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          </div>

          <h1 className="text-5xl font-black tracking-widest leading-none">
            <span style={{ color: '#38bdf8', textShadow: '0 0 24px rgba(56,189,248,0.7)' }}>SHARK</span>
            <span style={{ color: '#1e3a5f' }}>—</span>
            <span style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ULTIMATE</span>
          </h1>
          <p className="text-[10px] mt-2 tracking-[0.4em] uppercase font-semibold" style={{ color: '#1e3a5f' }}>
            Binary Signal Engine v4.0
          </p>
        </div>

        {/* Card body */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            border: '1px solid rgba(56,189,248,0.18)',
            background: 'rgba(8,14,30,0.95)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 0 80px rgba(56,189,248,0.07), 0 24px 80px rgba(0,0,0,0.6)',
          }}>
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.65), transparent)' }} />

          <div className="p-8">
            <h2 className="text-center text-white font-bold text-lg mb-1">Secure Access</h2>
            <p className="text-center text-[10px] mb-6 tracking-wider" style={{ color: '#2a4060' }}>Enter your 6-digit PIN</p>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-5">
              {Array(6).fill(0).map((_, i) => (
                <div key={i}
                  className="w-4 h-4 rounded-full border-2 transition-all duration-200"
                  style={{
                    background: success ? '#10b981' : (error && !pin.length) ? '#ef4444' : i < pin.length ? '#38bdf8' : 'transparent',
                    borderColor: success ? '#10b981' : (error && !pin.length) ? '#ef4444' : i < pin.length ? '#38bdf8' : '#1e3a5f',
                    transform: (success || i < pin.length) ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: success ? '0 0 8px #10b981' : (error && !pin.length) ? '0 0 8px #ef4444' : i < pin.length ? '0 0 8px rgba(56,189,248,0.8)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Status messages */}
            {error && !locked && (
              <p className="text-center text-xs mb-4 font-semibold animate-pulse" style={{ color: '#ef4444' }}>
                ✗ Incorrect PIN — {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} left
              </p>
            )}
            {locked && (
              <p className="text-center text-xs mb-4 font-bold" style={{ color: '#fb923c' }}>
                🔒 Too many attempts — Locked for {lockTimer}s
              </p>
            )}
            {success && (
              <p className="text-center text-sm mb-4 font-black animate-pulse" style={{ color: '#10b981', textShadow: '0 0 12px #10b981' }}>
                ✓ Access Granted — Entering Dashboard...
              </p>
            )}

            {/* Numpad */}
            <div className={`grid grid-cols-3 gap-3 ${locked ? 'opacity-25 pointer-events-none' : ''}`}>
              {buttons.map((btn, i) => {
                if (btn === '') return <div key={i} />;
                const isDel = btn === '⌫';
                return (
                  <button
                    key={i}
                    onClick={() => isDel ? handleDelete() : handleDigit(btn)}
                    className="h-14 rounded-2xl text-lg font-bold transition-all duration-100 active:scale-90 select-none"
                    style={{
                      background: isDel ? 'rgba(239,68,68,0.08)' : 'rgba(56,189,248,0.05)',
                      border: isDel ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(56,189,248,0.12)',
                      color: isDel ? '#ef4444' : '#94a3b8',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = isDel ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.12)';
                      el.style.color = isDel ? '#f87171' : '#38bdf8';
                      el.style.borderColor = isDel ? 'rgba(239,68,68,0.35)' : 'rgba(56,189,248,0.35)';
                      el.style.boxShadow = isDel ? '0 0 12px rgba(239,68,68,0.12)' : '0 0 12px rgba(56,189,248,0.12)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = isDel ? 'rgba(239,68,68,0.08)' : 'rgba(56,189,248,0.05)';
                      el.style.color = isDel ? '#ef4444' : '#94a3b8';
                      el.style.borderColor = isDel ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.12)';
                      el.style.boxShadow = 'none';
                    }}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
          <div className="px-8 py-3 text-center text-[10px]" style={{ color: '#1e3358' }}>
            Dev: <span className="font-semibold" style={{ color: '#2a5080' }}>Amirul_Adnan</span>
            <span className="mx-2" style={{ color: '#0f1e30' }}>•</span>
            <span className="font-semibold" style={{ color: '#2a5080' }}>Tradowix.com</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shakeX {
          0%,100% { transform:translateX(0); }
          15%      { transform:translateX(-10px); }
          30%      { transform:translateX(10px); }
          45%      { transform:translateX(-7px); }
          60%      { transform:translateX(7px); }
          75%      { transform:translateX(-4px); }
          90%      { transform:translateX(4px); }
        }
        @keyframes particle1 { 0%,100%{transform:translateY(0);opacity:0.6;} 50%{transform:translateY(-25px);opacity:1;} }
        @keyframes particle2 { 0%,100%{transform:translate(0,0);opacity:0.4;} 50%{transform:translate(18px,15px);opacity:0.9;} }
        @keyframes particle3 { 0%,100%{transform:translate(0,0);opacity:0.5;} 50%{transform:translate(-12px,-18px);opacity:0.8;} }
      `}</style>
    </div>
  );
};

export default PinLock;
