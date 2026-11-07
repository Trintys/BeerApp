// Firebase web config for the live project (happynewbeeer).
//
// This is safe to commit: it only identifies the project. What anyone can read
// or write is decided by the security rules (firestore.rules), not by this.

export const firebaseConfig = {
  apiKey: 'AIzaSyCphxcm8S0Pu-JSjw0MvpFITgA1gJkj3nU',
  authDomain: 'happynewbeeer.firebaseapp.com',
  projectId: 'happynewbeeer',
  storageBucket: 'happynewbeeer.firebasestorage.app',
  messagingSenderId: '157127941311',
  appId: '1:157127941311:web:838bc364dcd3f1ac84fa0a',
}

/**
 * Project ID used with the local Emulator. The "demo-" prefix means Firebase
 * treats it as offline-only, so nothing can ever reach the real project.
 */
export const EMULATOR_PROJECT_ID = 'demo-happy-new-beer'

export const EMULATOR_PORTS = { auth: 9099, firestore: 8080 }
