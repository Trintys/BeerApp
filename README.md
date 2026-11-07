# Happy New Beer 🍺

A private app for one friend group (6 people: 3 iPhone, 3 Android) to count how many beers we drink **together** over a year. Everyone has the same big **+** button; every tap adds one to a shared total. At the end of the year there's a Spotify Wrapped–style reveal with stats and leaderboards.

It will never go on an app store. It's a web app (PWA) installed to each phone's home screen.

This file is the single source of truth for what we've decided. If you want to change a decision, discuss it first and update this file. Don't just change it in code.

**Working together:** two of us (and our AI agents) build this in parallel, with no fixed owners: anyone can pick up any part. The repo keeps everyone on the same page: decisions live here, the build plan in [`docs/PLAN.md`](docs/PLAN.md), and for now we commit straight to `main` (branches and pull requests come later, once many things happen in parallel). **AI agents only commit locally and never push or open pull requests unless told to**; a human reviews and pushes.

---

## Stack

| Part | Choice |
|---|---|
| App | React + TypeScript, built with Vite |
| Installable app | `vite-plugin-pwa` (icon, fullscreen, offline shell) |
| Database | Firebase Firestore (live total, tap log, seasons), location **`eur3` (Europe)**; can't be changed after creation |
| Identity | Firebase Anonymous Auth + a display name |
| Hosting | Firebase Hosting (free `*.web.app` address) |
| Server-side safety | Firestore security rules |
| Dev tools | Firebase Emulator Suite (local Firebase for running and testing), `@firebase/rules-unit-testing` (security-rule tests), Vitest (time, season, name and stats logic), `vite-plugin-pwa` in `injectManifest` mode (one hand-written service worker for offline and push) |

Cost: €0 (Firebase Spark plan). Only a Google account is needed. The Firebase project is created under **Billis's Google account**, the same one he uses as admin.

**Why not native / Expo:** getting a native app onto iPhones without the App Store means €99/year or relying on someone else's Apple developer account, plus extra install steps. A PWA installs once in about 20 seconds per phone.
**Why not Supabase:** free projects pause after a week of low activity, and this app has long quiet stretches.

---

## How it works (v1)

### Seasons
- One **season** = one calendar year, from **00:00 on 1/1 to 23:59:59 on 31/12, Greek time (Europe/Athens)** for everyone. The first real season is **all of 2027**.
- **Seasons start automatically every year.** There is no Start button: at midnight on 1 January the new season begins by itself and the counter starts again from 0. Nobody has to be online for it. (How: a local script, `create-season`, creates the season records for the coming years in advance.)
- A tap always belongs to the season whose dates contain its tap time. So there is never an overlap: a beer at 23:58 on 31/12 counts for the old year, a beer at 00:05 on 1/1 for the new one.
- The old year's results come later, when the admin presses **Reveal** (see "End of year"). Until then everyone just keeps tapping in the new year.
- **Test run before 2027:** in **December 2026** with the group (exact dates still to be set). It's a separate test season with its own dates. Test data gets wiped before the real season with a local script (`wipe`, see "Reveal & notification").

### Joining
- Joining requires a **secret invite link** (`.../join?code=<long random code>`). Without the code you can't join. The **server checks the code** (via security rules), not just the UI.
- On join you type your name. Nothing else.
- **Rejoining / new phone:** open the invite link again and type the same name, and you're logged in as your existing user, so your stats don't split.
  - **Names use Latin letters only** (the Join screen refuses Greek or other scripts), so "Nikos" and "Νίκος" can't become two people.
  - Names are normalised before comparing (trimmed, case-insensitive), so "Nikos", "nikos" and "Nikos " are the same person.
  - Known trade-off: anyone with the link who types an existing name becomes that person. That's acceptable for a private group of friends.
- The admin can see who has joined (in admin mode).
- **Removing a person is not an app feature.** In the rare case it's needed (e.g. a stranger got the link), the admin does it by hand in the Firebase console and **removes everything that comes with them**: the person, their devices and all their taps, and lowers the total to match. If they still have the invite link, change the invite code too.
- The admin (Billis) signs in with Google in admin mode; his account can't be reclaimed by typing his name.
- No real auth (passwords/accounts) for now.

### Tapping
- Tap **+** and the shared total goes up by one. Other people's taps show up live.
- **Personal counts are hidden** until the end-of-year reveal, so the reveal stays a surprise.
- **No undo.** If someone really insists on fixing a misclick, the admin removes it from the database by hand. That's a rare exception, not a feature.
- **Every tap is logged** with who tapped and **when**, because the Wrapped stats depend on it.

