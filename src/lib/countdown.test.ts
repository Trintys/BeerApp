import { describe, expect, test } from 'vitest'
import { startsInText, timeLeftText } from './countdown'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('countdown text', () => {
  test('days, then hours, then minutes', () => {
    expect(timeLeftText(57 * DAY + 3 * HOUR)).toBe('57 days left')
    expect(timeLeftText(2 * DAY)).toBe('2 days left')
    expect(timeLeftText(2 * DAY - 1)).toBe('47 hours left')
    expect(timeLeftText(90 * MINUTE)).toBe('90 minutes left')
    expect(timeLeftText(30 * 1000)).toBe('less than a minute left')
  })

  test('starts-in wording', () => {
    expect(startsInText(54 * DAY)).toBe('in 54 days')
  })
})
