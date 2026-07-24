import { HeartPulse } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { useStore } from '../state/store'

export function LoginScreen() {
  const { go } = useStore()
  return (
    <div className="screen">
      <StatusBar />
      <div className="auth">
        <div className="auth__hero">
          <div className="auth__logo">
            <HeartPulse size={34} strokeWidth={2} />
          </div>
          <div>
            <div className="auth__title">Your health record</div>
            <div className="auth__subtitle">One organized history, always with you</div>
          </div>
        </div>
        <div className="auth__foot">
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="field__label">Mobile number</div>
            <div className="phonefield">
              <div className="field__input phonefield__cc">+91</div>
              <div className="field__input" style={{ color: 'var(--ink-3)' }}>
                98765 43210
              </div>
            </div>
          </div>
          <button className="btn btn--primary" onClick={() => go('verify')}>
            Send code
          </button>
          <div className="auth__or">or</div>
          <button className="btn btn--ghost" onClick={() => go('email')}>
            Continue with email
          </button>
        </div>
      </div>
    </div>
  )
}
