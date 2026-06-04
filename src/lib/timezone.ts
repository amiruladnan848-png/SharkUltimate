import { SessionType } from '@/types/trading';

export const BANGLADESH_TZ = 'Asia/Dhaka';

export const getBangladeshTime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BANGLADESH_TZ }));
};

export const getBangladeshTimeString = (): string =>
  new Date().toLocaleTimeString('en-US', {
    timeZone: BANGLADESH_TZ,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

export const getBangladeshDateString = (): string =>
  new Date().toLocaleDateString('en-US', {
    timeZone: BANGLADESH_TZ,
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

export const isWeekend = (): boolean => {
  const day = getBangladeshTime().getDay();
  return day === 0 || day === 6;
};

export const getUTCHour = (): number => new Date().getUTCHours();

export const getCurrentSession = (): SessionType => {
  const h = getUTCHour();
  if (h >= 12 && h < 16) return 'OVERLAP';    // London + NY overlap (BEST) — highest vol
  if (h >= 7  && h < 12) return 'LONDON';     // London session — strong moves
  if (h >= 16 && h < 21) return 'NEW_YORK';   // NY session — strong trend continuation
  if (h >= 21 || h < 7)  return 'ASIAN';      // Asian session — lower vol but predictable
  return 'OFF';
};

// Enhanced session boosts for maximum accuracy
export const getSessionAccuracyBoost = (session: SessionType): number => {
  switch (session) {
    case 'OVERLAP':  return 20; // Prime — London+NY max liquidity
    case 'LONDON':   return 16; // High — strong institutional moves
    case 'NEW_YORK': return 14; // High — continuation & reversals
    case 'ASIAN':    return 10; // Moderate — range-bound but consistent
    default:         return 7;
  }
};

// Session descriptions for UI
export const getSessionDetails = (session: SessionType): {
  label: string; utcRange: string; color: string; quality: string; description: string;
} => {
  switch (session) {
    case 'OVERLAP':  return { label: 'LDN+NY Overlap', utcRange: '12:00–16:00 UTC', color: '#34d399', quality: 'PRIME',  description: 'Highest liquidity — best signals' };
    case 'LONDON':   return { label: 'London Session',  utcRange: '07:00–12:00 UTC', color: '#38bdf8', quality: 'HIGH',   description: 'Strong institutional moves' };
    case 'NEW_YORK': return { label: 'New York Session',utcRange: '16:00–21:00 UTC', color: '#a78bfa', quality: 'HIGH',   description: 'Trend continuation & reversals' };
    case 'ASIAN':    return { label: 'Asian Session',   utcRange: '21:00–07:00 UTC', color: '#fbbf24', quality: 'MEDIUM', description: 'Range-bound, consistent signals' };
    default:         return { label: 'Market Off',      utcRange: '',                color: '#4b5563', quality: 'LOW',    description: 'Low activity period' };
  }
};

export const getNextMinuteBoundary = (): Date => {
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return next;
};

export const getSecondsToNextMinute = (): number => {
  const now = new Date();
  return 60 - now.getSeconds();
};

export const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
