# Design notes: Counter screen

The reasoning and feedback behind the counter-screen design, collected while designing in Figma ([file](https://www.figma.com/design/NAijoLEYKs1I2LcChjM8Pg)). The README holds the agreed decisions ("Counter screen: where the design stands"); this file holds the why.

## Visual direction (agreed)
- **Not goofy or over-stimulating.** v1 (beer glass, arcade, sticker bomb) was too much. The visuals stay subtle and minimal; the fun lives in the tap interaction.
- **Tactile, slightly 3D tap elements** that "pop out", so the click animation feels good. v2 (flat minimal) was too far the other way.
- **Light mode only, white base, a bit of glass** (newer-iOS-style frosted, light-catching surfaces). A **glossy** finish on the button object is welcome.
- **Follow Apple's design principles, don't copy Apple's apps.** v3 looked like a stock iOS app. It's a personal app with its own character. Reference: `apple-design` skill in [emilkowalski/skills](https://github.com/emilkowalski/skills) (feedback on touch-down, springs, restraint, reduced motion).

## What's liked so far
- **Top half (v4 option "3 · Bottle cap", settled in v6):** chunky Bricolage Grotesque total, left-aligned ("1284" / "beers. all of us."), small amber dot + "57 days left" above. Reused unchanged since v6; only the button changes.
- **The can-opening *sound*** as a satisfying tap feedback.
- **The beer mug as the button** (v8 Press 6), explored further in v9–v11.
- **Ink sketch style (v10 Mug 4):** wobbly black ink, off-register yellow marker fill, hatching, doodled foam, crooked +. Liked enough to explore in v12.
- **Rising bubbles (v12 Pilsner):** small ink bubbles inside the glass that drift up and fade during the clink. Really liked; added to every glass vessel in v12 (not the lidded stein or the keg, which aren't see-through).

## Rejected and why
- **Bottle-cap button (v4):** didn't like the button itself.
- **Can opening as the button (v5):**
  1. **UX mismatch:** opening a can is a pull, not a push. The app's core action is a button press, so the metaphor must be something you *push* in real life.
  2. **Not beer-specific:** cola cans make the same sound.
- **Beer tap** (not mocked): iconic, but it's a pull, so it fails the same rule.
- **Side-view illustrations (first v6: swing-top bottle, opener, cheers mugs, table slam, mat):** understood, but they **didn't look like buttons**. They read as pictures.
- **v10 learning:** changing only the graphic style keeps the variants looking alike (same front-on, emoji-like silhouette), which led to v11 (viewpoint) and v12 (vessel shape).

## Rule for the button metaphor (from v6)
The + button is mandatory. Whatever real-world experience it represents must:
1. involve a **push / press** action, so tapping feels natural,
2. be **distinctly beer**, not shared with soft drinks, and
3. read as something pressed **into the screen** (visible depth / squash on press).

## v12 · Ink shapes (Figma page "Counter – v12 ink shapes")
- Same ink style and same motion as v10 Mug 4: press squashes; release clinks (tips left, rebounds right), foam flies out and lands on the ground, "+1" pops, reset. States: Rest, Pressed, Clink, Rebound, Spill, Settle.
- 8 vessels: Nonic pint, Tulip, Weizen, Lidded stein (lid flips open on the clink), Longneck (crown cap flies off and lands on the ground; a new one is on for the next tap), Beer boot, Keg (side tap, overflowing foam), Pilsner.
- Bubbles on all glass ones: Nonic, Tulip, Weizen, Longneck, Beer boot, Pilsner.
- The "+1" is redrawn in ink: Figma component `Beer pop / Ink` (ink "+1" on an off-register yellow marker blob with burst ticks).
- Status (8 Nov 2026): Billis is running v12 by the group before picking.

## Other screens: loose wireframes (9 Nov 2026)
First rough pass at every screen besides the counter's + button. **Layout ideas only, nothing decided** (examples show 1 January 2028, before and after the 2027 reveal): no visual style yet, and the counter's look gets applied once it's picked. They follow "Screens (v1)" and "End of year" in the README; if the README changes, these get redrawn, not kept as old versions.

```
 1 · Join               2 · Starts in…          3 · Counter after midnight
+------------------+   +------------------+   +------------------+
|                  |   | Starts in        |   | ● 364 days    ☰ |
| Happy New Beer   |   | 21 days          |   | 12               |
| You're invited.  |   |                  |   | beers. all of us.|
| What do your     |   | 0                |   |                  |
| friends call you?|   | beers. all of us.|   | [2027 recap      |
| [Nikos         ] |   |                  |   |  coming soon]    |
| [     Join     ] |   | Who's in · 5/6   |   |                  |
|                  |   | (B)(N)(M)(K)(E)? |   |       [ + ]      |
| then: allow      |   |                  |   |                  |
| notifications    |   | (no + button)    |   |                  |
+------------------+   +------------------+   +------------------+

 4 · Recap (story cards) 5 · My seasons         Admin mode (Billis)
+------------------+   +------------------+   +------------------+
| ==== ---- ---- --|   | My seasons       |   | Admin · Billis   |
|                  |   |                  |   | Season 2028      |
| Together, in     |   | [2027  3,412   >]|   |  running         |
| 2027, you drank  |   | [2026 test 214 >]|   | Season 2027      |
| 3,412            |   |                  |   |  ended, syncing  |
| beers            |   |                  |   | [ Reveal 2027  ] |
|                  |   |                  |   |  confirm, then   |
| tap right: next  |   |                  |   |  push via console|
| tap left: back   |   |                  |   | Who's joined (6) |
|                  |   |                  |   |  B N M K E A     |
+------------------+   +------------------+   +------------------+
```

Notes per screen:
- **1 · Join:** name + Join. Then a separate "allow notifications" step: iPhone only allows the permission request from a tap, so it can't be a popup on load. Done while Billis installs the app on each phone. Edge state still without a screen: opening the app without a valid invite link ("You need an invite link").
- **2 · Starts in…:** only when no season is running (e.g. between the test run and 1 January 2027). Reuses the counter's top half at 0 with the countdown to the start, so the switch to the counter at midnight feels like the same place coming alive. Joined people pop in live. No + button, no Start button.
- **3 · Counter after midnight:** the normal counter, already counting the new year from 0, plus a small "2027 recap coming soon" note until the reveal. The note could become the entry point to the recap once it's revealed. ☰ opens the menu: My seasons (+ Admin on Billis's devices).
- **4 · Recap:** full-screen story cards, Wrapped-style. Rough order: group total → biggest group night → leaderboard → your total → your biggest night / most active hour / longest streak / first beer → shareable summary card. Personal cards after the group ones so the leaderboard builds suspense. Opens from the push notification or the note on the counter.
- **5 · My seasons:** one row per past season (total + open its recap), from the ☰ menu. Menu vs. tab gets iterated in Figma. The test season could show here too, or be wiped before it does.
- **Admin mode:** only what the README gives it: Google sign-in, who has joined, and Reveal. Reached through "Admin" in the ☰ menu, shown only on devices signed in as Billis (more than one is fine). Reveal is irreversible, so it needs a strong confirm, then reminds Billis to send the push from the Firebase console. No remove button (removing is done by hand in the Firebase console).

Decided (10 Nov 2026, now also in the README):
- **My seasons** is reached from a ☰ menu on the counter (working choice; tab vs. menu to be iterated in Figma).
- **Admin** is an item in the same menu, only for Billis's account, on any of his devices.
- **Leaderboard** in the recap always shows everyone, full ranking.
