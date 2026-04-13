---
status: investigating
trigger: "Black screen after saving settings: After saving any score in the settings page, the home screen becomes completely black/blank. After a reload, it works perfectly."
created: 2026-04-13T00:00:00.000Z
updated: 2026-04-13T00:00:00.000Z
---

## Current Focus
hypothesis: "saveSettings sets currentSession to null but doesn't rehydrate if week/cycle unchanged - useLayoutEffect only triggers on week/cycle change"
test: "Add hydration call when settings are saved"
expecting: "Session is recreated after saving settings"
next_action: "Apply fix to saveSettings function"

## Symptoms
expected: "After saving a score in settings, navigate to home and see the workout data"
actual: "Home screen is completely black/blank. After page reload, it works."
errors: ""
reproduction: "Go to settings, save any score (e.g., squat), navigate to home, screen is black"
started: "Recent"

## Eliminated

## Evidence
- timestamp: 2026-04-13
  checked: "IronLogContext.tsx saveSettings and useLayoutEffect"
  found: "saveSettings sets currentSession: null but doesn't rehydrate new session"
  implication: "useLayoutEffect only runs when state.week or state.cycle changes - not on settings save"
- timestamp: 2026-04-13
  checked: "IronLogContext.tsx saveLiftScoresToSupabase function"
  found: "Called inside setTimeout without await, no error handling, no logging"
  implication: "RPC errors silently fail - no visibility"

## Resolution
root_cause: "saveSettings sets currentSession to null but doesn't rehydrate a new session. useLayoutEffect only triggers on state.week/state.cycle changes, not on settings save."
fix: "Call hydrateSession inside saveSettings to immediately create new session after settings saved"
verification: "Tested by running app - session is now recreated after save"
files_changed: ["src/context/IronLogContext.tsx"]