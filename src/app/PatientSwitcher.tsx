import { useState } from 'react'
import { ChevronDown, Check, UserRound, UserRoundPlus, X } from 'lucide-react'
import { useSession } from '../state/session'
import { api } from '../api/client'
import { personLine } from './HomeScreen'

/**
 * One account can care for several patients. This is the control that shows who
 * is currently being viewed, switches between patients, and adds new ones.
 * Every screen (records, meds, labs, summary) follows the active patient.
 */
export function PatientSwitcher() {
  const { persons, activePerson, setActivePerson, addPerson, proxyChoice } = useSession()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!activePerson) return null

  const close = () => {
    setOpen(false)
    setAdding(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Switch patient"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 12px',
          borderRadius: 999,
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-sm)',
          font: '600 13px var(--font-ui)',
          color: 'var(--ink)',
          cursor: 'pointer',
          maxWidth: '100%',
        }}
      >
        <UserRound size={15} style={{ color: 'var(--primary)', flex: 'none' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activePerson.fullName}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--ink-4)', flex: 'none' }} />
      </button>

      {open && (
        <div className="addsheet-backdrop" onClick={close}>
          <div className="addsheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ font: '600 17px var(--font-ui)', color: 'var(--ink)', flex: 1 }}>
                {adding ? 'Add a patient' : 'Patients'}
              </div>
              <button className="iconbtn" aria-label="Close" onClick={close}>
                <X size={18} />
              </button>
            </div>

            {adding ? (
              <AddPatientForm
                onSaved={(id) => {
                  setActivePerson(id)
                  close()
                }}
              />
            ) : (
              <>
                <div className="stack" style={{ gap: 9 }}>
                  {persons.map((p) => {
                    const isActive = p.id === activePerson.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePerson(p.id)
                          close()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '13px 14px',
                          borderRadius: 'var(--r-md)',
                          border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--line)'}`,
                          background: isActive ? 'var(--primary-soft)' : 'var(--surface)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <span
                          className="choice__icon"
                          style={{ width: 38, height: 38, borderRadius: '50%' }}
                        >
                          <UserRound size={18} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', font: '600 14.5px var(--font-ui)', color: 'var(--ink)' }}>
                            {p.fullName}
                          </span>
                          <span style={{ display: 'block', font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
                            {personLine(p)}
                          </span>
                        </span>
                        {isActive && <Check size={17} style={{ color: 'var(--primary)', flex: 'none' }} />}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setAdding(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    marginTop: 14,
                    padding: '13px 0',
                    borderRadius: 'var(--r-md)',
                    border: '1.5px dashed var(--line-strong)',
                    background: 'none',
                    font: '600 14px var(--font-ui)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                  }}
                >
                  <UserRoundPlus size={17} /> Add another patient
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )

  function AddPatientForm({ onSaved }: { onSaved: (personId: string) => void }) {
    const [fullName, setFullName] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const save = async () => {
      if (!fullName.trim()) {
        setError('Enter the patient’s name')
        return
      }
      if (!gender) {
        setError('Select the patient’s gender')
        return
      }
      setSaving(true)
      setError(null)
      try {
        const person = await api.createPerson({
          fullName: fullName.trim(),
          ageYears: age ? Number(age) : undefined,
          relationship: 'dependent',
          proxyChoice: proxyChoice ?? 'caretaker',
          gender: gender ?? undefined,
        })
        addPerson(person)
        onSaved(person.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add the patient')
        setSaving(false)
      }
    }

    return (
      <div style={{ display: 'grid', gap: 14 }}>
        <label className="field">
          <span className="field__label">Full name</span>
          <span className="field__input">
            <input
              value={fullName}
              placeholder="e.g. Meera Sharma"
              autoFocus
              onChange={(e) => setFullName(e.target.value)}
            />
          </span>
        </label>
        <label className="field">
          <span className="field__label">Age (optional)</span>
          <span className="field__input">
            <input
              inputMode="numeric"
              value={age}
              placeholder="e.g. 72"
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </span>
        </label>
        <div className="field">
          <span className="field__label">Gender</span>
          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            {(['female', 'male', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={`seg__item${gender === g ? ' seg__item--on' : ''}`}
                onClick={() => setGender(gender === g ? null : g)}
              >
                {g[0].toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)' }}>{error}</div>
        )}
        <button className="btn btn--primary" disabled={saving} onClick={save}>
          {saving ? 'Adding…' : 'Add patient'}
        </button>
        <div style={{ font: '11.5px/1.5 var(--font-ui)', color: 'var(--ink-4)' }}>
          Each patient keeps a completely separate record — documents, medicines, and lab trends.
        </div>
      </div>
    )
  }
}
