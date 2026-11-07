# Build plan

**Status: section 1 decided on 7 Nov 2026 (and written into the README). Sections 7 and 8, accent-stripping and `create-season` are still proposals that need a yes from both of us.** It covers how we build what `README.md` describes. The README stays the source of truth: if the two disagree, the README wins until we agree a change and update it.

**Goal:** the test run with the group in December 2026, then the real season from 1 January 2027.

---

## 1. Decide first

Decided on 7 Nov 2026. The README has the details.

| # | Question | Decision |
|---|---|---|
| 1 | Who owns which track? | **No fixed owners.** Either of us (or our agents) can pick up any task. The repo keeps everyone on the same page: decisions in the README, the plan here, work through branches and pull requests. |
| 2 | Do Figma mockups block development? | **No.** We build an MVP with plain screens now and apply the designs when they're picked. |
| 3 | When does the season start? | **Automatically, every year.** A season is a fixed calendar year (00:00 1/1 to 23:59:59 31/12, Athens). No Start button. At midnight the new season starts by itself; the old one waits for Reveal, and its recap then lives in a Results tab. |
| 4 | What happens to a removed person's taps? | **Removal isn't an app feature.** In the rare case it's needed, the admin removes the person **and everything that comes with them** (devices, taps, their share of the total) by hand in the Firebase console. |
| 5 | What dates does the test run use? | **December 2026**, exact dates still to be set. |
| 6 | Which Firestore location? | **`eur3` (Europe)**. |

---

## 2. Test these first

Each of these could change the design, so test them before building on top of them. Results go in this file.

| # | Test | Why it could go wrong | If it fails |
|---|---|---|---|
| A | **Installing and joining on iPhone** | On iPhone, Safari and the home-screen app don't share storage, and an invite link opens in Safari. The app may install without the invite code, and rejoining through the link would log in to Safari rather than the app. | Add a "paste your invite link" field to the installed app's Join screen |
| B | **Push on an iPhone in the EU** | Needs the installed app, permission from a tap, and delivery from the console composer. Also check that the composer reaches all web users. | Revisit the notification choice, since the app can't send push itself |
| C | **Google sign-in in the installed iPhone app** | Popup and redirect sign-in are known to be unreliable in home-screen apps. | Try setting `authDomain` to our `*.web.app` address, then discuss other ways to identify the admin |
| D | **Offline survival on iPhone and Android** | Taps must survive closing the app and restarting the phone with no signal. | Discuss a separate queue of our own in IndexedDB |
| E | **Security rules in the emulator** | The tap and counter rules in section 3 rely on two writes checking each other. | Rethink how the total is stored |

Tests A to D need real phones, so do them on a bare deployed app rather than on the dev machine.

---

## 3. Data model

```
invites/{code}                       no client can read this; created by hand in the console

people/{personId}                    one per human; personId is the normalised name
  displayName, joinedAt
  reserved                           true for Billis, so nobody can claim the name

devices/{uid}                        one per Firebase login; only its owner and the admin can read it
  personId, inviteCode, fcmToken

seasons/{seasonId}                   e.g. "test-2026", "2027"; the one document phones listen to
  status                             open | closed | revealed
  startsAt, endsAt
  total, lastTapId

seasons/{seasonId}/taps/{tapId}      only the admin can read these
  personId, uid, tappedAt, serverAt

seasons/{seasonId}/recap/final       readable once revealed; written once, never changed

timeSync/{uid}                       used only to measure the clock offset
```

### Why it's shaped this way

- **`people` and `devices` are separate so rejoining works.** A new phone gets a new anonymous ID, so that ID points to the same person through `devices`, and the stats don't split.
- **The total lives on the season document** so opening the app costs a single read. Phones never load the tap log. This keeps us inside the free 50,000 reads a day.
- **Taps are only readable by the admin** so personal counts stay hidden at the server too, not just in the UI.
- **There's no `count` field on a tap.** One document is one beer, so a tap can't be worth more than +1.
- **`endsAt` is exclusive: 00:00:00 on 1 January, Athens time** (`2027-12-31T22:00:00Z`). Tap times have milliseconds, and this also counts a tap at 23:59:59.5.

