import { SlidersHorizontal, Search, X } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Eyebrow, Badge } from '../components/ui'
import { useStore } from '../state/store'
import { TIMELINE, TIMELINE_OVERVIEWS, type OverviewPanel } from '../data/timeline'
import type { TimelineEvent, TimelineFilter } from '../data/types'

const FILTERS: { id: TimelineFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rao', label: 'Dr. Rao' },
  { id: 'apollo', label: 'Apollo' },
  { id: 'cardio', label: 'Cardio' },
]

export function TimelineScreen() {
  const { tlFilter, tlQuery, set, showToast } = useStore()
  const q = tlQuery.trim().toLowerCase()
  const searching = q.length > 0

  const visible = TIMELINE.filter((e) => {
    const matchFilter = tlFilter === 'all' || e.tags.includes(tlFilter)
    const matchQuery =
      !q || `${e.title} ${e.sub} ${e.badge} ${e.note ?? ''}`.toLowerCase().includes(q)
    return matchFilter && matchQuery
  })
  const june = visible.filter((e) => e.month === 'jun')
  const may = visible.filter((e) => e.month === 'may')

  const overview: OverviewPanel | null =
    !searching && tlFilter !== 'all' ? TIMELINE_OVERVIEWS[tlFilter] : null

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen__body scroll" style={{ paddingTop: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 0 12px',
          }}
        >
          <div style={{ font: '600 20px var(--font-ui)', color: 'var(--ink)', flex: 1, letterSpacing: '-0.01em' }}>
            Timeline
          </div>
          <button className="iconbtn" onClick={() => showToast('Filter timeline')} aria-label="Filter">
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="searchbar">
          <Search size={16} style={{ color: 'var(--ink-4)' }} />
          <input
            value={tlQuery}
            onChange={(e) => set({ tlQuery: e.target.value })}
            placeholder="Search records, doctors, tests"
          />
          {searching && (
            <button onClick={() => set({ tlQuery: '' })} aria-label="Clear search">
              <X size={16} style={{ color: 'var(--ink-4)' }} />
            </button>
          )}
        </div>

        {searching && (
          <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginBottom: 12 }}>
            {visible.length} {visible.length === 1 ? 'result' : 'results'} for “{tlQuery}”
          </div>
        )}

        <div className="chiprow" style={{ marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`chip${tlFilter === f.id ? ' chip--on' : ''}`}
              onClick={() => set({ tlFilter: f.id })}
            >
              {f.label}
            </button>
          ))}
        </div>

        {searching && visible.length === 0 && (
          <div
            className="card card--pad"
            style={{ textAlign: 'center', padding: '24px 16px', marginBottom: 12 }}
          >
            <div style={{ font: '14px var(--font-ui)', color: 'var(--ink-2)' }}>
              No records match your search.
            </div>
            <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-4)', marginTop: 5 }}>
              Try a doctor, test or hospital name.
            </div>
          </div>
        )}

        {/* ALL overview stats */}
        {!searching && tlFilter === 'all' && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card__v">2</div>
              <div className="stat-card__k">Visits</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__v">2</div>
              <div className="stat-card__k">Blood tests</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__v">1</div>
              <div className="stat-card__k">Admission</div>
            </div>
          </div>
        )}

        {overview && <OverviewCard panel={overview} />}

        {june.length > 0 && (
          <>
            <Eyebrow>June 2026</Eyebrow>
            {june.map((e, i) => (
              <EventRow key={`jun-${i}`} event={e} />
            ))}
          </>
        )}
        {may.length > 0 && (
          <>
            <Eyebrow>May 2026</Eyebrow>
            {may.map((e, i) => (
              <EventRow key={`may-${i}`} event={e} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function dotColor(tone: TimelineEvent['tone']) {
  if (tone === 'alert') return 'var(--alert)'
  if (tone === 'good') return 'var(--good)'
  return 'var(--primary)'
}

function EventRow({ event }: { event: TimelineEvent }) {
  const { openRecord, showToast } = useStore()
  const onClick = () =>
    event.rec ? openRecord(event.rec) : showToast(`${event.title} · ${event.date}`)
  return (
    <div className="tl-item">
      <div className="tl-rail">
        <div className="tl-dot" style={{ background: dotColor(event.tone), outline: `1px solid var(--line-strong)` }} />
        <div className="tl-line" />
      </div>
      <button className="listrow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }} onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="listrow__title" style={{ flex: 1, fontSize: 14 }}>
            {event.title}
          </div>
          <Badge tone={event.tone}>{event.badge}</Badge>
        </div>
        <div className="listrow__sub">{event.sub}</div>
        {event.note && (
          <div
            style={{
              font: '13px/1.5 var(--font-ui)',
              color: 'var(--ink-2)',
              marginTop: 9,
              paddingTop: 9,
              borderTop: '1px solid var(--line)',
            }}
          >
            {event.note}
          </div>
        )}
        <div style={{ font: '11px var(--font-ui)', color: 'var(--ink-4)', marginTop: 8 }}>
          {event.date}
        </div>
      </button>
    </div>
  )
}

function OverviewCard({ panel }: { panel: OverviewPanel }) {
  const { set } = useStore()
  return (
    <div className="overview-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {panel.initials && (
          <div className="doctor-head__avatar" style={{ width: 42, height: 42 }}>
            {panel.initials}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ font: '600 15px var(--font-ui)', color: 'var(--ink)' }}>{panel.title}</div>
          <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
            {panel.sub}
          </div>
        </div>
        <button className="link" onClick={() => set({ tlFilter: 'all' })}>
          Show all
        </button>
      </div>
      <div style={{ font: '12.5px var(--font-ui)', color: 'var(--ink-3)', margin: '12px 0 0' }}>
        {panel.count}
      </div>

      {panel.note && (
        <div
          style={{
            font: '13px/1.55 var(--font-ui)',
            color: 'var(--ink-2)',
            padding: '11px 0 0',
            marginTop: 11,
            borderTop: '1px solid var(--line)',
          }}
        >
          {panel.note}
        </div>
      )}

      {panel.metrics.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            paddingTop: 11,
            marginTop: 11,
            borderTop: '1px solid var(--line)',
          }}
        >
          {panel.metrics.map((m) => (
            <div key={m.k} style={{ flex: 1 }}>
              <div style={{ font: '11px var(--font-ui)', color: 'var(--ink-4)' }}>{m.k}</div>
              <div
                style={{
                  font: '600 15px var(--font-ui)',
                  marginTop: 3,
                  color: m.tone === 'alert' ? 'var(--alert)' : m.tone === 'good' ? 'var(--good)' : 'var(--ink)',
                }}
              >
                {m.v}
              </div>
            </div>
          ))}
        </div>
      )}

      {panel.doctors && (
        <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
          {panel.doctors.map((d) => (
            <div
              key={d.name}
              style={{ flex: 1, padding: '10px 11px', background: 'var(--surface-3)', borderRadius: 'var(--r-sm)' }}
            >
              <div style={{ font: '13px var(--font-ui)', color: 'var(--ink)' }}>{d.name}</div>
              <div style={{ font: '11px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>
                {d.detail}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
