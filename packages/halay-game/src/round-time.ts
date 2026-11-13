/** Local scene clock only. Shared authoritative rounds remain Phase 3 work. */
export function advanceRound(
  period: number,
  round: number,
  durationMinutes: number,
  autoLoop: boolean,
) {
  const duration = durationMinutes * 60;
  if (period < duration) return { period, round, stopped: false };
  return autoLoop
    ? {
        period: period % duration,
        round: round + Math.floor(period / duration),
        stopped: false,
      }
    : { period: duration, round, stopped: true };
}
