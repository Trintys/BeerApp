# CLAUDE.md

Project context and every agreed decision live in the README. Read it before doing anything:

@README.md

## Working rules

- **Follow the decisions in README.md exactly.** Don't swap libraries, services or approaches on your own. If something in the plan doesn't work (a library misbehaves, a platform limit gets in the way), **stop and explain the problem and the options**, then wait for an OK before deviating.
- If a change gets agreed, update README.md in the same change so it stays the single source of truth.
- Explain trade-offs before changing any configuration (Firebase, security rules, PWA manifest, build setup).
- Two people work on this repo in parallel: keep changes focused, and don't reformat or restructure files unrelated to the task.
- Check the "Phone limitations" table in README.md before building any feature that touches vibration, sound, notifications, background work or storage. Every effect must degrade gracefully on iPhone.
- Security lives in Firestore security rules, not only in the UI. Anything a client shouldn't be able to do must be blocked by the rules.
- Never commit secrets beyond the public Firebase web config. Never commit the invite code.
