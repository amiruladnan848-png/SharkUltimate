import React, { useEffect, useRef, memo } from 'react';
import sharkProBg from '@/assets/shark-pro-bg.jpg';

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

    const chars = '01SHARKBINARYCALLPUT↑↓ΔΣΩ∑▲▼◆×FOREX'.split('');
    const fs = 11;
    let cols = Math.floor(w / fs);
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -80);

    const draw = () => {
      cols = Math.floor(w / fs);
      while (drops.length < cols) drops.push(Math.random() * -80);
      ctx.fillStyle = 'rgba(6,12,26,0.05)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fs}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < Math.min(drops.length, cols); i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fs, y = drops[i] * fs;
        const r = Math.random();
        if (r < 0.008) ctx.fillStyle = 'rgba(255,255,255,0.9)';
        else if (r < 0.12) ctx.fillStyle = 'rgba(0,212,255,0.7)';
        else if (r < 0.35) ctx.fillStyle = 'rgba(0,212,255,0.28)';
        else ctx.fillStyle = 'rgba(0,80,120,0.12)';
        ctx.fillText(char, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.4;
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); obs.disconnect(); };
  }, []);

  return (
    <>
      {/* Shark pro background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={sharkProBg} alt="" className="w-full h-full object-cover" style={{ opacity: 0.11 }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(5,10,22,0.82) 0%, rgba(6,12,26,0.55) 45%, rgba(5,10,22,0.90) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, rgba(5,10,22,0.72) 0%, transparent 28%, transparent 72%, rgba(5,10,22,0.72) 100%)',
        }} />
      </div>

      {/* Matrix rain canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" style={{ opacity: 0.13 }} />

      {/* Precision grid */}
      <div className="fixed inset-0 z-[2] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,212,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.022) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />

      {/* Ambient glow orbs */}
      <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{
          width: 900, height: 900, top: '-10%', left: '-5%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.035) 0%, transparent 65%)',
          animation: 'orb1 16s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 700, height: 700, bottom: '-8%', right: '-2%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 65%)',
          animation: 'orb2 20s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, top: '35%', left: '42%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.02) 0%, transparent 65%)',
          animation: 'orb1 25s ease-in-out infinite reverse',
        }} />
        {/* Shark fin silhouette hint */}
        <div className="absolute" style={{
          width: 200, height: 180, bottom: '12%', right: '18%',
          background: 'radial-gradient(ellipse at bottom, rgba(0,212,255,0.04) 0%, transparent 70%)',
          animation: 'orb2 12s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(50px,-30px) scale(1.06); }
          66%      { transform: translate(-30px,25px) scale(0.94); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-40px,30px) scale(1.08); }
          70%      { transform: translate(28px,-20px) scale(0.96); }
        }
      `}</style>
    </>
  );
});

BackgroundAnimation.displayName = 'BackgroundAnimation';
export default BackgroundAnimation;
