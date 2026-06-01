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
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(document.body);

    const chars = '01SHARKBINARYCALLPUT↑↓ΔΩ∑βφ⟳×◆▲▼'.split('');
    const fontSize = 12;
    const cols = Math.floor(width / fontSize);
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -50);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 8, 20, 0.06)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const r = Math.random();

        if (r < 0.02) ctx.fillStyle = 'rgba(255,255,255,0.9)';
        else if (r < 0.25) ctx.fillStyle = 'rgba(0,212,255,0.7)';
        else if (r < 0.55) ctx.fillStyle = 'rgba(0,180,220,0.4)';
        else ctx.fillStyle = 'rgba(0,50,80,0.25)';

        ctx.fillText(char, x, y);

        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.5;
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      resizeObs.disconnect();
    };
  }, []);

  return (
    <>
      {/* Shark background image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={sharkBg}
          alt=""
          className="w-full h-full object-cover"
          style={{ opacity: 0.12 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/70 via-[#050814]/50 to-[#050814]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050814]/60 via-transparent to-[#050814]/60" />
      </div>

      {/* Matrix rain canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" style={{ opacity: 0.18 }} />

      {/* Animated grid lines */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Radial glows */}
      <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: '10%', left: '5%',
            background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
            animation: 'float1 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            bottom: '15%', right: '8%',
            background: 'radial-gradient(circle, rgba(0,100,255,0.05) 0%, transparent 70%)',
            animation: 'float2 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(0,212,255,0.03) 0%, transparent 70%)',
            animation: 'float1 20s ease-in-out infinite reverse',
          }}
        />
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-25px, 20px) scale(1.08); }
          70% { transform: translate(20px, -15px) scale(0.97); }
        }
      `}</style>
    </>
  );
});

BackgroundAnimation.displayName = 'BackgroundAnimation';
export default BackgroundAnimation;
