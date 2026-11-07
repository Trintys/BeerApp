// Join (README "Joining"): only reachable through the invite link; you type your name.

import { useState, type FormEvent } from 'react'
import { backend } from '../data'
import { MAX_NAME_LENGTH, nameProblem } from '../lib/names'
import { MessageScreen } from './MessageScreen'

interface Props {
  inviteCode: string | null
}

export function JoinScreen({ inviteCode }: Props) {
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!inviteCode) {
    return <MessageScreen title="Happy New Beer 🍺" text="Open the invite link you were sent to join." />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const problem = nameProblem(name)
    if (problem) {
      setError(problem)
      return
    }
    setJoining(true)
    setError(null)
    try {
      await backend.join(name, inviteCode!)
    } catch (joinError) {
      console.warn('[join] failed', joinError)
      setError("Couldn't join. Check the invite link, or try another name.")
      setJoining(false)
    }
  }

  return (
    <main className="screen screen--centered">
      <h1 className="title">Happy New Beer 🍺</h1>
      <form className="join-form" onSubmit={handleSubmit}>
        <label className="muted" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH + 10}
          autoComplete="given-name"
          autoCapitalize="words"
          autoFocus
        />
        {error && <p className="error">{error}</p>}
        <button className="primary-button" type="submit" disabled={joining}>
          {joining ? 'Joining…' : 'Join'}
        </button>
        <p className="muted small">Same name on a new phone = same person. Latin letters only.</p>
      </form>
    </main>
  )
}
