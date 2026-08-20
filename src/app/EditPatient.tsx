import { useState } from 'react'
import { X } from 'lucide-react'
import { useSession } from '../state/session'
import { api, type Person } from '../api/client'

/**
 * Edit a patient's profile (name, age, gender) after creation — in particular
 * so patients added before gender existed can have it stored.
 */
export function EditPatient({ person, onClose }: { person: Person; onClose: () => void }) {
  const { replacePerson } = useSession()
  const [fullName, setFullName] = useState(person.fullName)
  const [age, setAge] = useState(person.ageYears ? String(person.ageYears) : '')
  const [gender, setGender] = useState<string | null>(person.gender)
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
      const updated = await api.updatePerson(person.id, {
        fullName: fullName.trim(),
        ageYears: age ? Number(age) : undefined,
        gender,
      })
      replacePerson(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      setSaving(false)
    }
  }

  return (
    <div className="addsheet-backdrop" onClick={onClose}>
      <div className="addsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ font: '600 17px var(--font-ui)', color: 'var(--ink)', flex: 1 }}>Edit patient</div>
          <button className="iconbtn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <label className="field">
            <span className="field__label">Full name</span>
            <span className="field__input">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </span>
          </label>
          <label className="field">
            <span className="field__label">Age</span>
            <span className="field__input">
              <input
                inputMode="numeric"
                value={age}
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
                  onClick={() => setGender(g)}
                >
                  {g[0].toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {error && <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)' }}>{error}</div>}
          <button className="btn btn--primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
