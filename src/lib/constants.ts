import type { LiftKey } from './types'

export const PROGRAM: Record<
  number,
  { type: string; sets: { pct: number; reps: number | string }[] }
> = {
  1: { type: '5/5/5+', sets: [{ pct: 65, reps: 5 }, { pct: 75, reps: 5 }, { pct: 85, reps: '5+' }] },
  2: { type: '3/3/3+', sets: [{ pct: 70, reps: 3 }, { pct: 80, reps: 3 }, { pct: 90, reps: '3+' }] },
  3: { type: '5/3/1+', sets: [{ pct: 75, reps: 5 }, { pct: 85, reps: 3 }, { pct: 95, reps: '1+' }] },
  4: { type: 'DELOAD', sets: [{ pct: 40, reps: 5 }, { pct: 50, reps: 5 }, { pct: 60, reps: 5 }] },
}

export const LIFTS: Record<LiftKey, { name: string; color: string }> = {
  dl: { name: 'Deadlift', color: '#f97316' },
  bp: { name: 'Bench Press', color: '#fbbf24' },
  sq: { name: 'Smith Squat', color: '#38bdf8' },
}

export const LIFT_KEYS: LiftKey[] = ['dl', 'bp', 'sq']

export const PCT_TABLE = [40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

export const HIGHLIGHT_PCTS = new Set([65, 70, 75, 80, 85, 90, 95])

export const STORAGE_KEY = 'ironlog_v2'
