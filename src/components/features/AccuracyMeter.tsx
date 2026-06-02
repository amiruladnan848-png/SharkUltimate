import React, { memo } from 'react';

interface AccuracyMeterProps {
  accuracy: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showShelter?: boolean;
}

export const AccuracyMeter: React.FC<AccuracyMeterProps> = memo(({ accuracy, size = 'md', label = 'Accuracy', showShelter }) => {
  const radius = size === 'lg' ? 50 : size === 'md' ? 36 : 24;
  const strokeWidth = size === 'lg' ? 6 : size === 'md' ? 5 : 3.5;
  const circumference = 2 * Math.PI * radius;
  const progress = (accuracy / 100) * circumference;
  const svgSize = (radius + strokeWidth + 4) * 2;

  const getColor = (): string => {
    if (accuracy >= 88) return '#10b981';
    if (accuracy >= 80) return '#06b6d4';
    if (accuracy >= 72) return '#f59e0b';
    return '#ef4444';
  };

  const getGlow = (color: string): string =>
    `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}55)`;

  const color = getColor();
  const fontSize = size === 'lg' ? 'text-[22px]' : size === 'md' ? 'text-base' : 'text-xs';
  const shelter = 72;
  const shelterProgress = (shelter / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Background track */}
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
          {/* Shelter indicator */}
          {showShelter && (
            <circle cx={svgSize / 2} cy={svgSize / 2} r={radius}
              fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth={strokeWidth}
              strokeDasharray={`${shelterProgress} ${circumference}`} strokeLinecap="round" />
          )}
          {/* Accuracy progress */}
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round"
            style={{ filter: getGlow(color), transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-black tabular-nums`} style={{ color, textShadow: `0 0 8px ${color}80` }}>
            {accuracy}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[9px] text-[#2a3a55] font-semibold tracking-[0.2em] uppercase">{label}</span>
      )}
    </div>
  );
});

AccuracyMeter.displayName = 'AccuracyMeter';
export default AccuracyMeter;
