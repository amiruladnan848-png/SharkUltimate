import React, { useEffect, useRef, memo } from 'react';
import sharkBg from '@/assets/shark-bg.jpg';

export const BackgroundAnimation: React.FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let w = window.innerWidth, h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w; canvas.height = h;
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(document.body);

    const chars = '01SHARKBINARYCALLPUT↑↓ΔΣΦΩ∑▲▼◆×⟳'.split('');
    const fs = 11;
    const cols = Math.floor(w / fs);
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -60);

    const draw = () => {
      ctx.fillStyle = 'rgba(6,12,26,0.055)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fs}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fs, y = drops[i] * fs;
        const r = Math.random();
        if (r < 0.015) ctx.fillStyle = 'rgba(255,255,255,0.85)';
        else if (r < 0.20) ctx.fillStyle = 'rgba(56,189,248,0.65)';
        else if (r < 0.50) ctx.fillStyle = 'rgba(56,189,248,0.30)';
        else ctx.fillStyle = 'rgba(14,80,120,0.18)';
        ctx.fillText(char, x, y);
        if (y > h && Math.random() > 0.978) drops[i] = 0;
        drops[i] += 0.45;
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animFrame); obs.disconnect(); };
  }, []);

  return (
    <>
      {/* Shark BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={sharkBg} alt="" className="w-full h-full object-cover" style={{ opacity: 0.08 }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(6,12,26,0.75) 0%, rgba(6,12,26,0.55) 50%, rgba(6,12,26,0.92) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, rgba(6,12,26,0.7) 0%, transparent 30%, transparent 70%, rgba(6,12,26,0.7) 100%)',
        }} />
      </div>

      {/* Matrix rain */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" style={{ opacity: 0.14 }} />

      {/* Grid */}
      <div className="fixed inset-0 z-[2] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px)`,
        backgroundSize: '72px 72px',
      }} />

      {/* Floating orbs */}
      <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{
          width: 700, height: 700, top: '5%', left: '2%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)',
          animation: 'orb1 14s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 600, height: 600, bottom: '10%', right: '5%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
          animation: 'orb2 18s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 400, height: 400, top: '40%', left: '45%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.025) 0%, transparent 70%)',
          animation: 'orb1 22s ease-in-out infinite reverse',
        }} />
      </div>

      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-25px) scale(1.06); }
          66%      { transform: translate(-25px,20px) scale(0.94); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-30px,25px) scale(1.1); }
          70%      { transform: translate(25px,-18px) scale(0.96); }
        }
      `}</style>
    </>
  );
});

BackgroundAnimation.displayName = 'BackgroundAnimation';
export default BackgroundAnimation;
