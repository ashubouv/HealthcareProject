import { ChevronRight, FileText } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Eyebrow } from '../components/ui'
import { useStore } from '../state/store'
import { HISTORY } from '../data/history'
import type { RecordId } from '../data/types'

export function HistoryScreen() {
  const { labMetric, go, openRecord, showToast } = useStore()
  const h = HISTORY[labMetric]

  const open = (rec: RecordId | null) =>
    rec ? openRecord(rec) : showToast('No document attached')

  return (
    <div className="screen">
      <TopBar title={`${h.cond} · history`} onBack={() => go('labs')} />
      <div className="screen__body scroll">
        {/* condition overview */}
        <div className="card card--pad" style={{ marginBottom: 20 }}>
          <div style={{ font: '600 16px var(--font-ui)', color: 'var(--ink)' }}>{h.cond}</div>
          <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
            {h.condSub}
          </div>
          <div style={{ font: '13px/1.6 var(--font-ui)', color: 'var(--ink-2)', margin: '12px 0' }}>
            {h.overview}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {h.stats.map((s) => (
              <div
                key={s.k}
                style={{ flex: 1, background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', padding: '10px 6px', textAlign: 'center' }}
              >
                <div style={{ font: '600 14px var(--font-ui)', color: 'var(--ink)' }}>{s.v}</div>
                <div style={{ font: '10.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 3 }}>
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Eyebrow>Medications</Eyebrow>
        <div className="stack" style={{ gap: 9, marginBottom: 20 }}>
          {h.meds.map((m) => (
            <div className="med-card" key={m.name}>
              <div style={{ font: '15px var(--font-ui)', color: 'var(--ink)' }}>{m.name}</div>
              <div style={{ font: '12.5px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>
                {m.detail}
              </div>
              <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 6 }}>
                {m.by}
              </div>
            </div>
          ))}
        </div>

        <Eyebrow>Lab results &amp; paperwork</Eyebrow>
        <div className="stack" style={{ gap: 9, marginBottom: 20 }}>
          {h.labs.map((l, i) => (
            <button className="listrow" key={i} onClick={() => open(l.rec)}>
              <div style={{ flex: 1 }}>
                <div className="listrow__title" style={{ fontSize: 14 }}>
                  {l.name}
                </div>
                <div className="listrow__sub">{l.date}</div>
              </div>
              <div style={{ font: '14px var(--font-ui)', color: 'var(--ink-2)' }}>{l.result}</div>
              {l.rec && (
                <span className="badge badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <FileText size={11} /> Report
                </span>
              )}
            </button>
          ))}
        </div>

        <Eyebrow>Hospitals &amp; visits</Eyebrow>
        <div className="stack" style={{ gap: 9 }}>
          {h.visits.map((v, i) => (
            <button
              className="listrow"
              key={i}
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}
              onClick={() => open(v.rec)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ font: '15px var(--font-ui)', color: 'var(--ink)' }}>{v.place}</div>
                <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)' }}>{v.date}</div>
              </div>
              <div style={{ font: '12.5px var(--font-ui)', color: 'var(--ink-3)', marginTop: 5 }}>
                {v.dept}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 9, alignItems: 'center' }}>
                <span className="badge badge--neutral">{v.badge}</span>
                {v.rec && (
                  <span className="badge badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    Paperwork <ChevronRight size={11} />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
