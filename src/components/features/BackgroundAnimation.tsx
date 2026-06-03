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
    let w = 0, h = 0;
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w; canvas.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    // Matrix rain chars — trading themed
    const chars = '01SHARKCALLPUT↑↓FOREX QX BROKER BINARY SIGNAL'.split('');
    const fs = 11;
    let cols = Math.floor(w / fs);
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -100);

    const draw = () => {
      cols = Math.floor(w / fs);
      while (drops.length < cols) drops.push(Math.random() * -100);

      // Bright fade — more visible background
      ctx.fillStyle = 'rgba(4,9,22,0.055)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fs}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < Math.min(drops.length, cols); i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fs, y = drops[i] * fs;
        const r = Math.random();
        // Brighter matrix with more contrast
        if (r < 0.006)      ctx.fillStyle = 'rgba(255,255,255,1.0)';   // white spark
        else if (r < 0.06)  ctx.fillStyle = 'rgba(0,229,255,0.9)';     // bright cyan
        else if (r < 0.20)  ctx.fillStyle = 'rgba(0,212,255,0.55)';    // mid cyan
        else if (r < 0.50)  ctx.fillStyle = 'rgba(0,160,220,0.28)';    // dim cyan
        else                ctx.fillStyle = 'rgba(0,80,140,0.12)';     // very dim
        ctx.fillText(char, x, y);
        if (y > h && Math.random() > 0.972) drops[i] = 0;
        drops[i] += 0.45;
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Shark background image — brighter */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={sharkProBg} alt="" className="w-full h-full object-cover"
          style={{ opacity: 0.16 }} />
        {/* Gradient overlay — brighter center */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(4,9,22,0.75) 0%, rgba(5,12,28,0.42) 40%, rgba(4,9,22,0.82) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, rgba(4,9,22,0.65) 0%, transparent 25%, transparent 75%, rgba(4,9,22,0.65) 100%)',
        }} />
      </div>

      {/* Matrix rain */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" style={{ opacity: 0.18 }} />

      {/* Bright precision grid */}
      <div className="fixed inset-0 z-[2] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Bright ambient glows */}
      <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
        {/* Top-left cyan glow */}
        <div className="absolute rounded-full" style={{
          width: 1000, height: 1000, top: '-18%', left: '-8%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.055) 0%, transparent 62%)',
          animation: 'orbA 18s ease-in-out infinite',
        }} />
        {/* Bottom-right purple glow */}
        <div className="absolute rounded-full" style={{
          width: 800, height: 800, bottom: '-15%', right: '-5%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 62%)',
          animation: 'orbB 22s ease-in-out infinite',
        }} />
        {/* Center accent */}
        <div className="absolute rounded-full" style={{
          width: 600, height: 600, top: '30%', left: '38%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.03) 0%, transparent 65%)',
          animation: 'orbA 28s ease-in-out infinite reverse',
        }} />
        {/* Bright horizontal streak */}
        <div className="absolute" style={{
          height: '1px',
          left: 0, right: 0,
          top: '30%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.08) 25%, rgba(0,212,255,0.18) 50%, rgba(0,212,255,0.08) 75%, transparent 100%)',
          animation: 'streakPulse 6s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes orbA {
          0%,100% { transform: translate(0,0) scale(1); opacity:1; }
          33%      { transform: translate(60px,-35px) scale(1.07); opacity:0.85; }
          66%      { transform: translate(-35px,28px) scale(0.93); opacity:0.95; }
        }
        @keyframes orbB {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-50px,35px) scale(1.09); }
          70%      { transform: translate(32px,-22px) scale(0.95); }
        }
        @keyframes streakPulse {
          0%,100% { opacity:0.3; transform:scaleX(0.7); }
          50%      { opacity:1; transform:scaleX(1); }
        }
      `}</style>
    </>
  );
});

BackgroundAnimation.displayName = 'BackgroundAnimation';
export default BackgroundAnimation;
