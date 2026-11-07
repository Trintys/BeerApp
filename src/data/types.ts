// Shapes the screens work with. Times are milliseconds since the epoch (UTC).
// How these are stored in Firestore: docs/PLAN.md section 3.

export type SeasonStatus = 'open' | 'closed' | 'revealed'

export interface Season {
  /** "2027", or e.g. "test-2026" for the test run. */
  id: string
  status: SeasonStatus
  /** First moment of the season (inclusive). */
  startsAt: number
  /** First moment after the season (exclusive). */
  endsAt: number
  /** The shared total, including this phone's taps that haven't synced yet. */
  total: number
}

export interface Person {
  /** Normalised name, e.g. "nikos". */
  id: string
  displayName: string
}

/** Someone on this phone who has joined. */
export interface Member {
  uid: string
  personId: string
}

export type Session =
  | { state: 'loading' }
  /** Not joined on this phone (or their device was removed by the admin). */
  | { state: 'guest' }
  | ({ state: 'member' } & Member)

export type Unsubscribe = () => void

/**
 * Everything the screens need from the backend. There's a real version
 * (Firebase, live or Emulator) and a fake in-memory one for building screens
 * without Firebase. Pick one in src/data/index.ts.
 */
export interface Backend {
  watchSession(onChange: (session: Session) => void): Unsubscribe
  /** All seasons. Members only. */
  watchSeasons(onChange: (seasons: Season[]) => void): Unsubscribe
  /** Everyone who has joined. Members only. */
  watchPeople(onChange: (people: Person[]) => void): Unsubscribe
  /** Joins with an invite code; resolves once this phone is a member. */
  join(name: string, inviteCode: string): Promise<void>
  /**
   * Adds one beer to a season. Returns straight away: the total updates on
   * screen immediately and the tap syncs in the background (or later, offline).
   */
  tap(member: Member, seasonId: string, tappedAt: number): void
}
