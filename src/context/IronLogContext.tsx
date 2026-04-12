import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SupabaseStateSync } from '../components/SupabaseStateSync'
import { LIFT_KEYS, PROGRAM, STORAGE_KEY } from '../lib/constants'
import { emptyIronLogState, mergeIronLogPayload } from '../lib/ironlogMerge'
import { calcWeight } from '../lib/program'
import { getSupabase } from '../lib/supabase'
import { applyServerRev, bumpLocalRev, LOCAL_REV_KEY, readLocalRev } from '../lib/syncMeta'
import type { IronLogState, LiftKey, ModalConfig, PageId, Session, SessionSet } from '../lib/types'

function loadState(): IronLogState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyIronLogState()
  try {
    return mergeIronLogPayload(JSON.parse(raw))
  } catch {
    return emptyIronLogState()
  }
}

function resolveInitialState(
  serverHydrate: { state: unknown; updatedAt: string } | null,
): IronLogState {
  const local = loadState()
  if (!serverHydrate?.updatedAt) return local
  const srvMs = new Date(serverHydrate.updatedAt).getTime()
  const locMs = readLocalRev()
  if (!Number.isFinite(srvMs)) return local
  if (srvMs > locMs) {
    const merged = mergeIronLogPayload(serverHydrate.state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    applyServerRev(serverHydrate.updatedAt)
    return merged
  }
  return local
}

function saveToDisk(state: IronLogState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  bumpLocalRev()
}

function emptySession(week: number, cycle: number): Session {
  return {
    date: new Date().toISOString().split('T')[0],
    week,
    cycle,
    lifts: {
      dl: { sets: [] },
      bp: { sets: [] },
      sq: { sets: [] },
    },
  }
}

function buildSetsForWeek(tm: number, week: number): SessionSet[] {
  const prog = PROGRAM[week]
  return prog.sets.map((s) => ({
    pct: s.pct,
    targetReps: s.reps,
    weight: tm ? calcWeight(tm, s.pct) : 0,
    actualReps: '',
    done: false,
  }))
}

function notificationIconHref(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return new URL('Assets/android-chrome-192x192.png', `${window.location.origin}${import.meta.env.BASE_URL}`).href
  } catch {
    return undefined
  }
}

function hydrateSession(s: IronLogState): Session {
  let cs = s.currentSession
  if (!cs) {
    cs = emptySession(s.week, s.cycle)
  }
  cs = { ...cs, week: s.week, cycle: s.cycle }
  const lifts = { ...cs.lifts }
  LIFT_KEYS.forEach((lift) => {
    if (!lifts[lift].sets.length) {
      lifts[lift] = { sets: buildSetsForWeek(s.tm[lift], s.week) }
    }
  })
  return { ...cs, lifts }
}

export interface IronLogContextValue {
  state: IronLogState
  page: PageId
  setPage: (p: PageId) => void
  toast: string
  showToast: (msg: string) => void
  modal: ModalConfig
  showModal: (title: string, text: string, onConfirm: () => void) => void
  closeModal: () => void
  confirmModal: () => void
  selectWeek: (w: number) => void
  toggleLiftOpen: (lift: LiftKey) => void
  openLift: Record<LiftKey, boolean>
  updateSetReps: (lift: LiftKey, idx: number, val: string) => void
  toggleSetDone: (lift: LiftKey, idx: number) => void
  saveSession: () => void
  confirmNextWeek: () => void
  deleteSession: (index: number) => void
  saveSettings: (payload: {
    tm: Record<LiftKey, number>
    inc: Record<LiftKey, number>
    cycle: number
    week: number
  }) => void
  resetAll: () => void
  deferredPrompt: BeforeInstallPromptEvent | null
  installPWA: () => void
  notifyPermission: NotificationPermission | 'unsupported'
  requestNotifications: () => void
  /** Fires a real browser notification (only when permission is granted). */
  sendTestNotification: (options?: { skipSuccessToast?: boolean }) => void
  online: boolean
  fileProtocolWarning: boolean
}

const IronLogContext = createContext<IronLogContextValue | null>(null)

