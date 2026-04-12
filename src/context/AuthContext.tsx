import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { STORAGE_KEY } from '../lib/constants'
import { mergeIronLogPayload } from '../lib/ironlogMerge'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { LOCAL_REV_KEY } from '../lib/syncMeta'

export type AuthProfile = {
  id: string
  username: string
  display_name: string | null
  app_state: unknown
  updated_at: string
}

export type AuthContextValue = {
  ready: boolean
  profile: AuthProfile | null
  signUpWithUsername: (
    username: string,
    displayName: string | null,
    captchaToken?: string,
  ) => Promise<void>
  signOut: () => Promise<void>
  updateDisplayName: (displayName: string | null) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<AuthProfile | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setProfile(null)
      setReady(true)
      return
    }
    const sb = getSupabase()
    if (!sb) {
      setProfile(null)
      setReady(true)
      return
    }
    const {
      data: { session },
      error: sessionErr,
    } = await sb.auth.getSession()
    if (sessionErr || !session?.user) {
      setProfile(null)
      setReady(true)
      return
    }
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    if (error || !data) {
      await sb.auth.signOut()
      setProfile(null)
      setReady(true)
      return
    }
    setProfile(data as AuthProfile)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfile(null)
      setReady(true)
      return
    }
    void refreshProfile()
    const sb = getSupabase()
    if (!sb) return
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      void refreshProfile()
    })
    return () => subscription.unsubscribe()
  }, [refreshProfile])

  const signUpWithUsername = useCallback(
    async (username: string, displayName: string | null, captchaToken?: string) => {
      const sb = getSupabase()
      if (!sb) throw new Error('Supabase is not configured')
      const normalized = username.trim().toLowerCase()
      const { data: avail, error: rpcErr } = await sb.rpc('is_username_available', {
        p_username: normalized,
      })
      if (rpcErr) throw rpcErr
      if (avail !== true) throw new Error('That username is already taken')
      const anonOpts =
        captchaToken && captchaToken.length > 0 ? { options: { captchaToken } } : undefined
      const { data: authData, error: anonErr } = await sb.auth.signInAnonymously(anonOpts)
      if (anonErr || !authData.user) throw anonErr ?? new Error('Anonymous sign-in failed')
      let raw: unknown = null
      try {
        raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      } catch {
        raw = null
      }
      const app_state = mergeIronLogPayload(raw)
      const { error: insErr } = await sb.from('profiles').insert({
        id: authData.user.id,
        username: normalized,
        display_name: displayName?.trim() || null,
        app_state,
      })
      if (insErr) {
        await sb.auth.signOut()
        throw insErr
      }
      await refreshProfile()
    },
    [refreshProfile],
  )

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    await sb?.auth.signOut()
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LOCAL_REV_KEY)
    setProfile(null)
  }, [])

  const updateDisplayName = useCallback(
    async (displayName: string | null) => {
      const sb = getSupabase()
      if (!sb) throw new Error('Supabase is not configured')
      const {
        data: { session },
      } = await sb.auth.getSession()
      if (!session?.user) throw new Error('Not signed in')
      const next = displayName?.trim() || null
      const { error } = await sb.from('profiles').update({ display_name: next }).eq('id', session.user.id)
      if (error) throw error
      await refreshProfile()
    },
    [refreshProfile],
  )

  const value: AuthContextValue = {
    ready,
    profile,
    signUpWithUsername,
    signOut,
    updateDisplayName,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
