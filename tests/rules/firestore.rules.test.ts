// Security-rule tests: what clients can and can't do.
// Run with `npm run test:rules` (starts the Firestore Emulator for you).

import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  ADMIN_UID,
  INVITE_CODE,
  SEASON_ID,
  addMember,
  commitTap,
  createTestEnvironment,
  dbOf,
  seasonEnd,
  seasonStart,
  seedBasics,
  setSeason,
} from './helpers'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await createTestEnvironment()
})

beforeEach(async () => {
  await env.clearFirestore()
  await seedBasics(env)
})

afterAll(async () => {
  await env.cleanup()
})

const as = (uid: string) => dbOf(env.authenticatedContext(uid))
const anonymous = () => dbOf(env.unauthenticatedContext())

describe('joining', () => {
  test('anyone with a valid invite code can create their own device', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), 'devices', 'alice'), { personId: 'nikos', inviteCode: INVITE_CODE }),
    )
  })

  test('a wrong or missing invite code is rejected', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'devices', 'alice'), { personId: 'nikos', inviteCode: 'guess' }),
    )
    await assertFails(setDoc(doc(as('alice'), 'devices', 'alice'), { personId: 'nikos' }))
  })

  test('you cannot create a device for someone else', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'devices', 'bob'), { personId: 'nikos', inviteCode: INVITE_CODE }),
    )
  })

  test('signed-out visitors cannot join', async () => {
    await assertFails(
      setDoc(doc(anonymous(), 'devices', 'alice'), { personId: 'nikos', inviteCode: INVITE_CODE }),
    )
  })

  test('names must be Latin letters, lower case, single spaces', async () => {
    for (const personId of ['νίκος', 'Nikos', 'nikos  p', ' nikos', 'nikos1', 'a'.repeat(25)]) {
      await assertFails(
        setDoc(doc(as('alice'), 'devices', 'alice'), { personId, inviteCode: INVITE_CODE }),
      )
    }
    await assertSucceeds(
      setDoc(doc(as('alice'), 'devices', 'alice'), { personId: 'nikos p', inviteCode: INVITE_CODE }),
    )
  })

  test("the admin's reserved name cannot be claimed", async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'devices', 'alice'), { personId: 'billis', inviteCode: INVITE_CODE }),
    )
  })

  test('the admin can join as himself without an invite', async () => {
    await assertSucceeds(setDoc(doc(as(ADMIN_UID), 'devices', ADMIN_UID), { personId: 'billis' }))
  })

  test('extra fields on a device are rejected', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'devices', 'alice'), {
        personId: 'nikos',
        inviteCode: INVITE_CODE,
        isAdmin: true,
      }),
    )
  })

  test('after joining, you can create your own person once', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(dbOf(context), 'devices', 'alice'), {
        personId: 'nikos',
        inviteCode: INVITE_CODE,
      })
    })
    const people = collection(as('alice'), 'people')

    await assertFails(setDoc(doc(people, 'maria'), { displayName: 'Maria', joinedAt: serverTimestamp() }))
    await assertFails(setDoc(doc(people, 'nikos'), { displayName: 'Petros', joinedAt: serverTimestamp() }))
    await assertFails(
      setDoc(doc(people, 'nikos'), { displayName: 'Nikos', joinedAt: serverTimestamp(), reserved: true }),
    )
    await assertSucceeds(setDoc(doc(people, 'nikos'), { displayName: 'Nikos', joinedAt: serverTimestamp() }))
    // Once it exists it can't be changed.
    await assertFails(setDoc(doc(people, 'nikos'), { displayName: 'NIKOS', joinedAt: serverTimestamp() }))
  })

  test('you can only change the push token on your device', async () => {
    await addMember(env, 'alice', 'nikos')
    const device = doc(as('alice'), 'devices', 'alice')
    await assertSucceeds(updateDoc(device, { fcmToken: 'token-123' }))
    await assertFails(updateDoc(device, { personId: 'maria' }))
  })

  test('only members can see who has joined', async () => {
    await addMember(env, 'alice', 'nikos')
    await assertSucceeds(getDocs(collection(as('alice'), 'people')))
    await assertFails(getDocs(collection(as('stranger'), 'people')))
  })

  test('invite codes are never readable', async () => {
    await addMember(env, 'alice', 'nikos')
    await assertFails(getDoc(doc(as('alice'), 'invites', INVITE_CODE)))
    await assertFails(getDoc(doc(as(ADMIN_UID), 'invites', INVITE_CODE)))
  })
})

