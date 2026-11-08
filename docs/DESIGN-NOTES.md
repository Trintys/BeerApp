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
