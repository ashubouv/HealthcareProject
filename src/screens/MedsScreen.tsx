import { AlertTriangle } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Badge } from '../components/ui'
import { useStore } from '../state/store'

interface Med {
  name: string
  detail: string
  by: string
  flag?: { label: string; tone: 'warn' | 'neutral' }
}

const CURRENT: Med[] = [
  { name: 'Amlodipine 5mg', detail: '1× daily · morning', by: 'Dr. Rao · since Mar 2026', flag: { label: 'interaction', tone: 'warn' } },
  { name: 'Metformin 500mg', detail: '2× daily', by: 'Dr. Rao · since Jan 2025' },
  { name: 'Atorvastatin 10mg', detail: '1× daily · night', by: 'Dr. Iyer · since May 2026', flag: { label: 'duplicate?', tone: 'neutral' } },
]

const HISTORY: Med[] = [
  { name: 'Telmisartan 40mg', detail: 'Stopped · replaced by Amlodipine', by: 'Dr. Rao · Jan – Mar 2026', flag: { label: 'stopped', tone: 'neutral' } },
  { name: 'Aspirin 75mg', detail: 'Course completed', by: 'City Hosp · May 2026', flag: { label: 'ended', tone: 'neutral' } },
]

export function MedsScreen() {
  const { medTab, set, showToast } = useStore()
  const list = medTab === 'current' ? CURRENT : HISTORY
  const ended = medTab === 'history'

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 20px 12px', font: '600 20px var(--font-ui)', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        Medications
      </div>
      <div className="utabs">
        <button
          className={`utab${medTab === 'current' ? ' utab--on' : ''}`}
          onClick={() => set({ medTab: 'current' })}
        >
          Current
        </button>
        <button
          className={`utab${medTab === 'history' ? ' utab--on' : ''}`}
          onClick={() => set({ medTab: 'history' })}
        >
          History
        </button>
      </div>

      <div className="screen__body scroll" style={{ paddingTop: 16 }}>
        {medTab === 'current' && (
          <button className="callout" style={{ marginBottom: 16 }} onClick={() => showToast('Reviewing interaction')}>
            <span className="callout__icon">
              <AlertTriangle size={17} />
            </span>
            <span className="callout__text">
              <b>Interaction:</b> Amlodipine + Atorvastatin — review
            </span>
          </button>
        )}

        <div className="stack" style={{ gap: 11 }}>
          {list.map((m) => (
            <div className="med-card" key={m.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ font: '15px var(--font-ui)', color: ended ? 'var(--ink-2)' : 'var(--ink)' }}>
                    {m.name}
                  </div>
                  <div style={{ font: '13px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>
                    {m.detail}
                  </div>
                </div>
                {m.flag && <Badge tone={m.flag.tone === 'warn' ? 'warn' : 'neutral'}>{m.flag.label}</Badge>}
              </div>
              <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 8 }}>
                {m.by}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
