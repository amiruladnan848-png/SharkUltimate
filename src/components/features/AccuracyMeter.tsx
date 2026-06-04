import React, { memo } from 'react';

interface AccuracyMeterProps {
  accuracy: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showShelter?: boolean;
}

export const AccuracyMeter: React.FC<AccuracyMeterProps> = memo(({ accuracy, size = 'md', label, showShelter }) => {
  const radius      = size === 'lg' ? 54 : size === 'md' ? 40 : 27;
  const strokeWidth = size === 'lg' ? 7   : size === 'md' ? 5.5 : 4;
  const circum      = 2 * Math.PI * radius;
  const progress    = (accuracy / 100) * circum;
  const svgSize     = (radius + strokeWidth + 6) * 2;

  const getColor = (): { main: string; glow: string } => {
    if (accuracy >= 92) return { main: '#34d399', glow: 'rgba(52,211,153,0.7)' };
    if (accuracy >= 85) return { main: '#00e5ff', glow: 'rgba(0,229,255,0.7)' };
    if (accuracy >= 80) return { main: '#38bdf8', glow: 'rgba(56,189,248,0.6)' };
    if (accuracy >= 76) return { main: '#fbbf24', glow: 'rgba(251,191,36,0.6)' };
    return { main: '#f87171', glow: 'rgba(248,113,113,0.5)' };
  };

  const { main: color, glow } = getColor();
  const fontSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-[12px]';

  // Shelter floor at 80%
  const shelterPct      = 80;
  const shelterProgress = (shelterPct / 100) * circum;

  // Segment ticks every 10%
  const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Outer background ring */}
          <circle cx={svgSize/2} cy={svgSize/2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />

          {/* Segment ticks */}
          {ticks.map(t => {
            const angle = (t / 100) * 2 * Math.PI - Math.PI / 2;
            const outerR = radius + strokeWidth / 2 + 2;
            const innerR = radius - strokeWidth / 2 - 1;
            return (
              <line key={t}
                x1={svgSize/2 + innerR * Math.cos(angle + Math.PI/2)}
                y1={svgSize/2 + innerR * Math.sin(angle + Math.PI/2)}
                x2={svgSize/2 + outerR * Math.cos(angle + Math.PI/2)}
                y2={svgSize/2 + outerR * Math.sin(angle + Math.PI/2)}
                stroke="rgba(255,255,255,0.08)" strokeWidth="1"
              />
            );
          })}

          {/* Shelter floor indicator */}
          {showShelter && (
            <circle cx={svgSize/2} cy={svgSize/2} r={radius}
              fill="none"
              stroke="rgba(251,191,36,0.22)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${shelterProgress} ${circum}`}
              strokeLinecap="round"
            />
          )}

          {/* Main accuracy arc */}
          <circle cx={svgSize/2} cy={svgSize/2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circum}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${glow}) drop-shadow(0 0 20px ${color}55)`,
              transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease',
            }}
          />

          {/* Leading dot */}
          {accuracy > 5 && (() => {
            const angle = (accuracy / 100) * 2 * Math.PI - Math.PI / 2;
            const x = svgSize/2 + radius * Math.cos(angle + Math.PI/2);
            const y = svgSize/2 + radius * Math.sin(angle + Math.PI/2);
            return (
              <circle cx={x} cy={y} r={strokeWidth / 2 + 1}
                fill={color}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            );
          })()}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-black tabular-nums leading-none`}
            style={{ color, textShadow: `0 0 12px ${glow}` }}>
            {accuracy}%
          </span>
          {size === 'lg' && (
            <span className="text-[8px] tracking-wider mt-0.5 font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
              SCORE
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: '#1a3060' }}>
          {label}
        </span>
      )}
    </div>
  );
});

AccuracyMeter.displayName = 'AccuracyMeter';
export default AccuracyMeter;
