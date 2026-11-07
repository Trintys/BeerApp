import { describe, expect, test } from 'vitest'
import { nameProblem, tidyName, toPersonId } from './names'

describe('names', () => {
  test('the same person regardless of spaces and capitals', () => {
    for (const raw of ['Nikos', 'nikos', 'Nikos ', '  NIKOS']) {
      expect(toPersonId(raw)).toBe('nikos')
    }
    expect(toPersonId(' Nikos   Papas ')).toBe('nikos papas')
  })

  test('keeps the capitals people typed for display', () => {
    expect(tidyName('  Nikos   Papas ')).toBe('Nikos Papas')
  })

  test('accepts Latin letters and single spaces', () => {
    expect(nameProblem('Nikos')).toBeNull()
    expect(nameProblem(' Nikos  Papas ')).toBeNull()
  })

  test('refuses Greek, numbers, symbols, empty and too long', () => {
    expect(nameProblem('Νίκος')).not.toBeNull()
    expect(nameProblem('Nikos2')).not.toBeNull()
    expect(nameProblem("O'Neil")).not.toBeNull()
    expect(nameProblem('   ')).not.toBeNull()
    expect(nameProblem('a'.repeat(25))).not.toBeNull()
    expect(nameProblem('a'.repeat(24))).toBeNull()
  })
})
