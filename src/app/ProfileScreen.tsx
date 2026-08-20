import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserRound,
  UserRoundPlus,
  Pencil,
  LogOut,
  ShieldCheck,
  FileText,
  ChevronRight,
  Download,
  X,
} from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Eyebrow } from '../components/ui'
import { useSession } from '../state/session'
import { useRecords } from './recordsContext'
import { api, getToken, type Person } from '../api/client'
import { EditPatient } from './EditPatient'
import { personLine } from './HomeScreen'

/**
 * Profile & account hub, reached from the tab bar: who is signed in, the
 * patients this account manages, data/privacy information, and sign out.
 */
export function ProfileScreen() {
  const navigate = useNavigate()
  const { contact, persons, activePerson, setActivePerson, signOut } = useSession()
  const { records } = useRecords()
  const [editing, setEditing] = useState<Person | null>(null)
  const [adding, setAdding] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  /** Download the account's complete record as a JSON file the user keeps. */
  const downloadBackup = async () => {
    setBackingUp(true)
    try {
      const token = getToken()
      const res = await fetch('/api/records/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Could not create the backup')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'healthkeeper-backup.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not create the backup')
    } finally {
      setBackingUp(false)
    }
  }

  const doSignOut = async () => {
    if (!window.confirm('Sign out of HealthKeeper? Your records stay safe — sign back in anytime.')) return
    setSigningOut(true)
    await signOut()
    navigate('/onboarding', { replace: true })
  }

  const initial = (contact ?? 'U')[0].toUpperCase()

  return (
    <div className="screen">
      <StatusBar />
      <div className="screen__body scroll">
        {/* account header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0 20px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: '600 22px var(--font-ui)',
              flex: 'none',
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '600 17px var(--font-ui)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {contact ?? 'Signed in'}
            </div>
            <div style={{ font: '12.5px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
              {persons.length} {persons.length === 1 ? 'patient' : 'patients'} · {records.length}{' '}
              {records.length === 1 ? 'document' : 'documents'}
            </div>
          </div>
        </div>

        {/* patients this account manages */}
        <Eyebrow>Patients</Eyebrow>
        <div className="stack" style={{ gap: 9, marginBottom: 8 }}>
          {persons.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px' }}>
              <button
                onClick={() => setActivePerson(p.id)}
                style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0 }}
              >
                <span className="choice__icon" style={{ width: 38, height: 38, borderRadius: '50%' }}>
                  <UserRound size={18} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', font: '600 14.5px var(--font-ui)', color: 'var(--ink)' }}>
                    {p.fullName}
                    {activePerson?.id === p.id && (
                      <span style={{ font: '600 11px var(--font-ui)', color: 'var(--primary)', marginLeft: 7 }}>VIEWING</span>
                    )}
                  </span>
                  <span style={{ display: 'block', font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
                    {personLine(p)}
                  </span>
                </span>
              </button>
              <button className="iconbtn" aria-label={`Edit ${p.fullName}`} onClick={() => setEditing(p)}>
                <Pencil size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            marginBottom: 20,
            padding: '12px 0',
            borderRadius: 'var(--r-md)',
            border: '1.5px dashed var(--line-strong)',
            background: 'none',
            font: '600 13.5px var(--font-ui)',
            color: 'var(--primary)',
            cursor: 'pointer',
          }}
        >
          <UserRoundPlus size={16} /> Add another patient
        </button>

        {/* shortcuts */}
        <Eyebrow>Record</Eyebrow>
        <div className="stack" style={{ gap: 9, marginBottom: 20 }}>
          <button className="listrow" onClick={() => navigate('/app/summary')}>
            <span className="choice__icon choice__icon--ghost" style={{ width: 38, height: 38 }}>
              <FileText size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="listrow__title" style={{ fontSize: 14 }}>Doctor summary</div>
              <div className="listrow__sub">One page to show at appointments</div>
            </div>
            <ChevronRight size={16} className="chev" />
          </button>
        </div>

        {/* data & about */}
        <Eyebrow>Data &amp; privacy</Eyebrow>
        <div className="stack" style={{ gap: 9, marginBottom: 20 }}>
          <button className="listrow" onClick={() => setShowPrivacy((v) => !v)}>
            <span className="choice__icon choice__icon--ghost" style={{ width: 38, height: 38 }}>
              <ShieldCheck size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="listrow__title" style={{ fontSize: 14 }}>How your data is protected</div>
              <div className="listrow__sub">{showPrivacy ? 'Tap to hide' : 'Tap to read'}</div>
            </div>
            <ChevronRight size={16} className="chev" style={{ transform: showPrivacy ? 'rotate(90deg)' : undefined }} />
          </button>
          {showPrivacy && (
            <div className="card card--pad" style={{ font: '13px/1.65 var(--font-ui)', color: 'var(--ink-2)' }}>
              Everything you add is saved instantly to a private, encrypted cloud database — never
              just on this phone. Signing out, changing your password, or losing your device never
              deletes anything: sign in again from any phone and your full record is there. Your
              records belong to your account alone — no other account can see them. Passwords are
              never stored, only a one-way scramble, and documents are read once by AI to extract
              the data and used for nothing else. You can also download a backup copy below and
              keep it anywhere you like.
            </div>
          )}
          <button className="listrow" onClick={downloadBackup} disabled={backingUp}>
            <span className="choice__icon choice__icon--ghost" style={{ width: 38, height: 38 }}>
              <Download size={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="listrow__title" style={{ fontSize: 14 }}>
                {backingUp ? 'Preparing backup…' : 'Download a backup'}
              </div>
              <div className="listrow__sub">All patients and records as one file you keep</div>
            </div>
            <ChevronRight size={16} className="chev" />
          </button>
        </div>

        {/* sign out */}
        <button
          onClick={doSignOut}
          disabled={signingOut}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            margin: '2px 0 8px',
            padding: '13px 0',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--line)',
            color: 'var(--alert)',
            font: '600 14px var(--font-ui)',
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          <LogOut size={16} /> {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {editing && <EditPatient person={editing} onClose={() => setEditing(null)} />}
      {adding && <AddPatientSheet onClose={() => setAdding(false)} />}
    </div>
  )
}

