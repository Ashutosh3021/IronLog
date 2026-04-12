export type LiftKey = 'dl' | 'bp' | 'sq'

export type PageId = 'home' | 'analytics' | 'calc' | 'history' | 'settings'

export interface SessionSet {
  pct: number
  targetReps: number | string
  weight: number
  actualReps: string
  done: boolean
}

export interface Session {
  date: string
  week: number
  cycle: number
  lifts: Record<LiftKey, { sets: SessionSet[] }>
}

export interface IronLogState {
  cycle: number
  week: number
  tm: Record<LiftKey, number>
  inc: Record<LiftKey, number>
  sessions: Session[]
  currentSession: Session | null
}

export interface ModalConfig {
  open: boolean
  title: string
  text: string
  onConfirm: (() => void) | null
}
