import { useNavigate } from 'react-router-dom'
import { User, HeartHandshake, ChevronRight } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { useSession } from '../state/session'
import type { ProxyChoice } from '../api/client'

/**
 * Step 4 — who is this record for? Stores the proxy/caretaker choice in state.
 * TODO: richer relationship details (name of relationship, multiple dependents).
 */
export function ProxyStep() {
  const navigate = useNavigate()
  const { setProxyChoice } = useSession()

  const choose = (choice: ProxyChoice) => {
    setProxyChoice(choice)
    navigate('/onboarding/person')
  }

  return (
    <div className="screen">
      <StatusBar />
      <TopBar onBack={() => navigate('/onboarding/verify')} />
      <div className="screen__body" style={{ paddingTop: 6 }}>
        <div className="auth__h" style={{ marginBottom: 8 }}>
          Who is this record for?
        </div>
        <div className="auth__p" style={{ marginBottom: 22 }}>
          You can manage your own health record, or set one up for someone you care for.
        </div>

        <div className="stack" style={{ gap: 12 }}>
          <button className="choice" onClick={() => choose('self')}>
            <span className="choice__icon">
              <User size={22} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="choice__title" style={{ display: 'block' }}>
                For myself
              </span>
              <span className="choice__sub" style={{ display: 'block' }}>
                I’m the patient managing my own records.
              </span>
            </span>
            <ChevronRight size={18} className="chev" />
          </button>

          <button className="choice" onClick={() => choose('caretaker')}>
            <span className="choice__icon">
              <HeartHandshake size={22} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="choice__title" style={{ display: 'block' }}>
                For someone I care for
              </span>
              <span className="choice__sub" style={{ display: 'block' }}>
                I’m a caretaker setting this up on their behalf.
              </span>
            </span>
            <ChevronRight size={18} className="chev" />
          </button>
        </div>
      </div>
    </div>
  )
}
