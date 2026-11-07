// Corrected time (README "Corrected time"): all time logic uses the phone's
// clock plus the last measured offset to server time, so a wrong phone clock
// doesn't matter and it keeps working offline.
//
// Measuring the offset is a later step (docs/PLAN.md "Corrected time"); until
// then the offset stays 0 and corrected time equals the phone's clock.

const STORAGE_KEY = 'happy-new-beer.clockOffsetMs'

export function clockOffsetMs(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0
  } catch {
    return 0
  }
}

export function saveClockOffsetMs(offsetMs: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(offsetMs)))
  } catch {
    // Storage can be unavailable (private mode); then we just use the phone's clock.
  }
}

/** Now, according to the server's clock. Use this instead of Date.now() everywhere. */
export function correctedNow(): number {
  return Date.now() + clockOffsetMs()
}
