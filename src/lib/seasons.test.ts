import { describe, expect, test } from 'vitest'
import {
  athensMidnight,
  calendarYearSeason,
  findCurrentSeason,
  findNextSeason,
  findPreviousSeason,
} from './seasons'

describe('Athens time', () => {
  test('New Year in Athens is 22:00 UTC the evening before (winter, UTC+2)', () => {
    expect(athensMidnight(2027, 1, 1)).toBe(Date.UTC(2026, 11, 31, 22))
    expect(athensMidnight(2028, 1, 1)).toBe(Date.UTC(2027, 11, 31, 22))
  })

  test('summer midnight is 21:00 UTC (UTC+3)', () => {
    expect(athensMidnight(2027, 7, 1)).toBe(Date.UTC(2027, 5, 30, 21))
  })

  test('the 2027 season covers the whole year and ends exactly when 2028 starts', () => {
    const season2027 = calendarYearSeason(2027)
    expect(season2027.id).toBe('2027')
    expect(new Date(season2027.startsAt).toISOString()).toBe('2026-12-31T22:00:00.000Z')
    expect(season2027.endsAt).toBe(calendarYearSeason(2028).startsAt)
  })
})

describe('finding seasons', () => {
  const y2027 = calendarYearSeason(2027)
  const y2028 = calendarYearSeason(2028)
  const seasons = [y2028, y2027]

  test('a beer at 23:59:59.999 on 31/12 counts for the old year, at 00:00 for the new one', () => {
    expect(findCurrentSeason(seasons, y2027.endsAt - 1)).toBe(y2027)
    expect(findCurrentSeason(seasons, y2027.endsAt)).toBe(y2028)
  })

  test('before the first season nothing is running and the next one is known', () => {
    const before = y2027.startsAt - 1
    expect(findCurrentSeason(seasons, before)).toBeUndefined()
    expect(findNextSeason(seasons, before)).toBe(y2027)
    expect(findPreviousSeason(seasons, before)).toBeUndefined()
  })

  test('during 2028 the previous season is 2027', () => {
    const during2028 = y2028.startsAt + 1000
    expect(findPreviousSeason(seasons, during2028)).toBe(y2027)
    expect(findNextSeason(seasons, during2028)).toBeUndefined()
  })
})
