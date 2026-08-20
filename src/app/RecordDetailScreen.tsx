import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Eyebrow, Badge } from '../components/ui'
import { useRecords } from './recordsContext'
import { viewDocument } from './viewDocument'
import { TYPE_LABEL, displayDate } from './derive'
import { api, type Extracted, type ExtractedMedication, type RecordRow } from '../api/client'

export function RecordDetailScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { byId, loading, refresh } = useRecords()
  const record = id ? byId(id) : undefined

  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const back = () => navigate(-1)

  const remove = async () => {
    if (!record) return
    if (!window.confirm('Delete this document? This permanently removes the record and its original file.')) return
    setDeleting(true)
    try {
      await api.deleteRecord(record.id)
      await refresh()
      navigate('/app/timeline', { replace: true })
    } catch (err) {
      setDeleting(false)
      window.alert(err instanceof Error ? err.message : 'Could not delete the record')
    }
  }

  if (loading && !record) {
    return (
      <div className="screen">
        <TopBar title="Record" onBack={back} />
        <div className="screen__body" style={{ color: 'var(--ink-3)', font: '14px var(--font-ui)' }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="screen">
        <TopBar title="Record" onBack={back} />
        <div className="screen__body" style={{ color: 'var(--ink-3)', font: '14px var(--font-ui)' }}>
          This record could not be found.
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <EditRecord
        record={record}
        onDone={async () => {
          await refresh()
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const ex = record.extracted

  return (
    <div className="screen">
      <TopBar
        title={record.title ?? 'Record'}
        onBack={back}
        action={
          <button className="iconbtn" onClick={() => setEditing(true)} aria-label="Edit record">
            <Pencil size={18} />
          </button>
        }
      />
      <div className="screen__body scroll">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          {ex && <Badge variant="solid">{TYPE_LABEL[ex.documentType]}</Badge>}
        </div>

        {record.documentId ? (
          <ViewOriginal documentId={record.documentId} filename={record.sourceFilename} />
        ) : (
          record.sourceFilename && (
            <div className="attach" style={{ marginBottom: 16, cursor: 'default' }}>
              <span className="choice__icon choice__icon--ghost" style={{ width: 38, height: 38 }}>
                <FileText size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '14px var(--font-ui)', color: 'var(--ink)' }}>
                  {record.sourceFilename}
                </div>
                <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-4)', marginTop: 2 }}>
                  Original not stored for this record
                </div>
              </div>
            </div>
          )
        )}

        <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
          <Field k="Patient" v={ex?.patientName ?? null} />
          <Field k="Doctor" v={record.doctor} />
          <Field k="Hospital" v={record.hospital} />
          <Field k="Date" v={record.date ? displayDate(record) : null} />
        </div>

        {ex && ex.values.length > 0 && (
          <>
            <Eyebrow>Results</Eyebrow>
            <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
              {ex.values.map((row, i) => (
                <div className="kv" key={i}>
                  <span>{row.name}</span>
                  <span className="kv__v" style={row.flag ? { color: 'var(--alert)' } : undefined}>
                    {row.value}
                    {row.unit ? ` ${row.unit}` : ''}
                    {row.flag ? ` · ${row.flag}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {ex && ex.medications.length > 0 && (
          <>
            <Eyebrow>Medications</Eyebrow>
            <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
              {ex.medications.map((m, i) => (
                <div className="kv" key={i}>
                  <span>
                    {m.name}
                    {m.dose ? ` ${m.dose}` : ''}
                  </span>
                  <span className="kv__v">{m.frequency ?? ''}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {record.explanation && (
          <>
            <Eyebrow>What this means</Eyebrow>
            <div className="card card--pad" style={{ font: '14px/1.6 var(--font-ui)', color: 'var(--ink-2)', marginBottom: 16 }}>
              {record.explanation}
            </div>
          </>
        )}

        {ex && ex.tags.length > 0 && (
          <div className="chiprow">
            {ex.tags.map((t) => (
              <span key={t} className="chip chip--tag">
                {t}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={remove}
          disabled={deleting}
          style={{
            all: 'unset',
            cursor: deleting ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            width: '100%',
            marginTop: 26,
            padding: '12px 0',
            borderRadius: 'var(--r-md)',
            border: '1px solid oklch(0.85 0.06 25)',
            color: 'var(--alert)',
            font: '600 14px var(--font-ui)',
            opacity: deleting ? 0.6 : 1,
          }}
        >
          <Trash2 size={16} /> {deleting ? 'Deleting…' : 'Delete document'}
        </button>
      </div>
    </div>
  )
}

/* ---------- Edit mode ---------- */

interface Draft {
  patientName: string
  doctor: string
  hospital: string
  date: string
  medications: ExtractedMedication[]
}

function EditRecord({
  record,
  onDone,
  onCancel,
}: {
  record: RecordRow
  onDone: () => Promise<void>
  onCancel: () => void
}) {
  const ex = record.extracted
  const [draft, setDraft] = useState<Draft>({
    patientName: ex?.patientName ?? '',
    doctor: record.doctor ?? '',
    hospital: record.hospital ?? '',
    date: record.date ?? '',
    medications: ex?.medications.map((m) => ({ ...m })) ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const setMed = (i: number, patch: Partial<ExtractedMedication>) =>
    setDraft((d) => ({
      ...d,
      medications: d.medications.map((m, j) => (j === i ? { ...m, ...patch } : m)),
    }))

  const addMed = () =>
    setDraft((d) => ({
      ...d,
      medications: [...d.medications, { name: '', dose: null, frequency: null }],
    }))

  const removeMed = (i: number) =>
    setDraft((d) => ({ ...d, medications: d.medications.filter((_, j) => j !== i) }))

  const clean = (s: string) => {
    const t = s.trim()
    return t === '' ? null : t
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      // Keep the extracted JSON in sync with the edited top-level fields, so
      // every screen that reads either source shows the same values.
      const base: Extracted = ex ?? {
        documentType: 'other',
        title: record.title ?? 'Record',
        patientName: null,
        doctorName: null,
        hospital: null,
        date: null,
        tags: [],
        values: [],
        medications: [],
        plainLanguageSummary: record.explanation ?? '',
      }
      const updatedExtracted: Extracted = {
        ...base,
        patientName: clean(draft.patientName),
        doctorName: clean(draft.doctor),
        hospital: clean(draft.hospital),
        date: clean(draft.date),
        medications: draft.medications
          .filter((m) => m.name.trim() !== '')
          .map((m) => ({
            name: m.name.trim(),
            dose: clean(m.dose ?? ''),
            frequency: clean(m.frequency ?? ''),
          })),
      }
      await api.updateRecord(record.id, {
        title: record.title,
        doctor: clean(draft.doctor),
        hospital: clean(draft.hospital),
        date: clean(draft.date),
        extracted: updatedExtracted,
      })
      await onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes')
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <TopBar title="Edit record" onBack={onCancel} backIcon="close" />
      <div className="screen__body scroll">
        <Eyebrow>Details</Eyebrow>
        <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
          <TextField
            label="Patient name"
            value={draft.patientName}
            onChange={(v) => set('patientName', v)}
            placeholder="Full name"
          />
          <TextField
            label="Doctor"
            value={draft.doctor}
            onChange={(v) => set('doctor', v)}
            placeholder="Doctor's name"
          />
          <TextField
            label="Hospital"
            value={draft.hospital}
            onChange={(v) => set('hospital', v)}
            placeholder="Clinic or hospital"
          />
          <TextField
            label="Date"
            value={draft.date}
            onChange={(v) => set('date', v)}
            placeholder="e.g. 2026-06-28"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Eyebrow>Medications</Eyebrow>
          <button
            className="linkbtn"
            onClick={addMed}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              font: '600 13px var(--font-ui)',
              color: 'var(--primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add
          </button>
        </div>

        {draft.medications.length === 0 && (
          <div style={{ font: '13px var(--font-ui)', color: 'var(--ink-4)', marginBottom: 20 }}>
            No medications. Tap “Add” to record one.
          </div>
        )}

        <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
          {draft.medications.map((m, i) => (
            <div key={i} className="card card--pad" style={{ padding: 14, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ font: '600 12px var(--font-ui)', color: 'var(--ink-4)' }}>
                  Medicine {i + 1}
                </span>
                <button
                  className="iconbtn"
                  onClick={() => removeMed(i)}
                  aria-label="Remove medication"
                  style={{ color: 'var(--alert)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <TextField
                label="Name"
                value={m.name}
                onChange={(v) => setMed(i, { name: v })}
                placeholder="Medicine name"
              />
              <div className="row">
                <TextField
                  label="Dosage"
                  value={m.dose ?? ''}
                  onChange={(v) => setMed(i, { dose: v })}
                  placeholder="e.g. 500 mg"
                />
                <TextField
                  label="Frequency"
                  value={m.frequency ?? ''}
                  onChange={(v) => setMed(i, { frequency: v })}
                  placeholder="e.g. twice daily"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="screen-foot">
        {error && (
          <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginBottom: 10 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 11 }}>
          <button className="btn btn--ghost" disabled={saving} onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={saving} onClick={save} style={{ flex: 2 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__input">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  )
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="kv">
      <span>{k}</span>
      <span className="kv__v" style={!v ? { color: 'var(--ink-4)', fontWeight: 400 } : undefined}>
        {v ?? 'Not found'}
      </span>
    </div>
  )
}

function ViewOriginal({ documentId, filename }: { documentId: string; filename: string | null }) {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = async () => {
    setOpening(true)
    setError(null)
    try {
      await viewDocument(documentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the document')
    } finally {
      setOpening(false)
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button className="attach" onClick={open} disabled={opening}>
        <span className="choice__icon">
          <FileText size={18} />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', font: '14px var(--font-ui)', color: 'var(--ink)' }}>
            {opening ? 'Opening…' : 'View original document'}
          </span>
          <span style={{ display: 'block', font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
            {filename ?? 'Opens in a new tab'}
          </span>
        </span>
        <ExternalLink size={17} className="chev" />
      </button>
      {error && (
        <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginTop: 8 }}>{error}</div>
      )}
    </div>
  )
}
