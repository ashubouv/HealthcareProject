import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { useStore } from '../state/store'

export function VerifyScreen() {
  const { go, showToast } = useStore()
  return (
    <div className="screen">
      <StatusBar />
      <TopBar onBack={() => go('login')} />
      <div className="auth">
        <div className="auth__form">
          <div className="auth__h">Enter the code</div>
          <div className="auth__p">
            We sent a 6-digit code to
            <br />
            <b style={{ color: 'var(--ink)' }}>+91 98765 43210</b>
          </div>
          <div className="otp">
            <div className="otp__box otp__box--filled">4</div>
            <div className="otp__box otp__box--filled">2</div>
            <div className="otp__box otp__box--active">
              <div className="otp__caret" />
            </div>
            <div className="otp__box" />
            <div className="otp__box" />
            <div className="otp__box" />
          </div>
          <button className="link link--muted" onClick={() => showToast('A new code was sent')}>
            Resend code
          </button>
        </div>
        <div className="auth__foot">
          <button className="btn btn--primary" onClick={() => go('home')}>
            Verify &amp; continue
          </button>
        </div>
      </div>
    </div>
  )
}
