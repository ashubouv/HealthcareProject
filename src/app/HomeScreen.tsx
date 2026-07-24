import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, Inbox, AlertTriangle, X, Pencil } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Eyebrow, Badge } from '../components/ui'
import { useSession } from '../state/session'
import { useRecords } from './recordsContext'
import { EmptyState } from './EmptyState'
import { KIND_LABEL, deriveMeds, recordSubtitle } from './derive'
import { useDismissedFlags } from './dismissedFlags'
import { PatientSwitcher } from './PatientSwitcher'
import { PatientNotes } from './PatientNotes'
import { EditPatient } from './EditPatient'

/** "Female · 72 yrs"-style profile line. */
export function personLine(p: { relationship: string; gender: string | null; ageYears: number | null }): string {
  const bits = [p.relationship === 'self' ? 'You' : 'In your care']
  if (p.gender) bits.push(p.gender[0].toUpperCase() + p.gender.slice(1))
  if (p.ageYears) bits.push(`${p.ageYears} yrs`)
  return bits.join(' · ')
}

/** Stable identity for a flagged value so a dismissal maps to that exact item. */
function flagKey(recordId: string, name: string, flag: string): string {
  return `${recordId}::${name}::${flag}`
}

export function HomeScreen() {
  const navigate = useNavigate()
  const { activePerson, proxyChoice } = useSession()
  const { records, loading } = useRecords()
  const { isDismissed, dismiss } = useDismissedFlags()
  const [editingPatient, setEditingPatient] = useState(false)

  const name = activePerson?.fullName?.split(' ')[0] ?? 'there'
  const meds = deriveMeds(records)
  const flagged = records.flatMap((r) =>
    (r.extracted?.values ?? [])
      .filter((v) => v.flag)
      .map((v) => ({ ...v, record: r, key: flagKey(r.id, v.name, v.flag as string) })),
  )
  const activeFlags = flagged.filter((f) => !isDismissed(f.key))
  const recent = records.slice(0, 3)

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen__body scroll">
        <div style={{ padding: '8px 0 0' }}>
          <div className="greeting__small">Welcome</div>
          <div className="greeting__name">Hello, {name}</div>
        </div>
        <div className="greeting__line">
          {proxyChoice === 'caretaker'
            ? 'You’re managing this record as a caretaker.'
            : 'Your personal health record.'}
        </div>
        <div style={{ margin: '2px 0 18px' }}>
          <PatientSwitcher />
        </div>

        {!loading && records.length === 0 && (
          <>
            <Eyebrow>Your record</Eyebrow>
            <EmptyState
              icon={<Inbox size={26} />}
              title="No records yet"
              body="Add your first document — a lab report, prescription or discharge summary — and the AI will read it into your record."
              cta="Add your first document"
            />
          </>
        )}

        {records.length > 0 && (
          <>
            <Eyebrow>Snapshot</Eyebrow>
            <div className="card card--pad" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex' }}>
                <Stat value={records.length} label={records.length === 1 ? 'Record' : 'Records'} />
                <Stat value={meds.length} label="Medications" divider />
                <Stat value={activeFlags.length} label="Flags" divider />
              </div>
            </div>

            {activeFlags.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <Eyebrow>Needs your attention</Eyebrow>
                  {activeFlags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => dismiss(...activeFlags.map((f) => f.key))}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        font: '600 12px var(--font-ui)',
                        color: 'var(--primary)',
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="stack" style={{ gap: 9, marginBottom: 16 }}>
                  {activeFlags.slice(0, 3).map((f) => (
                    <div key={f.key} className="callout" style={{ gap: 0 }}>
                      <button
                        onClick={() => navigate(`/app/record/${f.record.id}`)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 11,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span className="callout__icon">
                          <AlertTriangle size={17} />
                        </span>
                        <span className="callout__text">
                          <b>{f.name}</b> {f.value}
                          {f.unit ? ` ${f.unit}` : ''} · {f.flag}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Clear ${f.name} notification`}
                        onClick={() => dismiss(f.key)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          flex: 'none',
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'oklch(0.5 0.1 65)',
                          marginLeft: 4,
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Eyebrow>Recent</Eyebrow>
            <div className="stack" style={{ gap: 9 }}>
              {recent.map((r) => (
                <button key={r.id} className="listrow" onClick={() => navigate(`/app/record/${r.id}`)}>
                  <span className="choice__icon choice__icon--ghost" style={{ width: 38, height: 38 }}>
                    <FileText size={18} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="listrow__title" style={{ fontSize: 14 }}>
                      {r.title ?? 'Document'}
                    </div>
                    <div className="listrow__sub">{recordSubtitle(r)}</div>
                  </div>
                  {r.kind && <Badge tone="neutral">{KIND_LABEL[r.kind] ?? r.kind}</Badge>}
                  <ChevronRight size={16} className="chev" />
                </button>
              ))}
            </div>
          </>
        )}

        {activePerson && (
          <>
            <div style={{ marginTop: 16 }}>
              <PatientNotes />
            </div>
            <Eyebrow>Patient</Eyebrow>
            <div className="card card--pad" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '15px var(--font-ui)', color: 'var(--ink)' }}>
                  {activePerson.fullName}
                </div>
                <div style={{ font: '13px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>
                  {personLine(activePerson)}
                </div>
                {!activePerson.gender && (
                  <button
                    type="button"
                    onClick={() => setEditingPatient(true)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      font: '600 12px var(--font-ui)',
                      color: 'var(--primary)',
                      marginTop: 6,
                      display: 'block',
                    }}
                  >
                    Add gender to complete the profile
                  </button>
                )}
              </div>
              <button className="iconbtn" aria-label="Edit patient" onClick={() => setEditingPatient(true)}>
                <Pencil size={16} />
              </button>
            </div>
          </>
        )}

        {editingPatient && activePerson && (
          <EditPatient person={activePerson} onClose={() => setEditingPatient(false)} />
        )}
      </div>
    </div>
  )
}

function Stat({ value, label, divider }: { value: number; label: string; divider?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        paddingLeft: divider ? 12 : 0,
        borderLeft: divider ? '1px solid var(--line)' : undefined,
      }}
    >
      <div style={{ font: '600 22px var(--font-ui)', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
