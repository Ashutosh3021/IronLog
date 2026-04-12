import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Non-empty, trimmed env; rejects .env.example placeholders so the login gate actually runs. */
function readSupabaseEnv(): { url: string; key: string } | null {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const url = typeof rawUrl === 'string' ? rawUrl.trim() : ''
  const key = typeof rawKey === 'string' ? rawKey.trim() : ''
  if (!url || !key) return null
  if (url.includes('YOUR_PROJECT_REF') || key === 'your_anon_key_here') return null
  return { url, key }
}

export function getSupabase(): SupabaseClient | null {
  const env = readSupabaseEnv()
  if (!env) return null
  if (!client) {
    client = createClient(env.url, env.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseEnv() !== null
}
