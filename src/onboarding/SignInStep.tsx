import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { useSession } from '../state/session'
import { api, ApiError } from '../api/client'

type Mode = 'login' | 'resetRequest' | 'resetVerify'

/**
 * Step 2 — email + password sign-in. One flow covers both cases: an unknown
 * email creates the account, a known one signs in. Returning users (who already
 * have a patient set up) skip the rest of onboarding entirely.
 *
 * "Forgot password?" switches to a reset flow: a 6-digit code is emailed, and
 * entering it with a new password resets the account and signs the user in.
 */
export function SignInStep() {
  const navigate = useNavigate()
  const { setSignIn, authenticate, addPerson, setProxyChoice, completeOnboarding } = useSession()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const emailOk = /\S+@\S+\.\S+/.test(email.trim())
  const canSubmit = emailOk && password.length >= 8

  /** Shared post-authentication landing: existing patients → app, else onboarding. */
  const enter = async (userId: string, token: string) => {
    setSignIn('email', email.trim().toLowerCase())
    authenticate(userId, token)
    const me = await api.me().catch(() => null)
    if (me && me.persons.length > 0) {
      me.persons.forEach(addPerson)
      const proxy = me.persons[0]?.proxyChoice
      if (proxy) setProxyChoice(proxy)
      completeOnboarding()
      navigate('/app', { replace: true })
    } else {
      navigate('/onboarding/proxy')
    }
  }

  const fail = (err: unknown) => {
    setError(
      err instanceof ApiError
        ? err.message
        : 'Couldn’t reach the server. Check your connection and try again.',
    )
    setBusy(false)
  }

  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true)
    setError(null)
    try {
      const { token, userId } = await api.passwordLogin(email.trim(), password)
      await enter(userId, token)
    } catch (err) {
      fail(err)
    }
  }

  const sendResetCode = async () => {
    if (!emailOk || busy) return
    setBusy(true)
    setError(null)
    try {
      await api.sendOtp(email.trim().toLowerCase(), 'email')
      setNotice(`We emailed a 6-digit code to ${email.trim()}. Check spam if you don’t see it.`)
      setMode('resetVerify')
      setBusy(false)
    } catch (err) {
      fail(err)
    }
  }

  const doReset = async () => {
    if (busy || !/^\d{6}$/.test(code) || password.length < 8) return
    setBusy(true)
    setError(null)
    try {
      const { token, userId } = await api.resetPassword(email.trim().toLowerCase(), code, password)
      await enter(userId, token)
    } catch (err) {
      fail(err)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setNotice(null)
    setCode('')
    setPassword('')
  }

  return (
    <div className="screen">
      <StatusBar />
      <TopBar onBack={() => (mode === 'login' ? navigate('/onboarding') : switchMode('login'))} />
      <div className="auth">
        <div className="auth__form">
          <div className="auth__h">
            {mode === 'login' ? 'Sign in' : 'Reset password'}
          </div>
          {mode === 'resetRequest' && (
            <div className="auth__p" style={{ marginBottom: 16 }}>
              Enter your account email and we’ll send a 6-digit code.
            </div>
          )}
          {mode === 'resetVerify' && notice && (
            <div className="auth__p" style={{ marginBottom: 16 }}>{notice}</div>
          )}

          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field__label">Email</div>
            <div className="field__input">
              <input
                inputMode="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus={mode !== 'resetVerify'}
                disabled={mode === 'resetVerify'}
              />
            </div>
          </div>

          {mode === 'resetVerify' && (
            <div className="field" style={{ marginBottom: 14 }}>
              <div className="field__label">6-digit code from your email</div>
              <div className="field__input">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="123456"
                  autoFocus
                />
              </div>
            </div>
          )}

          {mode !== 'resetRequest' && (
            <div className="field">
              <div className="field__label">{mode === 'resetVerify' ? 'New password' : 'Password'}</div>
              <div className="field__input">
                <input
                  type="password"
                  autoComplete={mode === 'resetVerify' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void (mode === 'login' ? submit() : doReset())
                  }}
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('resetRequest')}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  font: '600 13px var(--font-ui)',
                  color: 'var(--primary)',
                  marginTop: 12,
                  display: 'block',
                }}
              >
                Forgot password?
              </button>
              <div style={{ font: '12px/1.5 var(--font-ui)', color: 'var(--ink-4)', marginTop: 10 }}>
                New here? Signing in creates your account.
              </div>
            </>
          )}
          {mode === 'resetVerify' && (
            <button
              type="button"
              onClick={sendResetCode}
              disabled={busy}
              style={{
                all: 'unset',
                cursor: 'pointer',
                font: '600 13px var(--font-ui)',
                color: 'var(--primary)',
                marginTop: 12,
                display: 'block',
              }}
            >
              Resend code
            </button>
          )}
        </div>

        <div className="auth__foot">
          {error && (
            <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginBottom: 10 }}>
              {error}
            </div>
          )}
          {mode === 'login' && (
            <button
              className="btn btn--primary"
              disabled={busy || !canSubmit}
              style={!canSubmit ? { opacity: 0.5 } : undefined}
              onClick={submit}
            >
              {busy ? 'Signing in…' : 'Continue'}
            </button>
          )}
          {mode === 'resetRequest' && (
            <button
              className="btn btn--primary"
              disabled={busy || !emailOk}
              style={!emailOk ? { opacity: 0.5 } : undefined}
              onClick={sendResetCode}
            >
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          )}
          {mode === 'resetVerify' && (
            <button
              className="btn btn--primary"
              disabled={busy || !/^\d{6}$/.test(code) || password.length < 8}
              style={!/^\d{6}$/.test(code) || password.length < 8 ? { opacity: 0.5 } : undefined}
              onClick={doReset}
            >
              {busy ? 'Resetting…' : 'Set new password'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
