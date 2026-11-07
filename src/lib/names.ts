// Names (README "Joining"): Latin letters only, compared trimmed and case-insensitive.
// The security rules enforce the same format on the person ID (firestore.rules).

export const MAX_NAME_LENGTH = 24

const LATIN_WORDS = /^[A-Za-z]+( [A-Za-z]+)*$/

/** Trims and collapses repeated spaces, keeping the person's own capitals ("  nikos  P " → "nikos P"). */
export function tidyName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/** The ID people are compared by, and the people/{personId} document ID ("Nikos " → "nikos"). */
export function toPersonId(raw: string): string {
  return tidyName(raw).toLowerCase()
}

/** Why a name can't be used, or null if it's fine. Shown on the Join screen. */
export function nameProblem(raw: string): string | null {
  const name = tidyName(raw)
  if (name === '') return 'Type your name.'
  if (name.length > MAX_NAME_LENGTH) return `Keep it under ${MAX_NAME_LENGTH + 1} characters.`
  if (!LATIN_WORDS.test(name)) return 'Use Latin letters only (a–z), no numbers or symbols.'
  return null
}