describe('tapping', () => {
  beforeEach(async () => {
    await addMember(env, 'alice', 'nikos')
  })

  test('a member can add one beer', async () => {
    await assertSucceeds(commitTap(as('alice'), { uid: 'alice', personId: 'nikos' }))
  })

  test('the total can only go up by exactly one', async () => {
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', totalStep: 2 }))
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', totalStep: -1 }))
  })

  test('the tap and the +1 only work together', async () => {
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', only: 'tap' }))
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', only: 'season' }))
  })

  test('you can only tap as yourself', async () => {
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'maria' }))
    await assertFails(commitTap(as('alice'), { uid: 'bob', personId: 'nikos' }))
  })

  test('non-members cannot tap', async () => {
    await assertFails(commitTap(as('stranger'), { uid: 'stranger', personId: 'nikos' }))
  })

  test('tap times in the future are rejected (beyond 5 minutes of clock drift)', async () => {
    const inTenMinutes = Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)
    const inOneMinute = Timestamp.fromMillis(Date.now() + 60 * 1000)
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', tappedAt: inTenMinutes }))
    await assertSucceeds(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', tappedAt: inOneMinute }))
  })

  test("tap times must fall inside the season's dates (end is exclusive)", async () => {
    const before = Timestamp.fromMillis(seasonStart.toMillis() - 1)
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', tappedAt: before }))

    // Move the season into the past so its end is before "now".
    const hour = 60 * 60 * 1000
    await setSeason(env, {
      startsAt: Timestamp.fromMillis(Date.now() - 2 * hour),
      endsAt: Timestamp.fromMillis(Date.now() - hour),
    })
    const atEnd = Timestamp.fromMillis(Date.now() - hour)
    const justBeforeEnd = Timestamp.fromMillis(Date.now() - hour - 1)
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', tappedAt: atEnd }))
    await assertSucceeds(commitTap(as('alice'), { uid: 'alice', personId: 'nikos', tappedAt: justBeforeEnd }))
  })

  test('closed and revealed seasons accept no taps (the hard cutoff)', async () => {
    await setSeason(env, { status: 'closed' })
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos' }))
    await setSeason(env, { status: 'revealed' })
    await assertFails(commitTap(as('alice'), { uid: 'alice', personId: 'nikos' }))
  })

  test('members can read the total but not the tap log', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'seasons', SEASON_ID)))
    await assertFails(getDocs(collection(as('alice'), 'seasons', SEASON_ID, 'taps')))
    await assertSucceeds(getDocs(collection(as(ADMIN_UID), 'seasons', SEASON_ID, 'taps')))
  })

  test('nobody but the scripts can create or delete seasons', async () => {
    await assertFails(
      setDoc(doc(as(ADMIN_UID), 'seasons', '2030'), {
        status: 'open',
        startsAt: seasonStart,
        endsAt: seasonEnd,
        total: 0,
      }),
    )
  })
})

describe('reveal', () => {
  beforeEach(async () => {
    await addMember(env, 'alice', 'nikos')
  })

  test('only the admin can close a season', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'seasons', SEASON_ID), { status: 'closed' }))
    await assertSucceeds(updateDoc(doc(as(ADMIN_UID), 'seasons', SEASON_ID), { status: 'closed' }))
  })

  test('steps go in order: open → closed → revealed', async () => {
    await assertFails(updateDoc(doc(as(ADMIN_UID), 'seasons', SEASON_ID), { status: 'revealed' }))
  })

  test('revealing needs the recap in the same batch', async () => {
    await setSeason(env, { status: 'closed' })
    const db = as(ADMIN_UID)
    await assertFails(updateDoc(doc(db, 'seasons', SEASON_ID), { status: 'revealed' }))

    const batch = writeBatch(db)
    batch.set(doc(db, 'seasons', SEASON_ID, 'recap', 'final'), { total: 0 })
    batch.update(doc(db, 'seasons', SEASON_ID), { status: 'revealed' })
    await assertSucceeds(batch.commit())
  })

  test('members can read the recap only once the season is revealed', async () => {
    const recap = doc(as('alice'), 'seasons', SEASON_ID, 'recap', 'final')
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(dbOf(context), 'seasons', SEASON_ID, 'recap', 'final'), { total: 0 })
    })
    await assertFails(getDoc(recap))
    await setSeason(env, { status: 'revealed' })
    await assertSucceeds(getDoc(recap))
  })
})

describe('time sync', () => {
  test('you can write the server time to your own document only', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'timeSync', 'alice'), { at: serverTimestamp() }))
    await assertFails(setDoc(doc(as('alice'), 'timeSync', 'alice'), { at: Timestamp.now() }))
    await assertFails(setDoc(doc(as('alice'), 'timeSync', 'bob'), { at: serverTimestamp() }))
  })
})
