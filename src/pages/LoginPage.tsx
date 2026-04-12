import { Turnstile } from '@marsidev/react-turnstile'
import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

const turnstileSiteKey =
  typeof import.meta.env.VITE_TURNSTILE_SITE_KEY === 'string'
    ? import.meta.env.VITE_TURNSTILE_SITE_KEY.trim()
    : ''

function randomFiveDigit(): string {
  return String(Math.floor(10000 + Math.random() * 90000))
}

function sanitizeBase(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

export function LoginPage() {
  const { signUpWithUsername } = useAuth()
  const [prefix, setPrefix] = useState(() => randomFiveDigit())
  const [base, setBase] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const username = useMemo(() => {
    const b = sanitizeBase(base)
    if (!b) return ''
    return `${prefix}_${b}`
  }, [prefix, base])

  const shuffle = useCallback(() => {
    setPrefix(randomFiveDigit())
    setErr(null)
    setCaptchaToken(null)
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    const b = sanitizeBase(base)
    if (!b) {
      setErr('Enter a nickname (letters, numbers, underscore).')
      return
    }
    const u = `${prefix}_${b}`
    if (u.length < 4 || u.length > 48) {
      setErr('Username must be 4–48 characters.')
      return
    }
    if (turnstileSiteKey && !captchaToken) {
      setErr('Complete the security check below.')
      return
    }
    setBusy(true)
    try {
      await signUpWithUsername(
        u,
        displayName.trim() || null,
        captchaToken && captchaToken.length > 0 ? captchaToken : undefined,
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setErr(msg || 'Could not create account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page active">
      <div className="section-label" style={{ marginTop: 16 }}>
        IRON LOG — ACCOUNT
      </div>
      <p style={{ padding: '0 16px', margin: '0 0 12px', fontSize: 13, opacity: 0.85 }}>
        Pick a public handle. A random 5-digit prefix is added so you can reuse a short nickname. Your
        handle cannot be changed after signup.
      </p>
      {!turnstileSiteKey ? (
        <p style={{ padding: '0 16px', margin: '0 0 12px', fontSize: 12, opacity: 0.7 }}>
          Signup error from Supabase? In the dashboard open{' '}
          <strong>Authentication → Attack Protection</strong> (or Bot Protection) and turn{' '}
          <strong>off</strong> CAPTCHA, <em>or</em> keep CAPTCHA on with <strong>Cloudflare Turnstile</strong>{' '}
          and set <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>VITE_TURNSTILE_SITE_KEY</span> in{' '}
          <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>.env</span> (then restart the dev server).
        </p>
      ) : null}

      <form className="card settings-group" style={{ margin: '0 16px 16px' }} onSubmit={onSubmit}>
        <div className="settings-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="settings-key" style={{ flex: '1 1 100%' }}>
            USERNAME
            <small>Prefix updates each time you tap Shuffle</small>
          </div>
          <div style={{ display: 'flex', flex: '1 1 100%', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 14,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 6,
                flex: '0 0 auto',
              }}
            >
              {prefix}_
            </span>
            <input
              className="settings-input"
              style={{ flex: 1, minWidth: 0 }}
              autoComplete="username"
              placeholder="nickname"
              value={base}
              onChange={(e) => {
                setBase(e.target.value)
                setErr(null)
              }}
            />
            <button type="button" className="modal-btn" style={{ flex: '0 0 auto', padding: '8px 12px' }} onClick={shuffle}>
              SHUFFLE
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-key">
            PREVIEW
            <small>Stored as lowercase</small>
          </div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, wordBreak: 'break-all' }}>
            {username || '—'}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-key">
            DISPLAY NAME
            <small>Optional — shown in the app only</small>
          </div>
          <input
            className="settings-input"
            type="text"
            placeholder="e.g. Ash"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {turnstileSiteKey ? (
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div className="settings-key">
              VERIFICATION
              <small>Required by your Supabase CAPTCHA settings</small>
            </div>
            <Turnstile
              siteKey={turnstileSiteKey}
              options={{ theme: 'dark' }}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          </div>
        ) : null}

        {err ? (
          <div style={{ padding: '8px 0 0', fontSize: 13, color: 'var(--yellow, #eab308)' }}>{err}</div>
        ) : null}

        <button type="submit" className="save-btn" style={{ marginTop: 12 }} disabled={busy}>
          {busy ? '…' : 'CONTINUE'}
        </button>
      </form>
    </div>
  )
}