### Name normalising

Trim, collapse repeated spaces and lower-case, as the README says. We also suggest **stripping Greek accents**, so "Νίκος" and "Νικος" are the same person. This goes slightly beyond the README, so update it if agreed. Latin and Greek spellings ("Nikos" and "Νίκος") stay different people.

---

## 4. Key flows

### Join

1. Sign in anonymously.
2. Create `devices/{uid}` with the normalised name and the invite code. The rules check that the invite exists and that the person isn't reserved.
3. If `people/{personId}` doesn't exist, create it. If someone else created it first, treat them as the same person.

This order means someone without the code can't read anything, including who has joined.

### Tap

Each tap is filed under the season whose dates contain its `tappedAt`, and is one **batched write**, because batches queue offline and transactions don't:

1. Create the tap with `tappedAt` (corrected time) and `serverAt` (`serverTimestamp()`).
2. Update the season with `total: increment(1)` and `lastTapId: <this tap's ID>`.

The rules require both halves together, so nobody can raise the total without logging a tap, or the reverse. Firestore's persistent cache (`persistentLocalCache`) stores the queue in IndexedDB and updates the number on screen immediately.

Rules sketch, to be proven in test E:

```
match /seasons/{seasonId} {
  allow update: if isMember()
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['total', 'lastTapId'])
    && request.resource.data.total == resource.data.total + 1
    && !exists(tapPath(request.resource.data.lastTapId))
    && existsAfter(tapPath(request.resource.data.lastTapId));
}

match /seasons/{seasonId}/taps/{tapId} {
  allow read: if isAdmin();
  allow create: if isMember()
    && request.resource.data.keys().hasOnly(['personId', 'uid', 'tappedAt', 'serverAt'])
    && request.resource.data.personId == myDevice().personId
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.serverAt == request.time
    && season().status == 'open'
    && request.resource.data.tappedAt >= season().startsAt
    && request.resource.data.tappedAt < season().endsAt
    && request.resource.data.tappedAt <= request.time + duration.value(5, 'm')
    && getAfter(seasonPath()).data.lastTapId == tapId;
}
```

