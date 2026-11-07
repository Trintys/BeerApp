# Happy New Beer 🍺

A private app for one friend group (6 people: 3 iPhone, 3 Android) to count how many beers we drink **together** over a year. Everyone has the same big **+** button; every tap adds one to a shared total. At the end of the year there's a Spotify Wrapped–style reveal with stats and leaderboards.

It will never go on an app store. It's a web app (PWA) installed to each phone's home screen.

This file is the single source of truth for what we've decided. If you want to change a decision, discuss it first and update this file. Don't just change it in code.

---

## Stack

| Part | Choice |
|---|---|
| App | React + TypeScript, built with Vite |
| Installable app | `vite-plugin-pwa` (icon, fullscreen, offline shell) |
| Database | Firebase Firestore (live total, tap log, seasons) |
| Identity | Firebase Anonymous Auth + a display name |
| Hosting | Firebase Hosting (free `*.web.app` address) |
| Server-side safety | Firestore security rules |

Cost: €0 (Firebase Spark plan). Only a Google account is needed.

**Why not native / Expo:** getting a native app onto iPhones without the App Store means €99/year or relying on someone else's Apple developer account, plus extra install steps. A PWA installs once in about 20 seconds per phone.
**Why not Supabase:** free projects pause after a week of low activity, and this app has long quiet stretches.

---

## How it works (v1)

### Seasons
- One **season** = one calendar year. The first real season is **all of 2027**, ending **23:59 on 31/12/2027, Greek time (Europe/Athens)** for everyone.
- The admin (Billis) starts a season manually with a **Start** button.
- It's meant to repeat every year if the group likes it.
- **Test run before 2027:** we'll run it with the group in December 2026. Test data gets wiped before the real season with a local script (`wipe`, see "Reveal & notification").

### Joining
- Joining requires a **secret invite link** (`.../join?code=<long random code>`). Without the code you can't join. The **server checks the code** (via security rules), not just the UI.
- On join you type your name. Nothing else.
- **Rejoining / new phone:** open the invite link again and type the same name, and you're logged in as your existing user, so your stats don't split.
  - Names are normalised before comparing (trimmed, case-insensitive), so "Nikos", "nikos" and "Nikos " are the same person.
  - Known trade-off: anyone with the link who types an existing name becomes that person. That's acceptable for a private group of friends.
- The admin can see who has joined and remove people.
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

### Countdown
- The counter screen shows a small countdown to the end of the season under the total ("57 days left"), so it doesn't clutter the screen.
- It gets more dramatic towards the end (hours in the last days, a big ticking clock in the final hour, a takeover at midnight).

### End of year
1. **23:59:59 on 31/12 (Athens):** the season ends. Even offline, the app locks the + button at midnight (using corrected time) and shows **"Year's over, wait for your recap"**. No way to tap after midnight.
2. **Grace period:** offline phones that come back online sync their pre-midnight taps.
3. **Reveal:** once everyone has synced (e.g. the morning of 1 January), Billis presses **Reveal** in admin mode (see "Reveal & notification" below). It:
   - marks the season as revealed, which is the **hard cutoff**: from then on the server rejects every tap for that season, including late-syncing ones. If your phone was off for that long, too bad.
   - calculates the recap once from the tap log and saves it, so the recap is a **frozen snapshot** that never changes after people have seen it.
   - is followed by a **push notification** to everyone saying the recap is ready (sent from the Firebase console for now).
4. The app shows the **Wrapped-style reveal**: final total, leaderboards and personal stats (e.g. biggest night, most active hour, longest streak, first beer of the year).

Notification permission is granted during the initial phone setup, and each phone's notification subscription is saved so the sender can reach it.

### Server rules for taps
The Firestore security rules accept a tap only if:
- the user has joined (valid invite) and the tap is under their own ID
- it's exactly one beer (+1)
- the tap time is **within the season** (start ≤ tap time ≤ 23:59:59 31/12 Athens)
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
2. **Waiting to start**: shown before the admin presses Start. Others see "Waiting for the admin to start" plus who has joined; the admin sees the Start button.
3. **Counter**: the main screen. Big shared total, a big + button and a small countdown. This is 95% of the app.
4. **Wait for your recap**: from midnight on 31/12 until the reveal. The + button is gone.
5. **Recap**: the Wrapped-style reveal.

No install-guide screen: Billis installs the PWA on everyone's phone himself.

### Look & feel
- **Subtle, minimal visuals; the fun is in the tap.** Clean screens, one accent colour, lots of space. The entertainment comes from the interactions, not decoration.
- **Tactile, slightly 3D elements.** The + button presses down into its base, and small things (a "+1", bubbles, a sticker) pop out on tap.
- **Light mode only**, on a white base, with a bit of glass (frosted, light-catching surfaces like newer iOS). It's a personal app with its own character, not a copy of Apple's apps.
- Follows Apple-style design principles: feedback on touch-down, spring motion, and a calmer version for phones with reduced motion turned on.
- Mockups: [Figma file](https://www.figma.com/design/NAijoLEYKs1I2LcChjM8Pg).
- Details get decided screen by screen. Mockups get made in Figma before development.

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

## Open decisions

- **Reveal & notification mechanism**: a temporary choice is in place (see "Reveal & notification"). The goal of a true one-click is to be revisited later. It doesn't affect screens or data structure.
- **Build plan** ([`docs/PLAN.md`](docs/PLAN.md)): drafted, needs review from both of us.
- **App name on the home screen and icon.** We'll design them with the screens.
