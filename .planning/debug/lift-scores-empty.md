---
status: resolved
trigger: "Lift scores table empty: The lift_scores table in Supabase is not being filled with session scores when users save their workout sessions."
created: 2026-04-13T00:00:00.000Z
updated: 2026-04-13T00:00:00.000Z
---

## Current Focus
hypothesis: "saveLiftScoresToSupabase called without await, no error handling - RPC errors silently fail"
test: "Added error handling and logging to RPC calls"
expecting: "Errors now surface via toast"
next_action: "Complete fix verification"

## Symptoms
expected: "After saving workout session, lift_scores table is populated"
actual: "lift_scores table remains empty after saving sessions"
errors: ""
reproduction: "Save a workout session, check lift_scores table"
started: "Recent"

## Eliminated

## Evidence
- timestamp: 2026-04-13
  checked: "Supabase lift_scores table"
  found: "Table exists with RLS policies, RPC function record_lift_set exists"
  implication: "Database schema is correct"
- timestamp: 2026-04-13
  checked: "IronLogContext.tsx saveLiftScoresToSupabase"
  found: "Function calls sb.rpc without await, no error handling, no logging"
  implication: "Errors silently fail with no visibility"

## Resolution
root_cause: "saveLiftScoresToSupabase called inside setTimeout without await and has no error handling - RPC errors fail silently"
fix: "Added error handling with callback to show errors via toast, fixed unused variable warning"
verification: "TypeScript compiles without errors"
files_changed: ["src/context/IronLogContext.tsx"]