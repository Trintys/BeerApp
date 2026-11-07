// An in-memory backend for building and trying screens without Firebase
// (`npm run dev:fake`). Nothing is saved; a reload starts over.
// A season is running now, and "friends" tap every few seconds so the live
// total moves.

import { athensMidnight, calendarYearSeason, findCurrentSeason } from '../lib/seasons'
import { tidyName, toPersonId } from '../lib/names'
import type { Backend, Person, Season, Session } from './types'

const FRIEND_TAP_INTERVAL_MS = 7_000
const DAY_MS = 24 * 60 * 60 * 1000

export function createFakeBackend(): Backend {
  const today = new Date()
  const runningSeason: Season = {
    id: 'fake-now',
    status: 'open',
    startsAt: athensMidnight(today.getFullYear(), today.getMonth() + 1, today.getDate()),
    endsAt: athensMidnight(today.getFullYear(), today.getMonth() + 1, today.getDate()) + 57 * DAY_MS,
    total: 1284,
  }
  const nextYear = calendarYearSeason(today.getFullYear() + 1)

  let session: Session = { state: 'guest' }
  let seasons: Season[] = [runningSeason, { ...nextYear, status: 'open', total: 0 }]
  let people: Person[] = [
    { id: 'billis', displayName: 'Billis' },
    { id: 'nikos', displayName: 'Nikos' },
    { id: 'maria', displayName: 'Maria' },
  ]

  const listeners = {
    session: new Set<(value: Session) => void>(),
    seasons: new Set<(value: Season[]) => void>(),
    people: new Set<(value: Person[]) => void>(),
  }
  const emit = () => {
    listeners.session.forEach((listener) => listener(session))
    listeners.seasons.forEach((listener) => listener(seasons))
    listeners.people.forEach((listener) => listener(people))
  }
  const addOne = (seasonId: string) => {
    seasons = seasons.map((season) => (season.id === seasonId ? { ...season, total: season.total + 1 } : season))
    emit()
  }

  setInterval(() => {
    const current = findCurrentSeason(seasons, Date.now())
    if (current) addOne(current.id)
  }, FRIEND_TAP_INTERVAL_MS)

  function watch<T>(set: Set<(value: T) => void>, current: () => T, onChange: (value: T) => void) {
    set.add(onChange)
    onChange(current())
    return () => void set.delete(onChange)
  }

  return {
    watchSession: (onChange) => watch(listeners.session, () => session, onChange),
    watchSeasons: (onChange) => watch(listeners.seasons, () => seasons, onChange),
    watchPeople: (onChange) => watch(listeners.people, () => people, onChange),

    async join(name) {
      const personId = toPersonId(name)
      if (!people.some((person) => person.id === personId)) {
        people = [...people, { id: personId, displayName: tidyName(name) }]
      }
      session = { state: 'member', uid: 'fake-uid', personId }
      emit()
    },

    tap(_member, seasonId) {
      addOne(seasonId)
    },
  }
}
