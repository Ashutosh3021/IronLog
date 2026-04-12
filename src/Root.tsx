import App from './App'
import { IronLogProvider } from './context/IronLogContext'
import { useAuth } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import { LoginPage } from './pages/LoginPage'

export function Root() {
  const auth = useAuth()

  if (!isSupabaseConfigured()) {
    return (
      <IronLogProvider userId={null} serverHydrate={null}>
        <App />
      </IronLogProvider>
    )
  }

  if (!auth.ready) {
    return (
      <div className="page active" style={{ padding: 32, textAlign: 'center' }}>
        <div className="section-label">IRON LOG</div>
        <p style={{ marginTop: 12, opacity: 0.85 }}>Loading…</p>
      </div>
    )
  }

  if (!auth.profile) {
    return <LoginPage />
  }

  return (
    <IronLogProvider
      key={auth.profile.id}
      userId={auth.profile.id}
      serverHydrate={{ state: auth.profile.app_state, updatedAt: auth.profile.updated_at }}
    >
      <App />
    </IronLogProvider>
  )
}
