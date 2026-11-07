// The one place that decides which backend the app talks to.
//
//   npm run dev        → the local Firebase Emulator (VITE_BACKEND=emulator, see .env.emulator)
//   npm run dev:fake   → in-memory fake data, no Firebase at all (.env.fake)
//   npm run build      → the live Firebase project

import { createFakeBackend } from './fakeBackend'
import { createFirebaseBackend } from './firebaseBackend'
import type { Backend } from './types'

type BackendMode = 'live' | 'emulator' | 'fake'

const mode = (import.meta.env.VITE_BACKEND ?? 'live') as BackendMode

export const backend: Backend =
  mode === 'fake' ? createFakeBackend() : createFirebaseBackend({ useEmulators: mode === 'emulator' })
