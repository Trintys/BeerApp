interface ImportMetaEnv {
  /** Which backend the app uses: see src/data/backend.ts. */
  readonly VITE_BACKEND?: 'live' | 'emulator' | 'fake'
}
