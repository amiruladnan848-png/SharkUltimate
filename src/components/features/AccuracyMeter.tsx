import React, { memo } from 'react';

interface AccuracyMeterProps {
  accuracy: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showShelter?: boolean;
}

export const AccuracyMeter: React.FC<AccuracyMeterProps> = memo(({ accuracy, size = 'md', label, showShelter }) => {
  const radius      = size === 'lg' ? 52 : size === 'md' ? 38 : 25;
  const strokeWidth = size === 'lg' ? 6.5 : size === 'md' ? 5 : 3.5;
  const circum      = 2 * Math.PI * radius;
  const progress    = (accuracy / 100) * circum;
  const svgSize     = (radius + strokeWidth + 5) * 2;

  const getColor = (): string => {
    if (accuracy >= 92) return '#34d399';   // bright emerald
    if (accuracy >= 84) return '#00e5ff';   // bright cyan
    if (accuracy >= 76) return '#fbbf24';   // amber
    return '#f87171';                        // red
  };

  const color = getColor();
  const fontSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-[11px]';
  const shelterPct = 78;
  const shelterProgress = (shelterPct / 100) * circum;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Background track */}
          <circle cx={svgSize/2} cy={svgSize/2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
          {/* Shelter arc */}
          {showShelter && (
            <circle cx={svgSize/2} cy={svgSize/2} r={radius}
              fill="none" stroke="rgba(251,191,36,0.18)" strokeWidth={strokeWidth}
              strokeDasharray={`${shelterProgress} ${circum}`} strokeLinecap="round" />
          )}
          {/* Accuracy arc */}
          <circle cx={svgSize/2} cy={svgSize/2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circum}`} strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 7px ${color}) drop-shadow(0 0 16px ${color}66)`,
              transition: 'stroke-dasharray 0.75s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-black tabular-nums`}
            style={{ color, textShadow: `0 0 10px ${color}99` }}>
            {accuracy}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#1e3870' }}>
          {label}
        </span>
      )}
    </div>
  );
});

AccuracyMeter.displayName = 'AccuracyMeter';
export default AccuracyMeter;
