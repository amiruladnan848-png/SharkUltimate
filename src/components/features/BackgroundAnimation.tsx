import React, { useEffect, useRef, memo } from 'react';
import sharkProBg from '@/assets/shark-pro-bg.jpg';

export const BackgroundAnimation: React.FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const PARTICLE_COUNT = 90;
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      r: number; opacity: number; hue: number; type: 'dot' | 'cross' | 'ring';
    };

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.55 + 0.1,
      hue: Math.random() > 0.7 ? 210 : Math.random() > 0.5 ? 190 : 270,
      type: Math.random() > 0.85 ? 'cross' : Math.random() > 0.8 ? 'ring' : 'dot',
    }));

    // Data stream columns (matrix-like vertical lines)
    const COLS = Math.ceil(window.innerWidth / 28);
    const streams: { x: number; y: number; speed: number; length: number; opacity: number }[] = Array.from({ length: COLS }, (_, i) => ({
      x: i * 28 + Math.random() * 14,
      y: Math.random() * window.innerHeight,
      speed: 0.3 + Math.random() * 0.6,
      length: 30 + Math.random() * 60,
      opacity: 0.03 + Math.random() * 0.05,
    }));

    // Neon grid lines
    const GRID_LINES = 8;

    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── 1. Grid lines ──────────────────────────────────────────────
      ctx.save();
      const gridAlpha = 0.04 + Math.sin(frame * 0.008) * 0.01;
      ctx.strokeStyle = `rgba(0,212,255,${gridAlpha})`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID_LINES; i++) {
        const x = (i / GRID_LINES) * canvas.width;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        const y = (i / GRID_LINES) * canvas.height;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.restore();

      // ── 2. Data stream columns ──────────────────────────────────────
      streams.forEach(s => {
        const grad = ctx.createLinearGradient(s.x, s.y - s.length, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.7, `rgba(0,200,255,${s.opacity})`);
        grad.addColorStop(1, `rgba(0,230,255,${s.opacity * 2.5})`);
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.length);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.restore();
        s.y += s.speed;
        if (s.y - s.length > canvas.height) s.y = -s.length;
      });

      // ── 3. Particles ────────────────────────────────────────────────
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.save();
        ctx.globalAlpha = p.opacity * (0.7 + Math.sin(frame * 0.025 + p.x) * 0.3);

        if (p.type === 'dot') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${p.hue},90%,68%)`;
          ctx.shadowBlur  = 10;
          ctx.shadowColor = `hsl(${p.hue},90%,68%)`;
          ctx.fill();
        } else if (p.type === 'ring') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `hsl(${p.hue},85%,65%)`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        } else {
          // Cross
          ctx.strokeStyle = `hsl(${p.hue},80%,65%)`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(p.x - p.r * 2, p.y); ctx.lineTo(p.x + p.r * 2, p.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(p.x, p.y - p.r * 2); ctx.lineTo(p.x, p.y + p.r * 2); ctx.stroke();
        }
        ctx.restore();
      });

      // ── 4. Slow pulse rings (center) ────────────────────────────────
      const cx = canvas.width / 2, cy = canvas.height * 0.38;
      [0.3, 0.6, 0.9].forEach((off, i) => {
        const phase = (frame * 0.004 + off) % 1;
        const r = phase * Math.min(canvas.width, canvas.height) * 0.55;
        ctx.save();
        ctx.globalAlpha = (1 - phase) * 0.04;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i === 0 ? '#00d4ff' : i === 1 ? '#818cf8' : '#34d399';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // ── 5. Candlestick overlay (subtle) ─────────────────────────────
      if (frame % 4 === 0) {
        const barCount = 24;
        const barW = 14;
        const startX = canvas.width * 0.55;
        const baseY = canvas.height * 0.65;
        for (let i = 0; i < barCount; i++) {
          const h = 12 + Math.abs(Math.sin(i * 0.7 + frame * 0.01)) * 30;
          const up = Math.sin(i * 0.5 + frame * 0.008) > 0;
          const x = startX + i * (barW + 4);
          const alpha = 0.04 + (i / barCount) * 0.04;
          ctx.save();
          ctx.fillStyle = up ? `rgba(52,211,153,${alpha})` : `rgba(248,113,113,${alpha})`;
          ctx.fillRect(x, baseY - h / 2, barW * 0.8, h);
          ctx.restore();
        }
      }

      frame++;
      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Shark photo background */}
      <img
        src={sharkProBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.12 }}
      />
      {/* Deep gradient overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg,rgba(3,8,20,0.75) 0%,rgba(4,9,22,0.55) 40%,rgba(4,10,24,0.80) 100%)',
      }} />
      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 0%, rgba(3,8,20,0.7) 100%)',
      }} />
      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,200,255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />
    </div>
  );
});

BackgroundAnimation.displayName = 'BackgroundAnimation';
export default BackgroundAnimation;
