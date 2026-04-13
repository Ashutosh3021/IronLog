import { useCallback, useEffect, useRef } from 'react'
import { useIronLog } from '../context/IronLogContext'
import { getSupabase } from '../lib/supabase'
import { applyServerRev } from '../lib/syncMeta'

const DEBOUNCE_MS = 800

export function SupabaseStateSync({ userId }: { userId: string }) {
  const { state, ready } = useIronLog()
  const stateRef = useRef(state)
  const initialSyncDone = useRef(false)
  stateRef.current = state

  const push = useCallback(async () => {
    const sb = getSupabase()
    if (!sb || !userId || !navigator.onLine || !ready) return
    const payload = JSON.parse(JSON.stringify(stateRef.current)) as Record<string, unknown>
    const { data, error } = await sb
      .from('profiles')
      .update({ app_state: payload })
      .eq('id', userId)
      .select('updated_at')
      .single()

    if (!error && data?.updated_at) applyServerRev(data.updated_at as string)
  }, [userId, ready])

  useEffect(() => {
    if (!ready) return
    if (!initialSyncDone.current) {
      initialSyncDone.current = true
      void push()
      return
    }
    const t = window.setTimeout(() => void push(), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [state, push, ready])

  useEffect(() => {
    const onOnline = () => void push()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [push])

  return null
}
