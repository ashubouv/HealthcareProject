import { ChevronRight, Share2 } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Eyebrow, Badge, toneColor } from '../components/ui'
import { useStore } from '../state/store'
import { DOCTORS, type DoctorReport } from '../data/summary'

export function SummaryScreen() {
  const { docFilter, set, go, showToast } = useStore()
  const doctor = DOCTORS.find((d) => d.id === docFilter) ?? DOCTORS[0]

  return (
    <div className="screen">
      <TopBar title="Doctor summary" onBack={() => go('labs')} />
      <div style={{ padding: '0 20px 10px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <Badge variant="solid">CURRENT</Badge>
        <span style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)' }}>
          updated 18 Jun · auto-generated
        </span>
      </div>

      <div style={{ paddingBottom: 12 }}>
        <div style={{ padding: '0 20px 8px' }}>
          <Eyebrow>Care team · filter by doctor</Eyebrow>
        </div>
        <div className="chiprow chiprow--scroll" style={{ padding: '0 20px' }}>
          {DOCTORS.map((d) => (
            <button
              key={d.id}
              className={`chip${docFilter === d.id ? ' chip--on' : ''}`}
              onClick={() => set({ docFilter: d.id })}
            >
              {d.chipLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="screen__body scroll">
        <div className="card card--pad" style={{ marginBottom: 12 }}>
          <Eyebrow>Patient</Eyebrow>
          <div style={{ font: '15px var(--font-ui)', color: 'var(--ink)' }}>Lakshmi Iyer · F · 68</div>
          <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>
            Allergies: Penicillin
          </div>
        </div>

        <DoctorBlock doctor={doctor} />
      </div>

      <div className="screen-foot">
        <button className="btn btn--primary" onClick={() => showToast('Generating PDF…')}>
          <Share2 size={17} /> Share / print
        </button>
      </div>
    </div>
  )
}

function DoctorBlock({ doctor }: { doctor: DoctorReport }) {
  const { openRecord } = useStore()
  return (
    <>
      <div className="doctor-head">
        <div className="doctor-head__avatar">{doctor.initials}</div>
        <div>
          <div style={{ font: '600 15px var(--font-ui)', color: 'var(--ink)' }}>{doctor.name}</div>
          <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
            {doctor.role}
          </div>
        </div>
      </div>

      <div className="card card--pad" style={{ marginBottom: 10 }}>
        <Eyebrow>{doctor.visitLabel}</Eyebrow>
        <div style={{ font: '13.5px/1.6 var(--font-ui)', color: 'var(--ink-2)' }}>{doctor.note}</div>
      </div>

      <div className="card card--pad" style={{ marginBottom: 10 }}>
        <Eyebrow>Diagnosis</Eyebrow>
        <div className="chiprow">
          {doctor.diagnosis.map((d) => (
            <span key={d} className="chip chip--tag">
              {d}
            </span>
          ))}
        </div>
      </div>

      {doctor.meds.length > 0 && (
        <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 10 }}>
          <Eyebrow>Medications prescribed</Eyebrow>
          {doctor.meds.map((m) => (
            <div className="kv" key={m.k}>
              <span>{m.k}</span>
              <span className="kv__v">{m.v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 10 }}>
        <Eyebrow>{doctor.labsTitle}</Eyebrow>
        {doctor.labs.map((l) => (
          <div className="kv" key={l.k}>
            <span>{l.k}</span>
            <span className="kv__v" style={{ color: toneColor(l.tone) }}>
              {l.v}
            </span>
          </div>
        ))}
      </div>

      {doctor.attachment && (
        <button className="attach" style={{ marginBottom: 10 }} onClick={() => openRecord(doctor.attachment!.rec)}>
          <span className="doc" style={{ width: 30, height: 38, borderRadius: 6 }} />
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', font: '13.5px var(--font-ui)', color: 'var(--ink)' }}>
              {doctor.attachment.title}
            </span>
            <span style={{ display: 'block', font: '11.5px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
              {doctor.attachment.meta}
            </span>
          </span>
          <ChevronRight size={17} className="chev" />
        </button>
      )}

      <div className="followup">
        <span>
          <b>Follow-up:</b> {doctor.followUp}
        </span>
      </div>
    </>
  )
}
