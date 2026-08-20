import { useNavigate } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Badge } from '../components/ui'
import { useRecords } from './recordsContext'
import { EmptyState } from './EmptyState'
import { KIND_LABEL, recordSubtitle, displayDate, sortByRecordDate } from './derive'

export function TimelineScreen() {
  const navigate = useNavigate()
  const { records, loading } = useRecords()
  const ordered = sortByRecordDate(records)

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen__body scroll">
        <div style={{ font: '600 20px var(--font-ui)', color: 'var(--ink)', letterSpacing: '-0.01em', padding: '6px 0 14px' }}>
          Timeline
        </div>

        {!loading && records.length === 0 && (
          <EmptyState
            icon={<CalendarClock size={26} />}
            title="Your timeline is empty"
            body="Every document you add shows up here in order, building a complete medical history over time."
          />
        )}

        {records.length > 0 && (
          <div>
            {ordered.map((r) => (
              <div className="tl-item" key={r.id}>
                <div className="tl-rail">
                  <div
                    className="tl-dot"
                    style={{
                      background: r.extracted?.values?.some((v) => v.flag) ? 'var(--alert)' : 'var(--primary)',
                      outline: '1px solid var(--line-strong)',
                    }}
                  />
                  <div className="tl-line" />
                </div>
                <button
                  className="listrow"
                  style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}
                  onClick={() => navigate(`/app/record/${r.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="listrow__title" style={{ flex: 1, fontSize: 14 }}>
                      {r.title ?? 'Document'}
                    </div>
                    {r.kind && <Badge tone="neutral">{KIND_LABEL[r.kind] ?? r.kind}</Badge>}
                  </div>
                  <div className="listrow__sub">{recordSubtitle(r)}</div>
                  {r.explanation && (
                    <div
                      style={{
                        font: '13px/1.5 var(--font-ui)',
                        color: 'var(--ink-2)',
                        marginTop: 9,
                        paddingTop: 9,
                        borderTop: '1px solid var(--line)',
                      }}
                    >
                      {r.explanation}
                    </div>
                  )}
                  <div style={{ font: '11px var(--font-ui)', color: 'var(--ink-4)', marginTop: 8 }}>
                    {r.date ? displayDate(r) : `Added ${displayDate(r)}`}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
