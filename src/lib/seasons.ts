// Seasons (README "Seasons"): one calendar year in Greek time, from 00:00 on
// 1 January up to (not including) 00:00 on the next 1 January.
// All times are milliseconds since the epoch (UTC).

export const SEASON_TIME_ZONE = 'Europe/Athens'

export interface SeasonWindow {
  /** First moment of the season (inclusive). */
  startsAt: number
  /** First moment after the season (exclusive). */
  endsAt: number
}

/** How far Athens is ahead of UTC at a given moment, in milliseconds (2 or 3 hours). */
export function athensOffsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEASON_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asIfUtc - Math.floor(instant / 1000) * 1000
}

/** 00:00 on a given day in Athens, as a UTC timestamp. `month` is 1–12. */
export function athensMidnight(year: number, month: number, day: number): number {
  const sameClockInUtc = Date.UTC(year, month - 1, day)
  return sameClockInUtc - athensOffsetMs(sameClockInUtc - athensOffsetMs(sameClockInUtc))
}

/** The season for a calendar year, e.g. 2027 → 1/1/2027 00:00 to 1/1/2028 00:00 (Athens). */
export function calendarYearSeason(year: number): SeasonWindow & { id: string } {
  return {
    id: String(year),
    startsAt: athensMidnight(year, 1, 1),
    endsAt: athensMidnight(year + 1, 1, 1),
  }
}

/** The season running at `now`, if any. A tap at `now` belongs to this season. */
export function findCurrentSeason<T extends SeasonWindow>(seasons: readonly T[], now: number): T | undefined {
  return seasons.find((season) => season.startsAt <= now && now < season.endsAt)
}

/** The next season to start after `now`, if any. */
export function findNextSeason<T extends SeasonWindow>(seasons: readonly T[], now: number): T | undefined {
  return seasons
    .filter((season) => season.startsAt > now)
    .reduce<T | undefined>((soonest, season) => (!soonest || season.startsAt < soonest.startsAt ? season : soonest), undefined)
}

/** The most recent season that has already ended at `now`, if any. */
export function findPreviousSeason<T extends SeasonWindow>(seasons: readonly T[], now: number): T | undefined {
  return seasons
    .filter((season) => season.endsAt <= now)
    .reduce<T | undefined>((latest, season) => (!latest || season.endsAt > latest.endsAt ? season : latest), undefined)
}
