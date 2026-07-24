import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Plus, Archive, RotateCcw, ChevronRight, X, CalendarDays, List } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { useSession } from '../state/session'
import { useRecords } from './recordsContext'
import { EmptyState } from './EmptyState'
import { deriveMeds, type MedRow } from './derive'
import { useMedArchive } from './medArchive'
import { parseSchedule, SLOTS, SLOT_LABEL, type Slot } from './medSchedule'
import { api } from '../api/client'

type Tab = 'list' | 'schedule'

export function MedsScreen() {
  const navigate = useNavigate()
  const { records, loading } = useRecords()
  const { isArchived, archive, restore } = useMedArchive()
  const meds = deriveMeds(records)
  const [tab, setTab] = useState<Tab>('list')
  const [adding, setAdding] = useState(false)

  const active = meds.filter((m) => !isArchived(m.name))
  const archived = meds.filter((m) => isArchived(m.name))

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen__body scroll">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 12px' }}>
          <div style={{ font: '600 20px var(--font-ui)', color: 'var(--ink)', letterSpacing: '-0.01em', flex: 1 }}>
            Medications
          </div>
          {meds.length > 0 && (
            <button
              className="btn btn--ghost"
              style={{ width: 'auto', height: 34, padding: '0 12px', fontSize: 13 }}
              onClick={() => setAdding(true)}
            >
              <Plus size={15} /> Add
            </button>
          )}
        </div>

        {!loading && meds.length === 0 && !adding && (
          <EmptyState
            icon={<Pill size={26} />}
            title="No medications yet"
            body="Add a prescription and the medicines it lists are collected here automatically — or add one by hand."
            cta="Add a medication"
            onCta={() => setAdding(true)}
          />
        )}

        {meds.length > 0 && (
          <div className="seg" style={{ marginBottom: 16 }}>
            <button className={`seg__item${tab === 'list' ? ' seg__item--on' : ''}`} onClick={() => setTab('list')}>
              <List size={14} style={{ marginRight: 5, verticalAlign: '-2px' }} />
              List
            </button>
            <button
              className={`seg__item${tab === 'schedule' ? ' seg__item--on' : ''}`}
              onClick={() => setTab('schedule')}
            >
              <CalendarDays size={14} style={{ marginRight: 5, verticalAlign: '-2px' }} />
              Schedule
            </button>
          </div>
        )}

        {meds.length > 0 && tab === 'list' && (
          <>
            <div className="stack" style={{ gap: 11 }}>
              {active.map((m) => (
                <MedCard
                  key={m.name}
                  med={m}
                  onOpen={m.recordId ? () => navigate(`/app/record/${m.recordId}`) : undefined}
                  onArchive={() => archive(m.name)}
                />
              ))}
            </div>

            {archived.length > 0 && (
              <>
                <div style={{ font: '600 12px var(--font-ui)', color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '22px 0 10px' }}>
                  Archived · no longer taking
                </div>
                <div className="stack" style={{ gap: 11 }}>
                  {archived.map((m) => (
                    <MedCard key={m.name} med={m} archived onRestore={() => restore(m.name)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {meds.length > 0 && tab === 'schedule' && <ScheduleView meds={active} />}
      </div>

      {adding && (
        <AddMedication
          onClose={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function MedCard({
  med: m,
  archived,
  onOpen,
  onArchive,
  onRestore,
}: {
  med: MedRow
  archived?: boolean
  onOpen?: () => void
  onArchive?: () => void
  onRestore?: () => void
}) {
  return (
    <div className="card card--pad" style={{ padding: 14, opacity: archived ? 0.66 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '15px var(--font-ui)', color: 'var(--ink)' }}>
            {m.name}
            {m.dose ? ` · ${m.dose}` : ''}
          </div>
          {m.frequency && (
            <div style={{ font: '13px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>{m.frequency}</div>
          )}
          <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 7 }}>
            {m.date ? `Updated ${m.date}` : ''}
            {m.date && m.source ? ' · ' : ''}
            {m.source ? `From ${m.source}` : ''}
            {m.occurrences.length > 1 ? ` · seen ${m.occurrences.length}×` : ''}
          </div>
        </div>
        {archived ? (
          <button className="iconbtn" aria-label="Restore medication" onClick={onRestore} title="Move back to active">
            <RotateCcw size={16} />
          </button>
        ) : (
          <button className="iconbtn" aria-label="Archive medication" onClick={onArchive} title="No longer taking">
            <Archive size={16} />
          </button>
        )}
      </div>
      {onOpen && (
        <button
          onClick={onOpen}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 10,
            font: '600 12px var(--font-ui)',
            color: 'var(--primary)',
          }}
        >
          View prescription <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

/** Daily dose calendar — active meds laid out by time of day. */
function ScheduleView({ meds }: { meds: MedRow[] }) {
  const bySlot: Record<Slot, MedRow[]> = { morning: [], afternoon: [], evening: [], night: [] }
  const weekly: MedRow[] = []
  const asNeeded: MedRow[] = []

  for (const m of meds) {
    const s = parseSchedule(m.frequency)
    if (s.asNeeded) asNeeded.push(m)
    else if (s.weekly) weekly.push(m)
    else s.slots.forEach((slot) => bySlot[slot].push(m))
  }

  const medLine = (m: MedRow) => `${m.name}${m.dose ? ` · ${m.dose}` : ''}`

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-4)', marginBottom: 2 }}>
        A typical day, based on each medicine’s instructions.
      </div>
      {SLOTS.map((slot) => (
        <div key={slot} className="card card--pad" style={{ padding: 14 }}>
          <div style={{ font: '600 13px var(--font-ui)', color: 'var(--ink)', marginBottom: bySlot[slot].length ? 10 : 0 }}>
            {SLOT_LABEL[slot]}
          </div>
          {bySlot[slot].length === 0 ? (
            <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-4)' }}>No doses</div>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              {bySlot[slot].map((m) => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flex: 'none' }} />
                  <span style={{ font: '14px var(--font-ui)', color: 'var(--ink-2)' }}>{medLine(m)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {weekly.length > 0 && <SlotBlock title="Weekly / periodic" meds={weekly} lineOf={medLine} />}
      {asNeeded.length > 0 && <SlotBlock title="As needed" meds={asNeeded} lineOf={medLine} />}
    </div>
  )
}

function SlotBlock({ title, meds, lineOf }: { title: string; meds: MedRow[]; lineOf: (m: MedRow) => string }) {
  return (
    <div className="card card--pad" style={{ padding: 14 }}>
      <div style={{ font: '600 13px var(--font-ui)', color: 'var(--ink)', marginBottom: 10 }}>{title}</div>
      <div className="stack" style={{ gap: 8 }}>
        {meds.map((m) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-4)', flex: 'none' }} />
            <span style={{ font: '14px var(--font-ui)', color: 'var(--ink-2)' }}>
              {lineOf(m)}
              {m.frequency ? ` · ${m.frequency}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Manually add a medication — saved as a small prescription record so it flows
 *  through the same pipeline as extracted meds. */
function AddMedication({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { activePerson } = useSession()
  const { refresh } = useRecords()
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const clean = (s: string) => (s.trim() === '' ? null : s.trim())

  const save = async () => {
    if (!name.trim()) {
      setError('Enter a medicine name')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.saveRecord({
        personId: activePerson?.id ?? null,
        kind: 'prescription',
        title: `${name.trim()} (added manually)`,
        doctor: null,
        hospital: null,
        date: today,
        sourceFilename: null,
        documentId: null,
        extracted: {
          documentType: 'prescription',
          title: `${name.trim()} (added manually)`,
          patientName: activePerson?.fullName ?? null,
          doctorName: null,
          hospital: null,
          date: today,
          tags: [],
          values: [],
          medications: [{ name: name.trim(), dose: clean(dose), frequency: clean(frequency) }],
          plainLanguageSummary: 'Medication added manually.',
        },
        explanation: 'Medication added manually.',
      })
      await refresh()
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      setSaving(false)
    }
  }

  return (
    <div className="addsheet-backdrop" onClick={onClose}>
      <div className="addsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ font: '600 17px var(--font-ui)', color: 'var(--ink)', flex: 1 }}>Add a medication</div>
          <button className="iconbtn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <Field label="Medicine name" value={name} onChange={setName} placeholder="e.g. Metformin" autoFocus />
          <div className="row">
            <Field label="Dosage" value={dose} onChange={setDose} placeholder="e.g. 500 mg" />
            <Field label="Frequency" value={frequency} onChange={setFrequency} placeholder="e.g. twice daily" />
          </div>
        </div>
        {error && (
          <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginTop: 12 }}>{error}</div>
        )}
        <button className="btn btn--primary" style={{ marginTop: 18 }} disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save medication'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__input">
        <input value={value} placeholder={placeholder} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  )
}