### Offline / bad signal
- Taps work without signal: the number goes up immediately on the phone, and the tap is saved in the phone's storage (not just in memory), then synced silently when the app is open and has signal again.
- **No "waiting to sync" hint.** If people see that a tap hasn't synced, they might tap again.
- **Everything counts by the tap's time: the moment it was tapped on the phone, not when it reached the server.** That keeps the stats correct, and a beer tapped offline at 23:58 on 31/12 still counts for that year even if it syncs after midnight.
  - We also store the server time the tap arrived, as a sanity check.

### Corrected time (used for the lock and the countdown)
- Whenever the app is online, it measures the **offset between the phone's clock and server time** and saves it on the phone.
- All time logic (tap times, the midnight lock, the countdown) uses `phone clock + last saved offset`, so it keeps working offline and a wrong or changed phone clock doesn't matter.
  - Accepted gap: someone who changes their clock while offline could still fake tap times. We trust users in v1, so we don't guard against it.

### Countdown
- The counter screen shows a small countdown to the end of the season under the total ("57 days left"), so it doesn't clutter the screen.
- It gets more dramatic towards the end (hours in the last days, a big ticking clock in the final hour, a takeover at midnight).

### End of year
1. **23:59:59 on 31/12 (Athens):** the season ends and the next one starts automatically. Even offline, the app switches at midnight (using corrected time): the total starts again from 0 for the new year, and the counter shows a small **"2027 recap coming soon"** note until the reveal. Taps after midnight count for the new year. There's no way to add a tap to the old year after midnight.
2. **Grace period:** offline phones that come back online sync their pre-midnight taps to the old season.
3. **Reveal:** once everyone has synced (e.g. the morning of 1 January), Billis presses **Reveal** in admin mode (see "Reveal & notification" below). It:
   - marks the season as revealed, which is the **hard cutoff**: from then on the server rejects every tap for that season, including late-syncing ones. If your phone was off for that long, too bad.
   - calculates the recap once from the tap log and saves it, so the recap is a **frozen snapshot** that never changes after people have seen it.
   - is followed by a **push notification** to everyone saying the recap is ready (sent from the Firebase console for now).
4. The app shows the **Wrapped-style reveal**: final total, leaderboards and personal stats (e.g. biggest night, most active hour, longest streak, first beer of the year).
5. Afterwards, every past season's recap stays available in a **Results** tab. The counter always shows the current year, so for everyone except the admin there is no overlap between seasons.

Notification permission is granted during the initial phone setup, and each phone's notification subscription is saved so the sender can reach it.

### Server rules for taps
The Firestore security rules accept a tap only if:
- the user has joined (valid invite) and the tap is under their own ID
- it's exactly one beer (+1)
- the tap time is **within the season it's filed under** (00:00 1/1 ≤ tap time ≤ 23:59:59 31/12 Athens)
- the tap time is **not in the future** compared to server time (small allowance for clock drift)
- the season is **not yet revealed**

### Reveal & notification: TEMPORARY CHOICE (to be revisited)
What's needed: `reveal` (hard cutoff + recap + "recap ready" push to everyone) and `wipe` (delete test-run data). Only Billis triggers them. Billis's goal is **one click**, without needing a laptop.

**Current temporary choice: Firebase only, no paid plan.**
- **Prep / `wipe`:** a script Billis runs locally (Firebase Admin SDK) before the real season. A laptop is fine here, since it's not needed on holiday. The service-account key stays on his laptop only and is never committed (`.gitignore`).
- **Reveal:** a **button in the app's admin mode**. It marks the season revealed (hard cutoff) and saves the recap. Allowed only for the admin by the security rules, so no key is needed.
- **Notification:** Billis sends "Your recap is ready 🍺" by hand from the **Firebase console's notification composer** right after pressing Reveal. This means the app uses **Firebase Cloud Messaging (FCM)** for push subscriptions (not plain Web Push).
- **Admin identity:** Billis signs in with Google in admin mode only, and the rules check his account ID, so nobody can become admin by typing "Billis".
- Trade-off accepted for now: the notification is a second manual step outside the app.

Facts established so far:
- Cutoff and recap **don't need any secret key**. They can be an admin-only action protected by security rules.
- **Sending a push always needs a secret key on a server.** All major push services block requests sent directly from a web page (CORS), so the app itself can never send it. A key put inside the app is readable by anyone.
- Firebase Cloud Functions (the in-Firebase server) **require the Blaze plan**, which needs a payment card. Billis doesn't want to use his main card.

Alternatives kept for the later discussion:
1. **Blaze + Cloud Function** behind an in-app admin button. One click, all in Firebase. Needs a payment method Google accepts (a Revolut virtual card is untested: test on a throwaway project first). Protect with a Firebase **spend cap budget** (pauses the service when exceeded; not instant) and a low card limit.
2. **Free Cloudflare Worker** that only sends the push, called by the in-app admin button. One click, no card, one extra account.
3. **Automatic:** fixed release time stored in the database (rules use server time for the cutoff), recap computed by each phone from the frozen log, and the notification scheduled in advance in the Firebase console. Zero clicks, Firebase only.
4. **GitHub Actions** workflow holding the key, started from the GitHub mobile app (or from the app via a repo-scoped GitHub token).