`isMember()` means the caller has a device document (a removed person's documents are deleted by hand). `isAdmin()` compares against Billis's Google account ID, which isn't a secret and can be committed in the rules file.

### Corrected time

Whenever the app opens online:

1. Note the phone's time, write `serverTimestamp()` to `timeSync/{uid}`, and read it back from the server.
2. Save `offset = server time − midpoint of the round trip` in local storage.

All time logic uses `Date.now() + offset`. The first measurement happens during joining, which is always online.

### Screen selection

There's no router. The screen comes from the state:

| State | Screen |
|---|---|
| No device document | Join |
| No season contains the current (corrected) time | Starts in… (countdown to the next season) |
| A season contains the current time | Counter, plus a "recap coming soon" note while the previous season isn't revealed yet |
| A season got revealed that this phone hasn't shown yet | Recap, once; after that it's in the Results tab |

### Reveal

The order matters, so a dead battery halfway through can be recovered by pressing Reveal again:

1. Wait for Billis's own queued taps to sync.
2. Set `status: closed`. This is the hard cutoff, and the server now rejects all taps.
3. Read the whole tap log **from the server, not the cache**, and calculate the stats in Europe/Athens time.
4. In one batch, create `recap/final` and set `status: revealed`.
5. Billis sends the push from the Firebase console.

The recap counts taps from the log, so it stays correct even if the live total has drifted.

### Season setup and wipe

Both are local scripts using the Admin SDK, with the key kept on Billis's laptop and out of git:

- `scripts/wipe`: deletes the test season's taps and recap, and the test people and devices.
- `scripts/create-season`: creates season documents ahead of time (the test season and the coming years), so each new year starts by itself at midnight with nothing to press. This is a small addition to the README, which only mentions `wipe`.

Invite codes are created by hand in the console, so they never touch the repo.

---

## 5. Milestones

| When | Milestone | Done when |
|---|---|---|
| 5–11 Nov | **Foundations:** decisions, Firebase project, app setup, deploy, tests A–E | The bare app is installed on one iPhone and one Android, and test results are written here |
| 12–18 Nov | **Core:** join, rejoin, security rules, counter, live total | Two phones see each other's taps live, and the rule tests pass |
| 19–25 Nov | **Season logic:** offline queue, corrected time, admin screen, countdown, midnight lock | A short fake season runs to its end with one phone in airplane mode |
| 26–30 Nov | **Finish line:** Reveal, basic recap, `wipe`, install on all 6 phones | A full fake season runs from Start through recap and wipe |
| December (dates TBD) | **Test run with the group** | Real use, with problems fixed as they appear |
| Right after the test run | **Test the reveal** | Reveal and push work for everyone |
| 22–28 Dec | **Polish and reset:** full recap, fixes, wipe | The real season is created and test data is gone |
| 1 Jan 2027 | **Real season starts** | |

**If we fall behind, cut in this order:** recap extras, then animations, then countdown drama. Don't cut offline sync, corrected time or the lock, because the test run exists to prove them.

---

## 6. Splitting the work

There are no fixed owners: either of us (or our agents) can pick up any task, and the tracks below are just a way to group the work. We both agree section 3 before writing code, since everything depends on it.

| Track | Covers |
|---|---|
| **Firebase and logic** | Security rules and tests, join and tap logic, offline, corrected time, reveal and stats calculation, scripts, push setup |
| **UI and feel** | All 5 screens, admin screen, countdown, recap presentation, animations, vibration and sound, icon and name |

The split point is a small `src/data/` layer: hooks like `useSeason()` and functions like `tap()`. The UI track can build against fake data until the real versions land.

Working habits:

- Short-lived branches and pull requests into `main`.
- Changes to `firestore.rules` get a passing test in the same pull request.
- Agreed changes go into the README in the same pull request.

---

## 7. Proposed additions

These are additions, not swaps. Nothing in the README's stack changes.

| Addition | Why |
|---|---|
| Firebase Emulator Suite with `@firebase/rules-unit-testing` | Security is in the rules, so the rules need real tests |
| Vitest | Stats, time and name logic is easy to get subtly wrong |
| `injectManifest` mode in `vite-plugin-pwa` | Push and offline both need the service worker, and sharing one avoids two workers competing for the same scope. The trade-off is that we write a small worker file by hand. |

---

## 8. Known risks

- **Changing the phone's clock while offline can still fool the lock.** The README says a changed clock doesn't matter, but this only holds while the app can re-measure the offset. Offline, someone could set their clock back and keep tapping after midnight, and the server would accept those taps until Reveal. We accept this for a group of friends, and the README should be reworded.
- **Tap times can be faked in general.** The rules only check that a time is within the season and not in the future. Same reasoning: it's a friend group.
- **iPhone can clear stored data.** If it does, queued taps are lost and the person must rejoin. Test D checks normal use, but this can't be ruled out entirely.
- **Removing a tap by hand takes two edits.** Delete the tap and lower `total` by one, both in the console.
- **Removing a person by hand takes several edits.** Delete their taps, devices and person document, and lower `total` by their number of taps. If they still have the invite link, change the invite code.
- **Billis has to sign in with Google on his phone** so his taps and admin rights share one account. This depends on test C.
- **Free-plan reads.** Each open phone uses one read per tap by anyone, which is nowhere near the daily limit. The recap's full read happens only at Reveal.
