import { useCallback, useEffect, useRef } from 'react'
import { useIronLog } from '../context/IronLogContext'
import { getSupabase } from '../lib/supabase'
import { applyServerRev } from '../lib/syncMeta'

const DEBOUNCE_MS = 1600

export function SupabaseStateSync({ userId }: { userId: string }) {
  const { state } = useIronLog()
  const stateRef = useRef(state)
  stateRef.current = state

  const push = useCallback(async () => {
    const sb = getSupabase()
    if (!sb || !userId || !navigator.onLine) return
    const payload = JSON.parse(JSON.stringify(stateRef.current)) as Record<string, unknown>
    const { data, error } = await sb
      .from('profiles')
      .update({ app_state: payload })
      .eq('id', userId)
      .select('updated_at')
      .single()

    if (!error && data?.updated_at) applyServerRev(data.updated_at as string)
  }, [userId])

  useEffect(() => {
    const t = window.setTimeout(() => void push(), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [state, push])

  useEffect(() => {
    const onOnline = () => void push()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [push])

  return null
}