Whatever is chosen: **no secret key ever goes in the app or the repo.**

---

## Screens (v1)

1. **Join**: name field + button (only reachable through the invite link).
2. **Starts in…**: shown only when no season is running yet (e.g. between the test run and 1 January 2027). A countdown to the start plus who has joined. No Start button: the season starts on its own.
3. **Counter**: the main screen. Big shared total, a big + button and a small countdown. This is 95% of the app. Between midnight on 31/12 and the reveal it also shows a small "recap coming soon" note for the old year.
4. **Recap**: the Wrapped-style reveal, shown when a season is revealed.
5. **Results**: a tab with the recaps of all past seasons.

No install-guide screen: Billis installs the PWA on everyone's phone himself.

### Look & feel
- **Subtle, minimal visuals; the fun is in the tap.** Clean screens, one accent colour, lots of space. The entertainment comes from the interactions, not decoration.
- **Tactile, slightly 3D elements.** The + button presses down into its base, and small things (a "+1", bubbles, a sticker) pop out on tap.
- **Light mode only**, on a white base, with a bit of glass (frosted, light-catching surfaces like newer iOS). It's a personal app with its own character, not a copy of Apple's apps.
- Follows Apple-style design principles: feedback on touch-down, spring motion, and a calmer version for phones with reduced motion turned on.
- Mockups: [Figma file](https://www.figma.com/design/NAijoLEYKs1I2LcChjM8Pg).
- Details get decided screen by screen in Figma. **Development doesn't wait for the designs:** we build an MVP with plain screens first and apply each design when it's picked.

#### Counter screen: where the design stands (Nov 2026)
Each Figma page is one round of exploration (`Counter – v2` … `Counter – v9`).
- **Top half: settled (v6).** The countdown ("● 57 days left", amber dot), the big shared total in Bricolage Grotesque ExtraBold, and "beers. all of us." underneath. It's a Figma component (`Counter / Top half (v6)`) that every later version reuses unchanged.
- **The + button: being explored, not decided yet.**
  - Requirements we've agreed on: minimal (one object, nothing fancy), **yellow/amber in the bottom half**, and it has to feel logical (a big obvious target, feedback on touch-down, the action on release). On release there's a **"clack" sound together with a beer "+1" pop**. The sound is optional on iPhone (see "Phone limitations"), so the visual pop alone must feel complete. Slide your finger off to cancel, and a calmer version for reduced motion.
  - v7 tried 8 abstract buttons (keycap, tally clicker, cheers, beer tap, coaster, cap jar, stamp, glass pill). Conclusion: the button should be **the product itself**.
  - v8 tried 8 product buttons (2 each: glass face down, draft tap/lever, glass, can). Favourite: **the beer mug** (v8 Press 6).
  - **v9 (current): 20 variations of the mug**, each a clickable Figma prototype. Press makes the mug sink and squash a little. Release makes it **wiggle left and right, beer drops and foam spill out on both sides onto the ground**, the "+1 🍺" pops up, and it resets. The variations change one or two things each: mug shape, foam, how the + looks, beer colour, what it stands on, how far it wiggles, how many drops spill.
  - **v10: 11 graphic styles of the same mug** (flat, clay 3D, liquid glass, ink sketch, pixel art, retro cartoon, neo-brutalist, low-poly, soft focus, paper cut, real glass). Same interaction in all: press, then a "clink" (tips left, rebounds right), foam flies out on both sides, "+1" pops, reset. Learning: changing only the surface keeps them looking alike (same front-on, emoji-like silhouette).
  - **v11: viewpoint and silhouette.** 6 vector variants (top-down, three-quarter with sloshing foam, hero low angle, woodcut tankard, abstract jelly, Swiss top-down) and 3 photoreal ones from AI-generated images (3/4, top-down, hero close-up). Each has its own motion; the depth press (shrinks into the screen, shadow tightens) appears in Mug 11 (v10) and the photo variants.
  - Next step: let v10 and v11 sit for a while, then pick a direction (or mix) and update this section with the final choice. States since v10: Rest, Pressed, Clink, Rebound, Spill, Settle.
- Shared pieces in Figma: the `Beer pop` component (amber "+1" with a small mug), and each button as a component set with its states (Rest, Pressed, Wiggle left, Wiggle right, Spill, Settle in v9).

---

## Phone limitations to design around

These are things a home-screen web app can and can't do. Check here before designing a feature.

| Feature | iPhone (Safari/WebKit) | Android (Chrome) | What we do |
|---|---|---|---|
| Sync while app is closed | ❌ No Background Sync | ✅ | Sync on next app open (queue in IndexedDB/local storage) |
| Live updates while open | ✅ | ✅ | Use freely |
| Animations / visual effects | ✅ | ✅ | **Main source of fun** (tap interactions) |
| Vibration | ⚠️ No `navigator.vibrate`; works via the hidden `<input type="checkbox" switch>` trick (Safari 17.4+). It's a hack and could break | ✅ `navigator.vibrate` | Use on both (e.g. `web-haptics` library), but **nothing may depend on it** |
| Sound | ⚠️ Muted by the silent switch unless `navigator.audioSession.type = 'playback'`; reported iOS 26 bug where Web Audio in home-screen apps only works on first run | ✅ | **Optional.** Nice-to-have only |
| Push notifications | ⚠️ Only when installed to the home screen, and permission must be asked from a tap | ✅ | Grant during setup; FCM, sent from the Firebase console for now; **test early on an iPhone in the EU** |
| Sending push from the app itself | ❌ blocked by CORS | ❌ blocked by CORS | Always needs a server holding the key; for now sent from the Firebase console |
| Scheduled server jobs | n/a | n/a | Need Firebase's paid Blaze plan; not used for now |
| Home-screen widget | ❌ | ❌ (not for PWAs) | Not in v1 |

---

## Out of scope for v1 (future ideas)

- Each person's year ends at their own local midnight, with results once everyone has passed midnight
- Multiple friend groups / rooms ("clusters"); if this happens, revisit auth
- Real logins
- Undo
- Home-screen widget
- Native app, if the PWA feels limiting

---

## Development

### First-time setup
1. Install **Node.js** (LTS) and **Java 21** (the Firebase Emulator needs Java).
2. In the repo: `npm install`. The Firebase CLI comes with it, so use `npx firebase …` (no global install needed).

### Everyday commands

| Command | What it does |
|---|---|
| `npm run dev:fake` | App with fake in-memory data, no Firebase at all. Friends "tap" every few seconds. Quickest way to work on screens. Open `http://localhost:5173/join?code=anything`. |
| `npm run emulators` | Starts a local Firebase (Auth + Firestore) on your laptop. UI at `http://localhost:4000`. Leave it running. |
| `npm run emulators:seed` | With the emulators running: adds an invite code (`dev-invite`), a season running now, the 2027 season and Billis as the reserved admin. |
| `npm run dev` | App against the local emulators. Join at `http://localhost:5173/join?code=dev-invite`. A phone on the same Wi-Fi can open `http://<laptop-ip>:5173/…` too. |
| `npm test` | Unit tests (names, seasons and Athens time, countdown). |
| `npm run test:rules` | Security-rule tests. Starts the Firestore emulator by itself, runs `tests/rules`, stops it. |
| `npm run build` | Type-checks and builds the installable app into `dist/` (talks to the **live** project). |
| `npm run lint` | Lint. |

The emulator uses a demo project (`demo-happy-new-beer`), so local work can never touch the live data.

### Where things are
- `firestore.rules`: all security. Every rule has a test in `tests/rules/`.
- `src/data/`: the data layer. Screens only talk to `backend` and the hooks (`useSession`, `useSeasons`, `usePeople`, `useNow`). `firebaseBackend.ts` is the real one, `fakeBackend.ts` the fake one, `backend.ts` picks one.
- `src/lib/`: plain logic with unit tests: `names.ts`, `seasons.ts` (Athens time, which season a moment belongs to), `countdown.ts`, `clock.ts` (corrected time).
- `src/screens/`: one file per screen. `src/App.tsx` picks the screen from the state.
- `src/sw.ts`: the service worker (offline now, push later).
- `scripts/`: local scripts. `seed-emulator.ts` for now; `create-season` and `wipe` come later.
- `src/config/firebase.ts`: the live project's web config. Public, safe to commit.

### Firebase project
- Project ID **`happynewbeeer`** (three e's; it can't be renamed). If we want a cleaner app address than `happynewbeeer.web.app`, we add a second Hosting site with its own name (free).
- Placeholders to fill in later: the admin's account ID in `firestore.rules` (`adminUid()`, after Billis's first Google sign-in), and the app name and icon in `vite.config.ts` and `public/icons/`.

---

## Open decisions

- **Reveal & notification mechanism**: a temporary choice is in place (see "Reveal & notification"). The goal of a true one-click is to be revisited later. It doesn't affect screens or data structure.
- **App name on the home screen and icon.** We'll design them with the screens.
- **Counter + button design**: a beer mug that clinks and spills (see "Counter screen: where the design stands"). The direction still has to be picked from Figma v10/v11. Not blocking development.
- **Test run dates**: December 2026, exact dates to be set.
