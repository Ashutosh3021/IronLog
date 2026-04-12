import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useIronLog } from '../context/IronLogContext'
import { isSupabaseConfigured } from '../lib/supabase'

export function SettingsPage() {
  const auth = useAuth()
  const {
    state,
    saveSettings,
    resetAll,
    deferredPrompt,
    installPWA,
    notifyPermission,
    requestNotifications,
    sendTestNotification,
    online,
    showToast,
  } = useIronLog()

  const [tmDl, setTmDl] = useState('')
  const [tmBp, setTmBp] = useState('')
  const [tmSq, setTmSq] = useState('')
  const [incDl, setIncDl] = useState('5')
  const [incBp, setIncBp] = useState('2.5')
  const [incSq, setIncSq] = useState('5')
  const [cycle, setCycle] = useState('1')
  const [week, setWeek] = useState('1')
  const [accountDisplay, setAccountDisplay] = useState('')

  useEffect(() => {
    if (!auth.profile) {
      setAccountDisplay('')
      return
    }
    setAccountDisplay(auth.profile.display_name ?? '')
  }, [auth.profile])

  useEffect(() => {
    setTmDl(state.tm.dl ? String(state.tm.dl) : '')
    setTmBp(state.tm.bp ? String(state.tm.bp) : '')
    setTmSq(state.tm.sq ? String(state.tm.sq) : '')
    setIncDl(String(state.inc.dl))
    setIncBp(String(state.inc.bp))
    setIncSq(String(state.inc.sq))
    setCycle(String(state.cycle))
    setWeek(String(state.week))
  }, [state.tm, state.inc, state.cycle, state.week])

  const saveAccountDisplay = async () => {
    try {
      await auth.updateDisplayName(accountDisplay.trim() || null)
      showToast('✅ Profile updated')
    } catch {
      showToast('⚠ Could not update profile')
    }
  }

  const onSignOut = async () => {
    await auth.signOut()
  }

  const onSave = () => {
    saveSettings({
      tm: {
        dl: parseFloat(tmDl),
        bp: parseFloat(tmBp),
        sq: parseFloat(tmSq),
      },
      inc: {
        dl: parseFloat(incDl) || 5,
        bp: parseFloat(incBp) || 2.5,
        sq: parseFloat(incSq) || 5,
      },
      cycle: parseInt(cycle, 10) || 1,
      week: parseInt(week, 10) || 1,
    })
  }

  return (
    <>
      {!isSupabaseConfigured() ? (
        <>
          <div className="section-label">CLOUD SYNC</div>
          <div className="card settings-group">
            <div className="settings-row">
              <div className="settings-key">
                STATUS
                <small>
                  The app only shows the username login when both{' '}
                  <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>VITE_SUPABASE_URL</span> and{' '}
                  <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>VITE_SUPABASE_ANON_KEY</span> are set in
                  project root <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>.env</span> (not
                  placeholders). Restart <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>npm run dev</span>{' '}
                  after editing. Use URL <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>/IronLog/</span>{' '}
                  as configured for this project.
                </small>
              </div>
              <div style={{ fontSize: 13, color: 'var(--yellow, #eab308)' }}>LOCAL ONLY</div>
            </div>
          </div>
        </>
      ) : null}

      {isSupabaseConfigured() && auth.profile ? (
        <>
          <div className="section-label">ACCOUNT</div>
          <div className="card settings-group">
            <div className="settings-row">
              <div className="settings-key">
                USERNAME
                <small>Immutable after signup</small>
              </div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, wordBreak: 'break-all' }}>
                {auth.profile.username}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-key">
                DISPLAY NAME
                <small>Optional</small>
              </div>
              <input
                className="settings-input"
                type="text"
                placeholder="Shown in the app"
                value={accountDisplay}
                onChange={(e) => setAccountDisplay(e.target.value)}
              />
            </div>
            <div className="settings-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                className="modal-btn primary"
                style={{ padding: '8px 16px' }}
                onClick={() => void saveAccountDisplay()}
              >
                SAVE PROFILE
              </button>
              <button type="button" className="modal-btn" style={{ padding: '8px 16px' }} onClick={() => void onSignOut()}>
                SIGN OUT
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-key">
                LOGIN SCREEN
                <small>Sign out to return to the username + shuffle signup flow.</small>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="section-label">TRAINING MAXES</div>
      <div className="card settings-group">
        {(
          [
            ['dl', 'DEADLIFT', tmDl, setTmDl],
            ['bp', 'BENCH PRESS', tmBp, setTmBp],
            ['sq', 'SMITH SQUAT', tmSq, setTmSq],
          ] as const
        ).map(([key, label, val, setVal]) => (
          <div className="settings-row" key={key}>
            <div className="settings-key">
              {label}
              <small>Training Max (kg)</small>
            </div>
            <input
              className="settings-input"
              type="number"
              placeholder="0"
              inputMode="decimal"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="section-label">PROGRESSION</div>
      <div className="card settings-group">
        {(
          [
            ['dl', 'DEADLIFT INCREMENT', incDl, setIncDl],
            ['bp', 'BENCH INCREMENT', incBp, setIncBp],
            ['sq', 'SQUAT INCREMENT', incSq, setIncSq],
          ] as const
        ).map(([key, label, val, setVal]) => (
          <div className="settings-row" key={key}>
            <div className="settings-key">
              {label}
              <small>After each cycle (kg)</small>
            </div>
            <input
              className="settings-input"
              type="number"
              inputMode="decimal"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="section-label">PROGRAM</div>
      <div className="card settings-group">
        <div className="settings-row">
          <div className="settings-key">
            CURRENT CYCLE
            <small>Manually override</small>
          </div>
          <input
            className="settings-input"
            type="number"
            placeholder="1"
            inputMode="numeric"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
          />
        </div>
        <div className="settings-row">
          <div className="settings-key">
            CURRENT WEEK
            <small>1–4</small>
          </div>
          <input
            className="settings-input"
            type="number"
            placeholder="1"
            min={1}
            max={4}
            inputMode="numeric"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        </div>
      </div>

      <div className="section-label">APP SETTINGS</div>
      <div className="card settings-group">
        {deferredPrompt ? (
          <div className="settings-row" style={{ display: 'flex' }}>
            <div className="settings-key">
              INSTALL APP
              <small>Add to home screen</small>
            </div>
            <button
              type="button"
              className="modal-btn primary"
              style={{ flex: '0 0 auto', width: 'auto', padding: '8px 16px' }}
              onClick={installPWA}
            >
              INSTALL
            </button>
          </div>
        ) : null}
        {notifyPermission !== 'unsupported' ? (
          <div className="settings-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div className="settings-key">
              NOTIFICATIONS
              <small>Browser alerts only (no server). Test confirms setup — no recurring schedule yet.</small>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {notifyPermission === 'denied' ? (
                <button type="button" className="modal-btn" disabled style={{ padding: '8px 16px' }}>
                  BLOCKED
                </button>
              ) : notifyPermission === 'granted' ? (
                <>
                  <button type="button" className="modal-btn primary" disabled style={{ padding: '8px 16px' }}>
                    GRANTED
                  </button>
                  <button
                    type="button"
                    className="modal-btn"
                    style={{ padding: '8px 16px' }}
                    onClick={() => sendTestNotification()}
                  >
                    TEST
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="modal-btn primary"
                  style={{ padding: '8px 16px' }}
                  onClick={requestNotifications}
                >
                  ENABLE
                </button>
              )}
            </div>
          </div>
        ) : null}
        <div className="settings-row">
          <div className="settings-key">
            OFFLINE STATUS
            <small style={{ color: online ? 'var(--green)' : 'var(--yellow)' }}>
              {online ? 'ONLINE' : 'OFFLINE (Cached)'}
            </small>
          </div>
        </div>
      </div>

      <button type="button" className="save-btn" onClick={onSave}>
        💾 SAVE SETTINGS
      </button>

      <div className="section-label">DANGER ZONE</div>
      <button type="button" className="danger-btn" onClick={resetAll}>
        ⚠ RESET ALL DATA
      </button>
    </>
  )
}
