import { useState } from 'react'
import { NotebookPen, Pencil } from 'lucide-react'
import { Eyebrow } from '../components/ui'
import { useSession } from '../state/session'
import { api } from '../api/client'

/**
 * Freeform per-patient history & notes — conditions, surgeries, allergies,
 * anything the family or a doctor should know. Stored on the patient record in
 * the database, so it appears for every device and in the doctor summary.
 */
export function PatientNotes({ compact }: { compact?: boolean }) {
  const { activePerson, replacePerson } = useSession()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!activePerson) return null
  const notes = activePerson.notes?.trim() ?? ''

  const startEdit = () => {
    setDraft(activePerson.notes ?? '')
    setError(null)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.updatePerson(activePerson.id, { notes: draft })
      replacePerson(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <Eyebrow>History &amp; notes</Eyebrow>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              font: '600 12px var(--font-ui)',
              color: 'var(--primary)',
            }}
          >
            <Pencil size={13} /> {notes ? 'Edit' : 'Add notes'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="card card--pad" style={{ marginBottom: compact ? 14 : 16 }}>
          <textarea
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            placeholder={'e.g. Diabetic since 2015. Allergic to penicillin.\nKnee replacement (2022). Father had heart disease.'}
            rows={6}
            style={{
              width: '100%',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              padding: '10px 12px',
              font: '14px/1.55 var(--font-ui)',
              color: 'var(--ink)',
              background: 'var(--surface-2)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginTop: 8 }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn btn--ghost" style={{ flex: 1, height: 42 }} disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn btn--primary" style={{ flex: 2, height: 42 }} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        </div>
      ) : notes ? (
        <div
          className="card card--pad"
          style={{ font: '13.5px/1.6 var(--font-ui)', color: 'var(--ink-2)', whiteSpace: 'pre-wrap', marginBottom: compact ? 14 : 16 }}
        >
          {notes}
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="card card--pad"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'var(--ink-4)',
            font: '13px var(--font-ui)',
            marginBottom: compact ? 14 : 16,
          }}
        >
          <NotebookPen size={17} style={{ flex: 'none', color: 'var(--primary)' }} />
          Add medical history — conditions, allergies, surgeries — for doctors and family to see.
        </button>
      )}
    </>
  )
}
