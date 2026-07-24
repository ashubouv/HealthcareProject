import { Share2, FileText } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Eyebrow, DocThumb, toneColor } from '../components/ui'
import { useStore } from '../state/store'
import { RECORDS, RECORD_VALUES } from '../data/records'

export function RecordScreen() {
  const { recId, recLang, set, go, showToast } = useStore()
  const meta = RECORDS[recId]
  const values = RECORD_VALUES[recId]

  return (
    <div className="screen">
      <TopBar
        title={meta.title}
        onBack={() => go('timeline')}
        action={
          <button className="iconbtn" onClick={() => showToast('Share this record')} aria-label="Share">
            <Share2 size={17} />
          </button>
        }
      />
      <div className="screen__body scroll">
        <button
          onClick={() => showToast('Opening original scan')}
          style={{ width: '100%', display: 'block' }}
        >
          <DocThumb width="100%" height={150} radius={13} style={{ marginBottom: 8 }} />
        </button>
        <button
          onClick={() => showToast('Opening original scan')}
          style={{
            display: 'block',
            margin: '0 auto 18px',
            font: '13px var(--font-ui)',
            color: 'var(--primary)',
          }}
        >
          {meta.pages}
        </button>

        <Eyebrow>{values.heading}</Eyebrow>
        <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 18 }}>
          {values.rows.map((r) => (
            <div className="kv" key={r.k}>
              <span>{r.k}</span>
              <span className="kv__v" style={{ color: toneColor(r.tone) }}>
                {r.v}
              </span>
            </div>
          ))}
        </div>

        <div className="card card--pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <Eyebrow>What this means</Eyebrow>
            <div className="lang-seg">
              <button
                className={`lang-seg__item${recLang === 'en' ? ' lang-seg__item--on' : ''}`}
                onClick={() => set({ recLang: 'en' })}
              >
                EN
              </button>
              <button
                className={`lang-seg__item${recLang === 'ta' ? ' lang-seg__item--on' : ''}`}
                onClick={() => set({ recLang: 'ta' })}
              >
                தமிழ்
              </button>
            </div>
          </div>
          <div style={{ font: '14px/1.6 var(--font-ui)', color: 'var(--ink-2)' }}>
            {meta.explain[recLang]}
          </div>
        </div>

        <button className="attach" style={{ marginTop: 18 }} onClick={() => showToast('Opening original scan')}>
          <span className="choice__icon choice__icon--ghost" style={{ width: 36, height: 36 }}>
            <FileText size={18} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', font: '14px var(--font-ui)', color: 'var(--ink)' }}>
              {meta.title} · original
            </span>
            <span style={{ display: 'block', font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
              {meta.source}
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
