// Starts in… (README "Screens"): shown when no season is running yet.
// A countdown to the next season plus who has joined. No Start button.

import { usePeople, type Season } from '../data'
import { startsInText } from '../lib/countdown'

interface Props {
  nextSeason: Season | undefined
  now: number
}

export function StartsInScreen({ nextSeason, now }: Props) {
  const people = usePeople(true)

  return (
    <main className="screen screen--centered">
      <h1 className="title">{nextSeason ? `Starts ${startsInText(nextSeason.startsAt - now)}` : 'No season yet'}</h1>
      <p className="muted">
        {nextSeason ? 'The counter opens by itself at midnight.' : 'The admin hasn’t scheduled the next season.'}
      </p>
      {people && (
        <section className="people">
          <h2 className="muted small">Joined so far</h2>
          <ul>
            {people.map((person) => (
              <li key={person.id}>{person.displayName}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
