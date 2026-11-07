// Fills the local Emulator with what you need to try the app:
//   - an invite code, so you can join at http://localhost:5173/join?code=dev-invite
//   - a "dev" season running from today for 57 days, and the 2027 season
//   - Billis as the reserved admin person
//
// Run it while `npm run emulators` is running:  npm run emulators:seed
// It only ever talks to the Emulator (demo project), never the live database.

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { EMULATOR_PORTS, EMULATOR_PROJECT_ID } from '../src/config/firebase'
import { athensMidnight, calendarYearSeason } from '../src/lib/seasons'

process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${EMULATOR_PORTS.firestore}`

const DAY_MS = 24 * 60 * 60 * 1000
const INVITE_CODE = 'dev-invite'

initializeApp({ projectId: EMULATOR_PROJECT_ID })
const db = getFirestore()

const today = new Date()
const devStart = athensMidnight(today.getFullYear(), today.getMonth() + 1, today.getDate())
const seasons = [
  { id: 'dev', startsAt: devStart, endsAt: devStart + 57 * DAY_MS },
  calendarYearSeason(2027),
]

await db.doc(`invites/${INVITE_CODE}`).set({ note: 'Emulator only' })
for (const season of seasons) {
  await db.doc(`seasons/${season.id}`).set({
    status: 'open',
    startsAt: Timestamp.fromMillis(season.startsAt),
    endsAt: Timestamp.fromMillis(season.endsAt),
    total: 0,
  })
}
await db.doc('people/billis').set({ displayName: 'Billis', joinedAt: Timestamp.now(), reserved: true })

console.log(`Seeded the Emulator. Join at http://localhost:5173/join?code=${INVITE_CODE}`)
