import type { IronLogState } from './types'

export function emptyIronLogState(): IronLogState {
  return {
    cycle: 1,
    week: 1,
    tm: { dl: 0, bp: 0, sq: 0 },
    inc: { dl: 5, bp: 2.5, sq: 5 },
    sessions: [],
    currentSession: null,
  }
}

export function mergeIronLogPayload(raw: unknown): IronLogState {
  if (!raw || typeof raw !== 'object') return emptyIronLogState()
  return { ...emptyIronLogState(), ...(raw as Partial<IronLogState>) }
}
