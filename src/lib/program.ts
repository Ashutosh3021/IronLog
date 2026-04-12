export function calcWeight(tm: number, pct: number): number {
  return Math.round(((tm * pct) / 100) * 2) / 2
}

export function roundBar(w: number): number {
  return Math.round(w / 2.5) * 2.5
}

export function estimate1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}
