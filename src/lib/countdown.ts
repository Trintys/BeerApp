// Countdown text (README "Countdown"). Plain for now; the dramatic final days
// and final hour come with the counter design.

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "57 days left", "5 hours left", "12 minutes left", "less than a minute left". */
export function timeLeftText(msLeft: number): string {
  if (msLeft >= 2 * DAY) return `${Math.floor(msLeft / DAY)} days left`
  if (msLeft >= 2 * HOUR) return `${Math.floor(msLeft / HOUR)} hours left`
  if (msLeft >= 2 * MINUTE) return `${Math.floor(msLeft / MINUTE)} minutes left`
  return 'less than a minute left'
}

/** "in 54 days", "in 5 hours", … for the Starts in… screen. */
export function startsInText(msUntil: number): string {
  return 'in ' + timeLeftText(msUntil).replace(' left', '')
}
