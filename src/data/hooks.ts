// React hooks the screens use to read live data from the backend.

import { useEffect, useState } from 'react'
import { correctedNow } from '../lib/clock'
import { backend } from './backend'
import type { Person, Season, Session, Unsubscribe } from './types'

/** Keeps a value in sync with a backend subscription while `enabled`. */
function useSubscription<T>(
  subscribe: (onChange: (value: T) => void) => Unsubscribe,
  enabled: boolean,
): T | null {
  const [value, setValue] = useState<T | null>(null)
  useEffect(() => {
    if (!enabled) return
    return subscribe(setValue)
  }, [subscribe, enabled])
  return enabled ? value : null
}

export function useSession(): Session {
  return useSubscription(backend.watchSession, true) ?? { state: 'loading' }
}

/** All seasons, or null while loading. Only available to members. */
export function useSeasons(enabled: boolean): Season[] | null {
  return useSubscription(backend.watchSeasons, enabled)
}

/** Everyone who has joined, or null while loading. Only available to members. */
export function usePeople(enabled: boolean): Person[] | null {
  return useSubscription(backend.watchPeople, enabled)
}

/** Corrected time, refreshed every `intervalMs`, so countdowns tick and seasons switch at midnight. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(correctedNow)
  useEffect(() => {
    const timer = setInterval(() => setNow(correctedNow()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
