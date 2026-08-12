/**
 * A mm:ss countdown.
 *
 * Deliberately does not roll over into hours: it counts down the last few
 * minutes of a session, where "60:00" is clearer than "1:00:00".
 */
export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
  const remainder = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}
