// Shared setup for the security-rule tests.

import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

const RULES = readFileSync('firestore.rules', 'utf8')

/**
 * The admin UID exactly as written in firestore.rules, so these tests keep
 * passing after the placeholder is replaced with Billis's real ID.
 */
export const ADMIN_UID = RULES.match(/function adminUid\(\) \{\s*return '([^']+)';/)?.[1] ?? ''
if (!ADMIN_UID) throw new Error('Could not find adminUid() in firestore.rules')

export const INVITE_CODE = 'test-invite'
export const SEASON_ID = 'test-season'

const DAY_MS = 24 * 60 * 60 * 1000
export const seasonStart = Timestamp.fromMillis(Date.now() - DAY_MS)
export const seasonEnd = Timestamp.fromMillis(Date.now() + 30 * DAY_MS)

/**
 * The test context's database, typed for the modular API we use in the app.
 * (It's typed as the older "compat" API, but works the same, as in Firebase's own docs.)
 */
export function dbOf(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore
}

export function createTestEnvironment(): Promise<RulesTestEnvironment> {
  // Host and port come from FIRESTORE_EMULATOR_HOST, set by `firebase emulators:exec`.
  return initializeTestEnvironment({
    projectId: 'demo-happy-new-beer',
    firestore: { rules: RULES },
  })
}

/** Starting data for every test: one invite, one open season and the reserved admin. */
export async function seedBasics(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = dbOf(context)
    await setDoc(doc(db, 'invites', INVITE_CODE), { note: 'test' })
    await setDoc(doc(db, 'seasons', SEASON_ID), {
      status: 'open',
      startsAt: seasonStart,
      endsAt: seasonEnd,
      total: 0,
    })
    await setDoc(doc(db, 'people', 'billis'), {
      displayName: 'Billis',
      joinedAt: Timestamp.now(),
      reserved: true,
    })
  })
}

/** Adds someone who has already joined (their device and person documents). */
export async function addMember(
  env: RulesTestEnvironment,
  uid: string,
  personId: string,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = dbOf(context)
    await setDoc(doc(db, 'devices', uid), { personId, inviteCode: INVITE_CODE })
    await setDoc(doc(db, 'people', personId), {
      displayName: personId,
      joinedAt: Timestamp.now(),
    })
  })
}

/** Changes fields on the test season, bypassing the rules. */
export async function setSeason(
  env: RulesTestEnvironment,
  fields: Record<string, unknown>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(dbOf(context), 'seasons', SEASON_ID), fields, { merge: true })
  })
}

interface TapOptions {
  uid: string
  personId: string
  tappedAt?: Timestamp
  /** How much the total goes up. Anything other than 1 must be rejected. */
  totalStep?: number
  /** Leave out one half of the batch to check the halves depend on each other. */
  only?: 'tap' | 'season'
}

/** A tap exactly as the app writes it: one batch with the tap and the +1. */
export function commitTap(db: Firestore, options: TapOptions): Promise<void> {
  const seasonRef = doc(db, 'seasons', SEASON_ID)
  const tapRef = doc(collection(seasonRef, 'taps'))
  const batch = writeBatch(db)

  if (options.only !== 'season') {
    batch.set(tapRef, {
      personId: options.personId,
      uid: options.uid,
      tappedAt: options.tappedAt ?? Timestamp.now(),
      serverAt: serverTimestamp(),
    })
  }
  if (options.only !== 'tap') {
    batch.update(seasonRef, {
      total: increment(options.totalStep ?? 1),
      lastTapId: tapRef.id,
    })
  }
  return batch.commit()
}