/** Add-a-patient sheet (name, age, gender) used from the profile. */
function AddPatientSheet({ onClose }: { onClose: () => void }) {
  const { addPerson, setActivePerson, proxyChoice } = useSession()
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!fullName.trim()) return setError('Enter the patient’s name')
    if (!gender) return setError('Select the patient’s gender')
    setSaving(true)
    setError(null)
    try {
      const person = await api.createPerson({
        fullName: fullName.trim(),
        ageYears: age ? Number(age) : undefined,
        relationship: 'dependent',
        proxyChoice: proxyChoice ?? 'caretaker',
        gender,
      })
      addPerson(person)
      setActivePerson(person.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the patient')
      setSaving(false)
    }
  }

  return (
    <div className="addsheet-backdrop" onClick={onClose}>
      <div className="addsheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ font: '600 17px var(--font-ui)', color: 'var(--ink)', flex: 1 }}>Add a patient</div>
          <button className="iconbtn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <label className="field">
            <span className="field__label">Full name</span>
            <span className="field__input">
              <input value={fullName} placeholder="e.g. Meera Sharma" autoFocus onChange={(e) => setFullName(e.target.value)} />
            </span>
          </label>
          <label className="field">
            <span className="field__label">Age (optional)</span>
            <span className="field__input">
              <input inputMode="numeric" value={age} placeholder="e.g. 72" onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))} />
            </span>
          </label>
          <div className="field">
            <span className="field__label">Gender</span>
            <div className="seg" style={{ alignSelf: 'flex-start' }}>
              {(['female', 'male', 'other'] as const).map((g) => (
                <button key={g} type="button" className={`seg__item${gender === g ? ' seg__item--on' : ''}`} onClick={() => setGender(g)}>
                  {g[0].toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {error && <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)' }}>{error}</div>}
          <button className="btn btn--primary" disabled={saving} onClick={save}>
            {saving ? 'Adding…' : 'Add patient'}
          </button>
        </div>
      </div>
    </div>
  )
}
