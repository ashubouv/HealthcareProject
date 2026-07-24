import { Eye, EyeOff } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { useStore } from '../state/store'

export function EmailScreen() {
  const { go, showPw, set, showToast } = useStore()
  return (
    <div className="screen">
      <StatusBar />
      <TopBar onBack={() => go('login')} />
      <div className="auth">
        <div className="auth__form">
          <div className="auth__h">Sign in with email</div>
          <div className="auth__p">Use the email on your account.</div>

          <div className="field" style={{ marginBottom: 16 }}>
            <div className="field__label">Email</div>
            <div className="field__input">priya.iyer@gmail.com</div>
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <div className="field__label">Password</div>
            <div className="pwfield">
              <span className="pwfield__dots" style={showPw ? { letterSpacing: 0 } : undefined}>
                {showPw ? 'priya123' : '••••••••'}
              </span>
              <button className="pwfield__toggle" onClick={() => set({ showPw: !showPw })}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button className="link link--muted" onClick={() => showToast('Reset link sent to your email')}>
            Forgot password?
          </button>
        </div>
        <div className="auth__foot">
          <button className="btn btn--primary" onClick={() => go('home')}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
