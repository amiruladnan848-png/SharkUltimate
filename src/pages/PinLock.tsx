import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import sharkProBg from '@/assets/shark-pro-bg.jpg';

const CORRECT_PIN = '090909';

const PinLock: React.FC = () => {
  const navigate = useNavigate();
  const [pin, setPin]           = useState('');
  const [error, setError]       = useState(false);
  const [shake, setShake]       = useState(false);
  const [success, setSuccess]   = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked]     = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('shark_auth') === 'true') navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    if (!locked || lockTimer <= 0) return;
    timerRef.current = setInterval(() => {
      setLockTimer(t => {
        if (t <= 1) {
          setLocked(false); setAttempts(0);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [locked]);

  const verifyPin = useCallback((p: string) => {
    if (p === CORRECT_PIN) {
      setSuccess(true);
      sessionStorage.setItem('shark_auth', 'true');
      setTimeout(() => navigate('/dashboard'), 1400);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setError(true); setShake(true); setPin('');
      setTimeout(() => setShake(false), 600);
      if (next >= 5) { setLocked(true); setLockTimer(30); }
    }
  }, [attempts, navigate]);

  const handleDigit = useCallback((d: string) => {
    if (locked || success) return;
    setError(false);
    setPin(prev => {
      if (prev.length >= 6) return prev;
      const next = prev + d;
      if (next.length === 6) setTimeout(() => verifyPin(next), 80);
      return next;
    });
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
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#030812]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={sharkProBg} alt="" className="w-full h-full object-cover" style={{ opacity: 0.20 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(3,8,18,0.7) 0%,rgba(4,9,22,0.35) 50%,rgba(3,8,18,0.92) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent, rgba(3,8,18,0.85))' }} />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.05) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />

      {/* Scan line */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.55),transparent)', animation: 'scanDown 7s ease-in-out infinite' }} />
      </div>

      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
        {[300, 500, 700, 900].map((size, i) => (
          <div key={i} className="absolute rounded-full animate-ping"
            style={{ width: size, height: size, border: '1px solid rgba(0,212,255,0.04)', animationDuration: `${(i + 1) * 3}s`, animationDelay: `${i * 0.8}s` }} />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
              background: i % 4 === 0 ? 'rgba(129,140,248,0.9)' : 'rgba(0,212,255,0.8)',
              left: `${(i * 19 + 3) % 100}%`, top: `${(i * 11 + 8) % 100}%`,
              boxShadow: i % 4 === 0 ? '0 0 6px rgba(129,140,248,0.9)' : '0 0 6px rgba(0,212,255,0.9)',
              animation: `ptcl${(i % 3) + 1} ${7 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.45) % 5}s`,
            }} />
        ))}
      </div>

      {/* Card */}
      <div className={`relative z-10 w-full max-w-sm mx-4 ${shake ? 'animate-[shakeX_0.55s_ease-in-out]' : ''}`}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative mb-5">
            <div className="w-28 h-28 rounded-[2rem] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0369a1, #1d4ed8, #4f46e5)',
                boxShadow: '0 0 70px rgba(0,212,255,0.38), 0 0 140px rgba(0,212,255,0.1), 0 8px 40px rgba(0,0,0,0.8)',
              }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-white">
                <path d="M2 12C2 12 4 5.5 8.5 5.5C10.5 5.5 11.2 8 12 8C12.8 8 13.8 3.5 17.5 3.5C21 3.5 22.5 8 22.5 8L20.5 12L22.5 16C22.5 16 21 20.5 17.5 20.5C13.8 20.5 12.8 16 12 16C11.2 16 10.5 18.5 8.5 18.5C4 18.5 2 12 2 12Z" fill="currentColor" />
                <ellipse cx="18.5" cy="7.5" rx="1.2" ry="1.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-[2rem] border-2 border-cyan-400/15 animate-spin" style={{ animationDuration: '14s' }} />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-[#030812] flex items-center justify-center"
              style={{ background: '#10b981', boxShadow: '0 0 12px #10b981, 0 0 24px rgba(16,185,129,0.4)' }}>
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          <h1 className="text-5xl font-black tracking-widest leading-none mb-1">
            <span style={{ color: '#00d4ff', textShadow: '0 0 30px rgba(0,212,255,0.8)' }}>SHARK</span>
            <span style={{ color: '#1a2840' }}>—</span>
            <span style={{
              background: 'linear-gradient(90deg,#00d4ff,#a78bfa,#34d399)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'textFlow 3.5s linear infinite',
            }}>ULTIMATE</span>
          </h1>
          <p className="text-[10px] tracking-[0.4em] uppercase font-bold mb-3" style={{ color: '#1a2840' }}>
            Signal Engine v7.0 • QX Broker
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {['Bangla AI Voice', 'MTG System', 'Auto W/L', 'TV+Deriv', 'Shelter v7'].map(tag => (
              <span key={tag} className="text-[8px] px-2 py-0.5 rounded-full font-bold tracking-wider"
                style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)', color: 'rgba(0,212,255,0.7)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card body */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            border: '1px solid rgba(0,212,255,0.18)',
            background: 'rgba(5,10,22,0.97)',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 0 120px rgba(0,212,255,0.06), 0 30px 120px rgba(0,0,0,0.75)',
          }}>
          <div className="h-[2px]"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.8),rgba(167,139,250,0.5),rgba(0,212,255,0.8),transparent)' }} />

          <div className="p-8">
            <h2 className="text-center text-white font-black text-xl mb-1 tracking-wide">Secure Access</h2>
            <p className="text-center text-[10px] mb-6 tracking-[0.25em]" style={{ color: '#1e2e48' }}>Enter your 6-digit PIN</p>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-5">
              {Array(6).fill(0).map((_, i) => {
                const filled = i < pin.length;
                const isErr  = error && !pin.length;
                const isOk   = success;
                return (
                  <div key={i} className="w-4 h-4 rounded-full border-2 transition-all duration-200"
                    style={{
                      background: isOk ? '#10b981' : isErr ? '#ef4444' : filled ? '#00d4ff' : 'transparent',
                      borderColor: isOk ? '#10b981' : isErr ? '#ef4444' : filled ? '#00d4ff' : '#1a2d45',
                      transform: (isOk || filled) ? 'scale(1.25)' : 'scale(1)',
                      boxShadow: isOk ? '0 0 12px #10b981' : isErr ? '0 0 12px #ef4444' : filled ? '0 0 12px rgba(0,212,255,0.9)' : 'none',
                    }}
                  />
                );
              })}
            </div>

            {error && !locked && (
              <p className="text-center text-xs mb-4 font-bold animate-pulse" style={{ color: '#ef4444' }}>
                ✗ Incorrect PIN — {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining
              </p>
            )}
            {locked && (
              <p className="text-center text-xs mb-4 font-black" style={{ color: '#fb923c' }}>
                🔒 Too many attempts — Locked for {lockTimer}s
              </p>
            )}
            {success && (
              <p className="text-center text-sm mb-4 font-black animate-pulse" style={{ color: '#10b981', textShadow: '0 0 16px #10b981' }}>
                ✓ Access Granted — Entering Dashboard...
              </p>
            )}

            {/* Numpad */}
            <div className={`grid grid-cols-3 gap-3 ${locked ? 'opacity-20 pointer-events-none' : ''}`}>
              {buttons.map((btn, i) => {
                if (btn === '') return <div key={i} />;
                const isDel = btn === '⌫';
                return (
                  <button key={i} onClick={() => isDel ? handleDelete() : handleDigit(btn)}
                    className="h-14 rounded-2xl text-lg font-black transition-all duration-100 active:scale-90 select-none relative overflow-hidden group"
                    style={{
                      background: isDel ? 'rgba(239,68,68,0.06)' : 'rgba(0,212,255,0.04)',
                      border: isDel ? '1px solid rgba(239,68,68,0.14)' : '1px solid rgba(0,212,255,0.1)',
                      color: isDel ? '#ef4444' : '#7aabcc',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = isDel ? 'rgba(239,68,68,0.14)' : 'rgba(0,212,255,0.12)';
                      el.style.color = isDel ? '#f87171' : '#00d4ff';
                      el.style.borderColor = isDel ? 'rgba(239,68,68,0.4)' : 'rgba(0,212,255,0.4)';
                      el.style.boxShadow = isDel ? '0 0 18px rgba(239,68,68,0.12)' : '0 0 18px rgba(0,212,255,0.14)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = isDel ? 'rgba(239,68,68,0.06)' : 'rgba(0,212,255,0.04)';
                      el.style.color = isDel ? '#ef4444' : '#7aabcc';
                      el.style.borderColor = isDel ? 'rgba(239,68,68,0.14)' : 'rgba(0,212,255,0.1)';
                      el.style.boxShadow = 'none';
                    }}>
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)' }} />
          <div className="px-8 py-3 text-center text-[10px]" style={{ color: '#1a2840' }}>
            Dev: <span className="font-bold" style={{ color: '#253855' }}>Amirul_Adnan</span>
            <span className="mx-2 opacity-40">•</span>
            <span className="font-bold" style={{ color: '#253855' }}>QX Broker Signal Bot</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes textFlow {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes shakeX {
          0%,100%{transform:translateX(0);}
          15%{transform:translateX(-14px);}
          30%{transform:translateX(14px);}
          45%{transform:translateX(-9px);}
          60%{transform:translateX(9px);}
          75%{transform:translateX(-4px);}
          90%{transform:translateX(4px);}
        }
        @keyframes ptcl1{0%,100%{transform:translateY(0);opacity:0.7;}50%{transform:translateY(-30px);opacity:1;}}
        @keyframes ptcl2{0%,100%{transform:translate(0,0);opacity:0.5;}50%{transform:translate(22px,18px);opacity:1;}}
        @keyframes ptcl3{0%,100%{transform:translate(0,0);opacity:0.4;}50%{transform:translate(-18px,-22px);opacity:0.9;}}
        @keyframes scanDown{0%{top:-1px;opacity:0;}8%{opacity:1;}92%{opacity:1;}100%{top:100%;opacity:0;}}
      `}</style>
    </div>
  );
};

export default PinLock;
