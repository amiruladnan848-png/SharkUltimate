import React, { memo } from 'react';

interface AccuracyMeterProps {
  accuracy: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const AccuracyMeter: React.FC<AccuracyMeterProps> = memo(({ accuracy, size = 'md', label = 'Accuracy' }) => {
  const radius = size === 'lg' ? 52 : size === 'md' ? 38 : 26;
  const strokeWidth = size === 'lg' ? 7 : size === 'md' ? 5.5 : 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (accuracy / 100) * circumference;
  const svgSize = (radius + strokeWidth + 2) * 2;

  const getColor = () => {
    if (accuracy >= 85) return '#10b981';
    if (accuracy >= 75) return '#06b6d4';
    if (accuracy >= 65) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor();
  const fontSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Track */}
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
          {/* Progress */}
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 5px ${color})`,
              transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-black`} style={{ color }}>
            {accuracy}%
          </span>
        </div>
      </div>
      {label && <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">{label}</span>}
    </div>
  );
});

AccuracyMeter.displayName = 'AccuracyMeter';
export default AccuracyMeter;
