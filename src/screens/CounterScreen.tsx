// Counter (README "Screens"): the shared total, a big + button and a small
// countdown. Plain on purpose: the design from Figma gets applied once picked.

import { backend, type Member, type Season } from '../data'
import { correctedNow } from '../lib/clock'
import { timeLeftText } from '../lib/countdown'
import { findCurrentSeason } from '../lib/seasons'

interface Props {
  member: Member
  /** The season running now (shown on screen). */
  season: Season
  /** All seasons, to file each tap under the season of its exact tap time. */
  seasons: Season[]
  /** The previous season, while its recap hasn't been revealed yet. */
  recapComing?: Season
  now: number
}

export function CounterScreen({ member, season, seasons, recapComing, now }: Props) {
  function addBeer() {
    // A tap belongs to the season containing its tap time (README "Seasons"),
    // which matters for a tap in the same second as midnight.
    const tappedAt = correctedNow()
    const tapSeason = findCurrentSeason(seasons, tappedAt)
    if (tapSeason) backend.tap(member, tapSeason.id, tappedAt)
  }

  return (
    <main className="screen counter">
      <header className="counter__top">
        <p className="countdown">
          <span className="countdown__dot" aria-hidden="true" />
          {timeLeftText(season.endsAt - now)}
        </p>
        <p className="total">{season.total}</p>
        <p className="muted">beers. all of us.</p>
        {recapComing && <p className="note">{recapComing.id} recap coming soon</p>}
      </header>

      <button className="plus-button" type="button" onClick={addBeer} aria-label="Add a beer">
        +
      </button>
    </main>
  )
}
