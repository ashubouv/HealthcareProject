import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { useSession } from '../state/session'
import { api, ApiError } from '../api/client'

/**
 * Step 2 — email + password sign-in. One flow covers both cases: an unknown
 * email creates the account, a known one signs in. Returning users (who already
 * have a patient set up) skip the rest of onboarding entirely.
 */
export function SignInStep() {
  const navigate = useNavigate()
  const { setSignIn, authenticate, addPerson, setProxyChoice, completeOnboarding } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = /\S+@\S+\.\S+/.test(email.trim()) && password.length >= 8

  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true)
    setError(null)
    try {
      const { token, userId } = await api.passwordLogin(email.trim(), password)
      setSignIn('email', email.trim().toLowerCase())
      authenticate(userId, token)
      // Returning user with a patient already set up? Straight into the app.
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
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Couldn’t reach the server. Check your connection and try again.',
      )
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <StatusBar />
      <TopBar onBack={() => navigate('/onboarding')} />
      <div className="auth">
        <div className="auth__form">
          <div className="auth__h">Sign in</div>

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
                autoFocus
              />
            </div>
          </div>

          <div className="field">
            <div className="field__label">Password</div>
            <div className="field__input">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submit()
                }}
              />
            </div>
          </div>

          <div style={{ font: '12px/1.5 var(--font-ui)', color: 'var(--ink-4)', marginTop: 10 }}>
            New here? Signing in creates your account.
          </div>
        </div>

        <div className="auth__foot">
          {error && (
            <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginBottom: 10 }}>
              {error}
            </div>
          )}
          <button
            className="btn btn--primary"
            disabled={busy || !canSubmit}
            style={!canSubmit ? { opacity: 0.5 } : undefined}
            onClick={submit}
          >
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
