import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { useSession } from '../state/session'
import { api } from '../api/client'

/**
 * Step 5 — create the first person/patient record. Captured in memory and
 * attached to the account via the (stubbed) proxy relationship, then onboarding
 * is marked complete and the user enters the app.
 * TODO: validation, date-of-birth, adding more than one dependent.
 */
export function PersonStep() {
  const navigate = useNavigate()
  const { proxyChoice, addPerson, completeOnboarding } = useSession()
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // must have picked self / caretaker first
  if (!proxyChoice) return <Navigate to="/onboarding/proxy" replace />

  const isSelf = proxyChoice === 'self'

  const save = async () => {
    if (!fullName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const person = await api.createPerson({
        fullName: fullName.trim(),
        ageYears: age ? Number(age) : undefined,
        relationship: isSelf ? 'self' : 'dependent',
        proxyChoice,
        gender: gender ?? undefined,
      })
      addPerson(person)
      completeOnboarding()
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <StatusBar />
      <TopBar onBack={() => navigate('/onboarding/proxy')} />
      <div className="screen__body scroll" style={{ paddingTop: 6 }}>
        <div className="auth__h" style={{ marginBottom: 8 }}>
          {isSelf ? 'Tell us about you' : 'Add the patient'}
        </div>
        <div className="auth__p" style={{ marginBottom: 22 }}>
          {isSelf
            ? 'This sets up your personal health record.'
            : 'This is the person whose records you’ll manage.'}
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="field">
            <div className="field__label">Full name</div>
            <div className="field__input">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isSelf ? 'Your name' : 'Patient’s name'}
                autoFocus
              />
            </div>
          </div>
          <div className="field">
            <div className="field__label">Age (optional)</div>
            <div className="field__input">
              <input
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 68"
              />
            </div>
          </div>
          <div className="field">
            <div className="field__label">Gender</div>
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
        </div>
      </div>
      <div className="screen-foot">
        {error && (
          <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginBottom: 10 }}>
            {error}
          </div>
        )}
        <button
          className="btn btn--primary"
          disabled={saving || !fullName.trim() || !gender}
          style={!fullName.trim() || !gender ? { opacity: 0.5 } : undefined}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Finish setup'}
        </button>
      </div>
    </div>
  )
}
