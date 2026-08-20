import { Check } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Eyebrow, Badge, TrendIcon } from '../components/ui'
import { TrendChart } from '../components/TrendChart'
import { useStore } from '../state/store'
import { LABS } from '../data/labs'
import type { LabMetric } from '../data/types'

const METRICS: { id: LabMetric; label: string }[] = [
  { id: 'chol', label: 'Cholesterol' },
  { id: 'bp', label: 'BP' },
  { id: 'sugar', label: 'Sugar' },
]

export function LabsScreen() {
  const { labMetric, set, go } = useStore()
  const d = LABS[labMetric]
  const chartTone = d.statusTone === 'good' ? 'good' : d.statusTone === 'alert' ? 'alert' : 'neutral'

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 20px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ font: '600 20px var(--font-ui)', color: 'var(--ink)', flex: 1, letterSpacing: '-0.01em' }}>
          Lab results
        </div>
        <button className="btn btn--ghost" style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }} onClick={() => go('summary')}>
          Doctor summary
        </button>
      </div>

      <div className="chiprow" style={{ padding: '0 20px 14px' }}>
        {METRICS.map((m) => (
          <button
            key={m.id}
            className={`chip${labMetric === m.id ? ' chip--on' : ''}`}
            onClick={() => set({ labMetric: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="screen__body scroll">
        <div className="lab-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ font: '14px var(--font-ui)', color: 'var(--ink-2)' }}>{d.title}</div>
            <Badge tone={d.statusTone}>{d.status}</Badge>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
            <div className="lab-hero__value">
              {d.value}
              <span className="lab-hero__unit">{d.unit}</span>
            </div>
            <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)' }}>{d.delta}</div>
          </div>
          <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginBottom: 14 }}>
            {d.range}
          </div>
          <TrendChart bars={d.bars} tone={chartTone} />
        </div>

        <div
          className="card card--pad"
          style={{ font: '13px/1.6 var(--font-ui)', color: 'var(--ink-2)', marginBottom: 20 }}
        >
          {d.summary}
        </div>

        <Eyebrow>All readings</Eyebrow>
        <div className="stack" style={{ gap: 8, marginBottom: 20 }}>
          {d.readings.map((r) => (
            <div
              key={r.date}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)',
                padding: '12px 14px',
                font: '14px var(--font-ui)',
                color: 'var(--ink-2)',
              }}
            >
              <span>{r.date}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ink)', fontWeight: 500 }}>
                {r.value} <TrendIcon trend={r.trend} />
              </span>
            </div>
          ))}
        </div>

        <Eyebrow>How to improve — doctor’s advice</Eyebrow>
        <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 20 }}>
          {d.recs.map((rec) => (
            <div className="rec-item" key={rec}>
              <span className="rec-item__num">
                <Check size={13} strokeWidth={3} />
              </span>
              <div style={{ flex: 1, font: '14px/1.5 var(--font-ui)', color: 'var(--ink-2)' }}>{rec}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => go('history')}>
            History
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => go('sharing')}>
            Sharing
          </button>
        </div>
      </div>
    </div>
  )
}
