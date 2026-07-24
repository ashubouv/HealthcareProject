import { Plus } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Eyebrow, Badge } from '../components/ui'
import { useStore } from '../state/store'

const NOTIFS: { key: 'record' | 'alerts' | 'appts'; label: string }[] = [
  { key: 'record', label: 'New record added' },
  { key: 'alerts', label: 'Alerts & flags' },
  { key: 'appts', label: 'Appointments' },
]

export function SharingScreen() {
  const { go, notif, toggleNotif, showToast } = useStore()
  return (
    <div className="screen">
      <TopBar title="Sharing & access" onBack={() => go('labs')} />
      <div className="screen__body scroll">
        <Eyebrow>People with access</Eyebrow>
        <div className="stack" style={{ gap: 9, marginBottom: 18 }}>
          <div className="access-row">
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              P
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '14px var(--font-ui)', color: 'var(--ink)' }}>Priya (you)</div>
              <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)' }}>Caretaker · local</div>
            </div>
            <Badge variant="solid">FULL</Badge>
          </div>
          <div className="access-row">
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              K
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '14px var(--font-ui)', color: 'var(--ink)' }}>Karthik</div>
              <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)' }}>Caretaker · remote</div>
            </div>
            <Badge variant="outline">VIEW</Badge>
          </div>
          <div className="access-row access-row--temp">
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
              R
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '14px var(--font-ui)', color: 'var(--ink)' }}>Dr. Rao</div>
              <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)' }}>
                Temporary · expires 19 Jun
              </div>
            </div>
          </div>
        </div>

        <button
          className="btn"
          style={{ height: 48, border: '1.5px solid var(--primary)', color: 'var(--primary)', marginBottom: 20 }}
          onClick={() => showToast('Invite link copied')}
        >
          <Plus size={18} /> Invite caretaker
        </button>

        <Eyebrow>Notify remote caretaker</Eyebrow>
        <div className="stack" style={{ gap: 14 }}>
          {NOTIFS.map((n) => (
            <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ font: '14px var(--font-ui)', color: 'var(--ink-2)' }}>{n.label}</div>
              <button
                className={`switch${notif[n.key] ? ' switch--on' : ''}`}
                onClick={() => toggleNotif(n.key)}
                aria-label={n.label}
                aria-pressed={notif[n.key]}
              >
                <span className="switch__knob" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
