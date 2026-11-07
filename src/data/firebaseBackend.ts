// The real backend: Firebase Auth + Firestore, either live or on the local Emulator.
// Data model and flows: docs/PLAN.md sections 3 and 4.

import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth'
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  increment,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
  type DocumentData,
  type Firestore,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore'
import { EMULATOR_PORTS, EMULATOR_PROJECT_ID, firebaseConfig } from '../config/firebase'
import { tidyName, toPersonId } from '../lib/names'
import type { Backend, Person, Season } from './types'

export function createFirebaseBackend({ useEmulators }: { useEmulators: boolean }): Backend {
  const app = initializeApp(
    useEmulators ? { ...firebaseConfig, projectId: EMULATOR_PROJECT_ID } : firebaseConfig,
  )
  const auth = getAuth(app)
  // The persistent cache keeps taps in the phone's storage (IndexedDB) until
  // they sync, and shows them in the total immediately (README "Offline").
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })

  if (useEmulators) {
    // Use the page's host, so a phone on the same Wi-Fi can reach the laptop's emulator.
    const host = location.hostname
    connectAuthEmulator(auth, `http://${host}:${EMULATOR_PORTS.auth}`, { disableWarnings: true })
    connectFirestoreEmulator(db, host, EMULATOR_PORTS.firestore)
  }

  return {
    watchSession(onChange) {
      let stopDevice: (() => void) | undefined
      const stopAuth = onAuthStateChanged(auth, (user) => {
        stopDevice?.()
        stopDevice = undefined
        if (!user) {
          onChange({ state: 'guest' })
          return
        }
        // Signed in: we're a member as long as our device document exists.
        // Right after joining, wait until the server has confirmed it; asking
        // for members-only data before that would be refused.
        stopDevice = keepListening((onError) =>
          onSnapshot(
            doc(db, 'devices', user.uid),
            { includeMetadataChanges: true },
            (snapshot) => {
              if (snapshot.metadata.hasPendingWrites) return
              const personId = snapshot.get('personId')
              onChange(
                snapshot.exists() && typeof personId === 'string'
                  ? { state: 'member', uid: user.uid, personId }
                  : { state: 'guest' },
              )
            },
            onError,
          ),
        )
      })
      return () => {
        stopDevice?.()
        stopAuth()
      }
    },

    watchSeasons(onChange) {
      return keepListening((onError) =>
        onSnapshot(
          collection(db, 'seasons'),
          (snapshot) => onChange(snapshot.docs.map((d) => toSeason(d.id, d.data()))),
          onError,
        ),
      )
    },

    watchPeople(onChange) {
      return keepListening((onError) =>
        onSnapshot(
          collection(db, 'people'),
          (snapshot) =>
            onChange(snapshot.docs.map((d): Person => ({ id: d.id, displayName: d.get('displayName') }))),
          onError,
        ),
      )
    },

    async join(name, inviteCode) {
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user
      const personId = toPersonId(name)
      // 1. The device document proves we have a valid invite (checked by the rules).
      await setDoc(doc(db, 'devices', user.uid), { personId, inviteCode })
      // 2. Rejoining with the same name reuses the existing person, so stats don't split.
      await createPersonIfMissing(db, personId, tidyName(name))
    },

    tap(member, seasonId, tappedAt) {
      // One batch: the tap document and the +1 on the season. The rules only
      // accept the two together. Batches queue offline; transactions don't.
      const seasonRef = doc(db, 'seasons', seasonId)
      const tapRef = doc(collection(seasonRef, 'taps'))
      const batch = writeBatch(db)
      batch.set(tapRef, {
        personId: member.personId,
        uid: member.uid,
        tappedAt: Timestamp.fromMillis(tappedAt),
        serverAt: serverTimestamp(),
      })
      batch.update(seasonRef, { total: increment(1), lastTapId: tapRef.id })
      batch.commit().catch((error: unknown) => {
        // Only happens if the server rejects the tap (e.g. after the hard cutoff).
        console.warn('[tap] rejected by the server', error)
      })
    },
  }
}

const LISTEN_RETRY_MS = 2000

/**
 * A Firestore listener that starts again after an error instead of stopping for
 * good (Firestore ends a listener on its first error, e.g. a brief "not a member yet").
 */
function keepListening(start: (onError: (error: FirestoreError) => void) => Unsubscribe): Unsubscribe {
  let stopped = false
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let stopListener: Unsubscribe = () => {}

  const run = () => {
    stopListener = start((error) => {
      console.warn('[firestore] listener stopped, retrying', error.code)
      retryTimer = setTimeout(() => {
        if (!stopped) run()
      }, LISTEN_RETRY_MS)
    })
  }
  run()

  return () => {
    stopped = true
    clearTimeout(retryTimer)
    stopListener()
  }
}

async function createPersonIfMissing(db: Firestore, personId: string, displayName: string): Promise<void> {
  const personRef = doc(db, 'people', personId)
  if ((await getDoc(personRef)).exists()) return
  try {
    await setDoc(personRef, { displayName, joinedAt: serverTimestamp() })
  } catch (error) {
    // Someone else with the same name joined at the same moment: same person.
    if (!(await getDoc(personRef)).exists()) throw error
  }
}

function toSeason(id: string, data: DocumentData): Season {
  return {
    id,
    status: data.status,
    startsAt: (data.startsAt as Timestamp).toMillis(),
    endsAt: (data.endsAt as Timestamp).toMillis(),
    total: data.total ?? 0,
  }
}