export function IronLogProvider({
  children,
  userId = null,
  serverHydrate = null,
}: {
  children: ReactNode
  userId?: string | null
  serverHydrate?: { state: unknown; updatedAt: string } | null
}) {
  const [state, setState] = useState<IronLogState>(() => resolveInitialState(serverHydrate ?? null))
  const stateRef = useRef(state)
  stateRef.current = state
  const [page, setPage] = useState<PageId>('home')
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<ModalConfig>({
    open: false,
    title: '',
    text: '',
    onConfirm: null,
  })
  const [openLift, setOpenLift] = useState<Record<LiftKey, boolean>>({
    dl: false,
    bp: false,
    sq: false,
  })
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  const fileProtocolWarning = window.location.protocol === 'file:'
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    saveToDisk(state)
  }, [state])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }, [])

  const showModal = useCallback((title: string, text: string, onConfirm: () => void) => {
    setModal({ open: true, title, text, onConfirm })
  }, [])

  const closeModal = useCallback(() => {
    setModal({ open: false, title: '', text: '', onConfirm: null })
  }, [])

  const confirmModal = useCallback(() => {
    const cb = modal.onConfirm
    closeModal()
    cb?.()
  }, [modal.onConfirm, closeModal])

  useEffect(() => {
    if (fileProtocolWarning) showToast('⚠️ Run "npm run dev" for full PWA support')
  }, [fileProtocolWarning, showToast])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferredPrompt(null)
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const installPWA = useCallback(() => {
    if (!deferredPrompt) return
    void deferredPrompt.prompt().then(() => {
      void deferredPrompt.userChoice.then(() => setDeferredPrompt(null))
    })
  }, [deferredPrompt])

  const sendTestNotification = useCallback((options?: { skipSuccessToast?: boolean }) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      showToast('⚠ Enable notifications first')
      return
    }
    try {
      const icon = notificationIconHref()
      new Notification('IRON LOG', {
        body: 'Test notification — alerts are working. (No recurring schedule in this version.)',
        icon,
        tag: 'ironlog-test',
      })
      if (!options?.skipSuccessToast) showToast('🔔 Test notification sent')
    } catch {
      showToast('⚠ Could not show notification')
    }
  }, [showToast])

  const requestNotifications = useCallback(() => {
    if (!('Notification' in window)) return
    void Notification.requestPermission().then((permission) => {
      setNotifyPermission(permission)
      if (permission === 'granted') {
        showToast('🔔 Notifications enabled!')
        sendTestNotification({ skipSuccessToast: true })
      }
    })
  }, [showToast, sendTestNotification])

  useLayoutEffect(() => {
    setState((s) => ({ ...s, currentSession: hydrateSession(s) }))
  }, [state.week, state.cycle])

  const selectWeek = useCallback((w: number) => {
    setState((s) => ({
      ...s,
      week: w,
      currentSession: emptySession(w, s.cycle),
    }))
    setOpenLift({ dl: false, bp: false, sq: false })
  }, [])

  const updateSetReps = useCallback((lift: LiftKey, idx: number, val: string) => {
    setState((s) => {
      const cs = hydrateSession(s)
      const sets = cs.lifts[lift].sets.map((st, i) => (i === idx ? { ...st, actualReps: val } : st))
      return {
        ...s,
        currentSession: {
          ...cs,
          lifts: { ...cs.lifts, [lift]: { sets } },
        },
      }
    })
  }, [])

  const toggleSetDone = useCallback((lift: LiftKey, idx: number) => {
    setState((s) => {
      const cs = hydrateSession(s)
      const sets = cs.lifts[lift].sets.map((st, i) =>
        i === idx ? { ...st, done: !st.done } : st,
      )
      return {
        ...s,
        currentSession: {
          ...cs,
          lifts: { ...cs.lifts, [lift]: { sets } },
        },
      }
    })
    setOpenLift((o) => ({ ...o, [lift]: true }))
  }, [])

  const saveSession = useCallback(() => {
    setState((s) => {
      const cs = s.currentSession ? hydrateSession(s) : null
      if (!cs) {
        setTimeout(() => showToast('⚠ No active session'), 0)
        return s
      }
      const sess = structuredClone(cs)
      sess.date = new Date().toISOString().split('T')[0]
      let hasData = false
      LIFT_KEYS.forEach((l) => {
        if (sess.lifts[l].sets.some((st) => st.actualReps || st.done)) hasData = true
      })
      if (!hasData) {
        setTimeout(() => showToast('⚠ Log at least one set!'), 0)
        return s
      }
      setTimeout(() => showToast('✅ SESSION SAVED!'), 0)
      return {
        ...s,
        sessions: [...s.sessions, sess],
        currentSession: null,
      }
    })
  }, [showToast])

  const confirmNextWeek = useCallback(() => {
    const cur = stateRef.current
    const nextW = (cur.week % 4) + 1
    const isNewCycle = cur.week === 4
    showModal(
      'ADVANCE WEEK',
      `Move to Week ${nextW}${isNewCycle ? ' (NEW CYCLE — TMs will increase)' : ''}?`,
      () => {
        setState((inner) => {
          let cycle = inner.cycle
          const tm = { ...inner.tm }
          if (isNewCycle) {
            LIFT_KEYS.forEach((l) => {
              tm[l] = parseFloat((tm[l] + inner.inc[l]).toFixed(2))
            })
            cycle += 1
          }
          setTimeout(
            () =>
              showToast(
                isNewCycle ? `🆙 CYCLE ${cycle} — TMs INCREASED!` : `✅ WEEK ${nextW} READY`,
              ),
            0,
          )
          return {
            ...inner,
            cycle,
            week: nextW,
            tm,
            currentSession: null,
          }
        })
      },
    )
  }, [showModal, showToast])

  const deleteSession = useCallback(
    (index: number) => {
      showModal('DELETE SESSION', 'Remove this session from history?', () => {
        setState((s) => {
          const sessions = [...s.sessions]
          sessions.splice(index, 1)
          return { ...s, sessions }
        })
        setTimeout(() => showToast('🗑 Session deleted'), 0)
      })
    },
    [showModal, showToast],
  )

  const saveSettings = useCallback(
    (payload: {
      tm: Record<LiftKey, number>
      inc: Record<LiftKey, number>
      cycle: number
      week: number
    }) => {
      if (!payload.tm.dl || !payload.tm.bp || !payload.tm.sq) {
        showToast('⚠ Enter all Training Maxes!')
        return
      }
      setState((s) => ({
        ...s,
        tm: payload.tm,
        inc: payload.inc,
        cycle: payload.cycle,
        week: Math.min(4, Math.max(1, payload.week)),
        currentSession: null,
      }))
      showToast('✅ SETTINGS SAVED!')
    },
    [showToast],
  )

  const resetAll = useCallback(() => {
    showModal('RESET ALL DATA', 'This will permanently delete all sessions and settings. Are you sure?', () => {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LOCAL_REV_KEY)
      const fresh = emptyIronLogState()
      setState(fresh)
      showToast('✅ DATA RESET')
      if (userId) {
        const sb = getSupabase()
        void sb
          ?.from('profiles')
          .update({ app_state: JSON.parse(JSON.stringify(fresh)) as Record<string, unknown> })
          .eq('id', userId)
          .select('updated_at')
          .single()
          .then(({ data }) => {
            if (data?.updated_at) applyServerRev(data.updated_at as string)
          })
      }
    })
  }, [showModal, showToast, userId])

  const toggleLiftOpen = useCallback((lift: LiftKey) => {
    setOpenLift((o) => ({ ...o, [lift]: !o[lift] }))
  }, [])

  const value = useMemo<IronLogContextValue>(
    () => ({
      state,
      page,
      setPage,
      toast,
      showToast,
      modal,
      showModal,
      closeModal,
      confirmModal,
      selectWeek,
      toggleLiftOpen,
      openLift,
      updateSetReps,
      toggleSetDone,
      saveSession,
      confirmNextWeek,
      deleteSession,
      saveSettings,
      resetAll,
      deferredPrompt,
      installPWA,
      notifyPermission,
      requestNotifications,
      sendTestNotification,
      online,
      fileProtocolWarning,
    }),
    [
      state,
      page,
      toast,
      showToast,
      modal,
      showModal,
      closeModal,
      confirmModal,
      selectWeek,
      toggleLiftOpen,
      openLift,
      updateSetReps,
      toggleSetDone,
      saveSession,
      confirmNextWeek,
      deleteSession,
      saveSettings,
      resetAll,
      deferredPrompt,
      installPWA,
      notifyPermission,
      requestNotifications,
      sendTestNotification,
      online,
      fileProtocolWarning,
    ],
  )

  return (
    <IronLogContext.Provider value={value}>
      {userId ? <SupabaseStateSync userId={userId} /> : null}
      {children}
    </IronLogContext.Provider>
  )
}

export function useIronLog() {
  const ctx = useContext(IronLogContext)
  if (!ctx) throw new Error('useIronLog must be used within IronLogProvider')
  return ctx
}

