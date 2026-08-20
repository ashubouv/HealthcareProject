import { Pill, FlaskConical, Stethoscope, ChevronRight, Check, AlertTriangle } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { Eyebrow } from '../components/ui'
import { useStore } from '../state/store'

export function ManualScreen() {
  const { man } = useStore()
  return (
    <div className="screen">
      {man === 'choose' && <Choose />}
      {man === 'med' && <MedForm />}
      {man === 'lab' && <LabForm />}
      {man === 'visit' && <VisitForm />}
      {man === 'saved' && <Saved />}
    </div>
  )
}

function Choose() {
  const { go, set } = useStore()
  return (
    <>
      <StatusBar />
      <TopBar title="Add manually" onBack={() => go('home')} />
      <div className="screen__body" style={{ paddingTop: 6 }}>
        <div style={{ font: '13px/1.4 var(--font-ui)', color: 'var(--ink-3)', marginBottom: 14 }}>
          No document to scan? Add an entry by hand.
        </div>
        <div className="stack" style={{ gap: 11 }}>
          <PickCard
            icon={<Pill size={21} />}
            title="Medication"
            sub="Name, dose, schedule"
            onClick={() => set({ man: 'med' })}
          />
          <PickCard
            icon={<FlaskConical size={21} />}
            title="Lab / test result"
            sub="A value like BP, sugar, cholesterol"
            onClick={() => set({ man: 'lab' })}
          />
          <PickCard
            icon={<Stethoscope size={21} />}
            title="Visit or hospitalization"
            sub="Doctor, hospital, dates"
            onClick={() => set({ man: 'visit' })}
          />
        </div>
      </div>
    </>
  )
}

function PickCard({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  onClick: () => void
}) {
  return (
    <button className="choice" onClick={onClick}>
      <span className="choice__icon">{icon}</span>
      <span style={{ flex: 1 }}>
        <span className="choice__title" style={{ display: 'block' }}>
          {title}
        </span>
        <span className="choice__sub" style={{ display: 'block' }}>
          {sub}
        </span>
      </span>
      <ChevronRight size={18} className="chev" />
    </button>
  )
}

function FormShell({
  title,
  children,
  cta,
}: {
  title: string
  children: React.ReactNode
  cta: string
}) {
  const { set, saveManual } = useFormActions()
  return (
    <>
      <StatusBar />
      <TopBar title={title} onBack={() => set({ man: 'choose' })} />
      <div className="scroll" style={{ flex: 1, padding: '6px 20px' }}>
        {children}
      </div>
      <div className="screen-foot">
        <button className="btn btn--primary" onClick={saveManual}>
          {cta}
        </button>
      </div>
    </>
  )
}

function useFormActions() {
  const { set } = useStore()
  return { set, saveManual: () => set({ man: 'saved' }) }
}

function DisplayField({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <div className="field__label">{label}</div>
      <div className="field__input">{value}</div>
    </div>
  )
}

function MedForm() {
  const { medFreq, set } = useStore()
  return (
    <FormShell title="New medication" cta="Add medication">
      <div className="stack" style={{ gap: 14 }}>
        <DisplayField label="Medicine name" value="Amlodipine" />
        <div className="row">
          <DisplayField label="Dose" value="5 mg" />
          <DisplayField label="Form" value="Tablet" />
        </div>
        <div className="field">
          <div className="field__label">How often</div>
          <div className="chiprow">
            <button
              className={`chip${medFreq === 'once' ? ' chip--on' : ''}`}
              onClick={() => set({ medFreq: 'once' })}
            >
              Once a day
            </button>
            <button
              className={`chip${medFreq === 'twice' ? ' chip--on' : ''}`}
              onClick={() => set({ medFreq: 'twice' })}
            >
              Twice
            </button>
            <button
              className={`chip${medFreq === 'prn' ? ' chip--on' : ''}`}
              onClick={() => set({ medFreq: 'prn' })}
            >
              As needed
            </button>
          </div>
        </div>
      </div>
      <div className="callout callout--info" style={{ marginTop: 16 }}>
        <span className="callout__icon">
          <AlertTriangle size={16} />
        </span>
        <span className="callout__text">We’ll check this against current meds for interactions.</span>
      </div>
    </FormShell>
  )
}

function LabForm() {
  return (
    <FormShell title="New result" cta="Add result">
      <div className="stack" style={{ gap: 14 }}>
        <DisplayField label="What was measured" value="Total cholesterol" />
        <div className="row">
          <DisplayField label="Value" value="210" />
          <DisplayField label="Unit" value="mg/dL" />
        </div>
        <DisplayField label="Date taken" value="18 Jun 2026" />
      </div>
      <div className="callout callout--info" style={{ marginTop: 16 }}>
        <span className="callout__icon">
          <FlaskConical size={16} />
        </span>
        <span className="callout__text">Adds to the cholesterol trend chart automatically.</span>
      </div>
    </FormShell>
  )
}

function VisitForm() {
  const { visitType, set } = useStore()
  return (
    <FormShell title="New visit" cta="Add visit">
      <div className="seg" style={{ marginBottom: 16 }}>
        <button
          className={`seg__item${visitType === 'outpatient' ? ' seg__item--on' : ''}`}
          onClick={() => set({ visitType: 'outpatient' })}
        >
          Outpatient
        </button>
        <button
          className={`seg__item${visitType === 'inpatient' ? ' seg__item--on' : ''}`}
          onClick={() => set({ visitType: 'inpatient' })}
        >
          Inpatient
        </button>
      </div>
      <div className="stack" style={{ gap: 14 }}>
        <DisplayField label="Reason / type" value="Cardiology follow-up" />
        <div className="row">
          <DisplayField label="Hospital" value="Apollo" />
          <DisplayField label="Date" value="18 Jun" />
        </div>
        <div className="field">
          <div className="field__label">Notes (optional)</div>
          <div className="field__input field__input--multi">Add a short note…</div>
        </div>
      </div>
    </FormShell>
  )
}

function Saved() {
  const { go } = useStore()
  return (
    <>
      <div
        className="center-col"
        style={{ flex: 1, gap: 18, padding: '0 24px', textAlign: 'center' }}
      >
        <div className="success-check">
          <Check size={38} strokeWidth={2.4} />
        </div>
        <div style={{ font: '500 22px var(--font-display)', color: 'var(--ink)' }}>
          Added to the record
        </div>
        <Eyebrow>&nbsp;</Eyebrow>
        <div style={{ font: '14px/1.5 var(--font-ui)', color: 'var(--ink-3)', marginTop: -18 }}>
          It’s now on the timeline and feeds trends &amp; the doctor summary.
        </div>
      </div>
      <div style={{ padding: '0 24px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn--primary" onClick={() => go('timeline')}>
          View in timeline
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => go('home')}>
          Done
        </button>
      </div>
    </>
  )
}
