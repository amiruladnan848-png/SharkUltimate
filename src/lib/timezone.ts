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
  // London Open: 07–12 UTC | New York Open: 12–17 UTC | London-NY Overlap: 12–16 UTC
  // Asian: 22–07 UTC | Overlap: 12–16 UTC
  if (h >= 12 && h < 16) return 'OVERLAP';    // London + NY overlap (BEST)
  if (h >= 7 && h < 12) return 'LONDON';      // London session
  if (h >= 16 && h < 21) return 'NEW_YORK';   // NY session (post overlap)
  if (h >= 21 || h < 7) return 'ASIAN';       // Asian session
  return 'OFF';
};

export const getSessionAccuracyBoost = (session: SessionType): number => {
  switch (session) {
    case 'OVERLAP':  return 18; // Highest liquidity
    case 'LONDON':   return 14;
    case 'NEW_YORK': return 12;
    case 'ASIAN':    return 8;
    default:         return 5;
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
