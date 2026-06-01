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
        if (t <= 1) {
          setLocked(false);
          setAttempts(0);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
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

  // Keyboard support
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
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050814]">
      {/* Shark background */}
      <div className="absolute inset-0 z-0">
        <img src={sharkBg} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/50 via-[#050814]/30 to-[#050814]/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050814]/80 via-transparent to-[#050814]/80" />
      </div>

      {/* Grid dots */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Animated pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
        {[280, 460, 640].map((size, i) => (
          <div key={i} className="absolute rounded-full border border-cyan-500/8 animate-ping"
            style={{ width: size, height: size, animationDuration: `${(i + 1) * 2.5}s`, animationDelay: `${i * 0.8}s` }} />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i}
            className="absolute w-px h-px rounded-full bg-cyan-400/60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float${(i % 2) + 1} ${8 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              boxShadow: '0 0 4px rgba(0,212,255,0.8)',
            }}
          />
        ))}
      </div>

      {/* PIN Card */}
      <div className={`relative z-10 w-full max-w-sm mx-4 transition-transform duration-300 ${shake ? 'animate-[shakeX_0.5s_ease-in-out]' : ''}`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(0,212,255,0.45), 0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14 text-white">
                <path d="M2 12C2 12 4 5.5 8.5 5.5C10.5 5.5 11.2 8 12 8C12.8 8 13.8 3.5 17.5 3.5C21 3.5 22.5 8 22.5 8L20.5 12L22.5 16C22.5 16 21 20.5 17.5 20.5C13.8 20.5 12.8 16 12 16C11.2 16 10.5 18.5 8.5 18.5C4 18.5 2 12 2 12Z" fill="currentColor" />
                <ellipse cx="18.5" cy="7.5" rx="1.2" ry="1.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            {/* Rotating border effect */}
            <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/30 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <h1 className="text-4xl font-black tracking-widest">
            <span className="text-cyan-400" style={{ textShadow: '0 0 20px rgba(0,212,255,0.6)' }}>SHARK</span>
            <span className="text-gray-500">-</span>
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">ULTIMATE</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1.5 tracking-[0.3em] uppercase">Signal Engine v3.0</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-cyan-500/20 bg-[#090d1a]/92 backdrop-blur-2xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 20px 60px rgba(0,0,0,0.6)' }}>
          {/* Top gradient line */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

          <div className="p-8">
            <h2 className="text-center text-white font-bold text-lg mb-1">Secure Access</h2>
            <p className="text-center text-gray-500 text-sm mb-6">Enter your 6-digit PIN</p>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-5">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  success ? 'bg-emerald-400 border-emerald-400 scale-110' :
                  error && pin.length === 0 ? 'bg-red-400 border-red-400' :
                  i < pin.length ? 'bg-cyan-400 border-cyan-400 scale-110' :
                  'border-gray-600 bg-transparent'
                }`}
                  style={{
                    boxShadow: success ? '0 0 8px #10b981' :
                      (error && pin.length === 0) ? '0 0 8px #ef4444' :
                      i < pin.length ? '0 0 8px rgba(0,212,255,0.8)' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Messages */}
            {error && !locked && (
              <p className="text-center text-red-400 text-xs mb-4 font-semibold animate-pulse">
                ✗ Incorrect PIN — {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining
              </p>
            )}
            {locked && (
              <p className="text-center text-orange-400 text-xs mb-4 font-bold">
                🔒 Too many attempts — Locked for {lockTimer}s
              </p>
            )}
            {success && (
              <p className="text-center text-emerald-400 text-sm mb-4 font-black animate-pulse" style={{ textShadow: '0 0 10px #10b981' }}>
                ✓ Access Granted — Entering Dashboard...
              </p>
            )}

            {/* Number pad */}
            <div className={`grid grid-cols-3 gap-3 ${locked ? 'opacity-30 pointer-events-none' : ''}`}>
              {buttons.map((btn, i) => {
                if (btn === '') return <div key={i} />;
                const isDelete = btn === '⌫';
                return (
                  <button
                    key={i}
                    onClick={() => isDelete ? handleDelete() : handleDigit(btn)}
                    className={`h-14 rounded-2xl text-lg font-bold transition-all duration-100 active:scale-90 select-none ${
                      isDelete
                        ? 'border border-gray-600/50 bg-gray-700/25 text-gray-400 hover:bg-red-900/30 hover:border-red-500/30 hover:text-red-400'
                        : 'border border-cyan-500/15 bg-[#0d1628]/80 text-white hover:bg-cyan-500/15 hover:border-cyan-400/50 hover:shadow-md hover:shadow-cyan-500/15 hover:text-cyan-300 active:bg-cyan-500/25'
                    }`}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-700/30 to-transparent" />
          <div className="px-8 py-3 text-center text-[10px] text-gray-600">
            Dev: <span className="text-cyan-700 font-semibold">Amirul_Adnan</span>
            <span className="mx-2 text-gray-700">•</span>
            Platform: <span className="text-cyan-700 font-semibold">Tradowix.com</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-10px); }
          30% { transform: translateX(10px); }
          45% { transform: translateX(-7px); }
          60% { transform: translateX(7px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        @keyframes float1 {
          0%,100% { transform: translateY(0); opacity:0.6; }
          50% { transform: translateY(-20px); opacity:1; }
        }
        @keyframes float2 {
          0%,100% { transform: translateY(0) translateX(0); opacity:0.4; }
          50% { transform: translateY(15px) translateX(10px); opacity:0.8; }
        }
      `}</style>
    </div>
  );
};

export default PinLock;
