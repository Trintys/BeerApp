// Picks the screen from the current state. There's no router: see
// docs/PLAN.md "Screen selection".

import { useNow, useSeasons, useSession } from './data'
import { findCurrentSeason, findNextSeason, findPreviousSeason } from './lib/seasons'
import { CounterScreen } from './screens/CounterScreen'
import { JoinScreen } from './screens/JoinScreen'
import { MessageScreen } from './screens/MessageScreen'
import { StartsInScreen } from './screens/StartsInScreen'

export function App() {
  const session = useSession()
  const seasons = useSeasons(session.state === 'member')
  const now = useNow()

  if (session.state === 'loading') return <MessageScreen title="Loading…" />
  if (session.state === 'guest') return <JoinScreen inviteCode={inviteCodeFromUrl()} />
  if (!seasons) return <MessageScreen title="Loading…" />

  const current = findCurrentSeason(seasons, now)
  if (!current) return <StartsInScreen nextSeason={findNextSeason(seasons, now)} now={now} />

  const previous = findPreviousSeason(seasons, now)
  const recapComing = previous && previous.status !== 'revealed' ? previous : undefined
  return (
    <CounterScreen member={session} season={current} seasons={seasons} recapComing={recapComing} now={now} />
  )
}

/** The invite link is `…/join?code=<code>`. */
function inviteCodeFromUrl(): string | null {
  return new URLSearchParams(location.search).get('code')
}
