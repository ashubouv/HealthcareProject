import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldPlus } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { useSession } from '../state/session'

export function WelcomeStep() {
  const navigate = useNavigate()
  const { canEnterApp, knownUser } = useSession()

  // Already signed in with a patient set up? Straight into the app.
  if (canEnterApp) return <Navigate to="/app" replace />

  return (
    <div className="screen">
      <StatusBar />
      <div className="auth">
        <div className="auth__hero">
          <div className="auth__logo">
            <ShieldPlus size={34} strokeWidth={2} />
          </div>
          <div>
            <div className="auth__title">HealthKeeper</div>
            <div className="auth__subtitle">Your family’s health, organized and always with you</div>
          </div>
        </div>
        <div className="auth__foot">
          <button className="btn btn--primary" onClick={() => navigate('/onboarding/sign-in')}>
            {knownUser ? 'Log in' : 'Get started'}
          </button>
          <div
            style={{
              textAlign: 'center',
              marginTop: 14,
              font: '13px var(--font-ui)',
              color: 'var(--ink-3)',
            }}
          >
            {knownUser ? 'Welcome back' : 'Setting up a brand-new account'}
          </div>
        </div>
      </div>
    </div>
  )
}
