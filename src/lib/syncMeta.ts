/** Client-side monotonic-ish rev for last-write-wins vs server `updated_at`. */
export const LOCAL_REV_KEY = 'ironlog_local_rev'

export function readLocalRev(): number {
  const v = parseInt(localStorage.getItem(LOCAL_REV_KEY) || '0', 10)
  return Number.isFinite(v) ? v : 0
}

export function bumpLocalRev(): void {
  localStorage.setItem(LOCAL_REV_KEY, String(Date.now()))
}

export function applyServerRev(iso: string): void {
  const t = new Date(iso).getTime()
  if (Number.isFinite(t)) localStorage.setItem(LOCAL_REV_KEY, String(t))
}
