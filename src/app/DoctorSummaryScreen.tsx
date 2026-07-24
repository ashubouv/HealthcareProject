import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Share2, Printer, AlertTriangle } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { Eyebrow, Badge } from '../components/ui'
import { useSession } from '../state/session'
import { useRecords } from './recordsContext'
import { KIND_LABEL, deriveMeds, deriveLabs, recordSubtitle } from './derive'
import { evaluateRange } from './refRanges'
import { PatientNotes } from './PatientNotes'
import { personLine } from './HomeScreen'

export function DoctorSummaryScreen() {
  const navigate = useNavigate()
  const { activePerson, proxyChoice } = useSession()
  const { records } = useRecords()
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  const meds = deriveMeds(records)
  const labs = deriveLabs(records)
  const recent = records.slice(0, 5)
  const today = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })

  // Per-measure concerns: the document's own flag, or an out-of-range latest value.
  const attention = labs
    .map((g) => {
      const re = evaluateRange(g.name, g.latest.num)
      const status = g.latest.flag ?? (re?.status && re.status !== 'in' ? re.statusLabel : null)
      return status
        ? { name: g.name, value: g.latest.value, unit: g.latest.unit, status, date: g.latest.date, recordId: g.latest.recordId }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const share = async () => {
    const lines: string[] = []
    lines.push(`Health summary — ${activePerson?.fullName ?? 'Patient'}${activePerson ? ` (${personLine(activePerson)})` : ''}`)
    lines.push(`Generated ${today}`)
    if (activePerson?.notes?.trim()) {
      lines.push('', 'History & notes:', activePerson.notes.trim())
    }
    if (attention.length) {
      lines.push('', 'Flagged results:')
      attention.forEach((a) => lines.push(`- ${a.name}: ${a.value}${a.unit ? ` ${a.unit}` : ''} (${a.status})${a.date ? ` — ${a.date}` : ''}`))
    }
    if (meds.length) {
      lines.push('', 'Current medications:')
      meds.forEach((m) => lines.push(`- ${m.name}${m.dose ? ` ${m.dose}` : ''}${m.frequency ? ` · ${m.frequency}` : ''}${m.date ? ` (since ${m.date})` : ''}`))
    }
    if (labs.length) {
      lines.push('', 'Latest lab values:')
      labs.forEach((g) => lines.push(`- ${g.name}: ${g.latest.value}${g.latest.unit ? ` ${g.latest.unit}` : ''}${g.latest.date ? ` (${g.latest.date})` : ''}`))
    }
    const text = lines.join('\n')

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Health summary', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareMsg('Summary copied to clipboard')
      setTimeout(() => setShareMsg(null), 2500)
    } catch {
      // user cancelled the native share sheet, or clipboard blocked — no-op
    }
  }

  return (
    <div className="screen">
      <TopBar title="Doctor summary" onBack={() => navigate(-1)} />
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <Badge variant="solid">SUMMARY</Badge>
        <span style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)' }}>{today} · auto-generated</span>
      </div>

      <div className="screen__body scroll">
        {/* Patient */}
        <div className="card card--pad" style={{ marginBottom: 14 }}>
          <Eyebrow>Patient</Eyebrow>
          <div style={{ font: '15px var(--font-ui)', color: 'var(--ink)' }}>
            {activePerson?.fullName ?? 'Unknown'}
          </div>
          <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>
            {activePerson ? `${personLine(activePerson)} · ` : ''}
            {proxyChoice === 'caretaker' ? 'Record managed by a caretaker' : 'Self-managed record'}
            {` · ${records.length} ${records.length === 1 ? 'document' : 'documents'}`}
          </div>
        </div>

        {/* Freeform history — editable right here so notes for the doctor can be
            added just before sharing/printing. */}
        <PatientNotes compact />

        {/* Active concerns */}
        {attention.length > 0 && (
          <>
            <Eyebrow>Flagged results</Eyebrow>
            <div className="stack" style={{ gap: 9, marginBottom: 16 }}>
              {attention.map((a, i) => (
                <button key={i} className="callout" style={{ gap: 11 }} onClick={() => navigate(`/app/record/${a.recordId}`)}>
                  <span className="callout__icon">
                    <AlertTriangle size={17} />
                  </span>
                  <span className="callout__text" style={{ flex: 1 }}>
                    <b>{a.name}</b> {a.value}
                    {a.unit ? ` ${a.unit}` : ''} · {a.status}
                    {a.date && (
                      <span style={{ display: 'block', color: 'var(--ink-4)', marginTop: 2 }}>{a.date}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Medications */}
        <Eyebrow>Current medications</Eyebrow>
        <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
          {meds.length === 0 ? (
            <div className="kv">
              <span style={{ color: 'var(--ink-4)' }}>None recorded</span>
            </div>
          ) : (
            meds.map((m, i) => (
              <div className="kv" key={i}>
                <span>
                  {m.name}
                  {m.dose ? ` ${m.dose}` : ''}
                  {m.date && (
                    <span style={{ display: 'block', font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 2 }}>
                      Since {m.date}
                    </span>
                  )}
                </span>
                <span className="kv__v">{m.frequency ?? ''}</span>
              </div>
            ))
          )}
        </div>

        {/* Lab measures */}
        {labs.length > 0 && (
          <>
            <Eyebrow>Latest lab values</Eyebrow>
            <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
              {labs.map((g) => {
                const re = evaluateRange(g.name, g.latest.num)
                const alert = !!g.latest.flag || (re?.status != null && re.status !== 'in')
                return (
                  <div className="kv" key={g.name}>
                    <span>
                      {g.name}
                      {g.latest.date && (
                        <span style={{ display: 'block', font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 2 }}>
                          {g.latest.date}
                        </span>
                      )}
                    </span>
                    <span className="kv__v" style={{ color: alert ? 'var(--alert)' : 'var(--ink)' }}>
                      {g.latest.value}
                      {g.latest.unit ? ` ${g.latest.unit}` : ''}
                      {re?.shortLabel && re.shortLabel !== 'Normal' && (
                        <span style={{ display: 'block', font: '11px var(--font-ui)', color: 'var(--alert)', marginTop: 1 }}>
                          {re.shortLabel}
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Recent records */}
        {recent.length > 0 && (
          <>
            <Eyebrow>Recent documents</Eyebrow>
            <div className="stack" style={{ gap: 9, marginBottom: 16 }}>
              {recent.map((r) => (
                <button key={r.id} className="listrow" onClick={() => navigate(`/app/record/${r.id}`)}>
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

        <div style={{ font: '11px/1.5 var(--font-ui)', color: 'var(--ink-4)', marginBottom: 8 }}>
          Auto-generated from saved documents. Reference ranges are general adult guidance, not a
          diagnosis.
        </div>
      </div>

      <div className="screen-foot">
        {shareMsg && (
          <div style={{ font: '12px var(--font-ui)', color: 'var(--good)', marginBottom: 8, textAlign: 'center' }}>
            {shareMsg}
          </div>
        )}
        <div style={{ display: 'flex', gap: 11 }}>
          <button className="btn btn--ghost" onClick={share} style={{ flex: 1 }}>
            <Share2 size={17} /> Share
          </button>
          <button className="btn btn--primary" onClick={() => window.print()} style={{ flex: 1 }}>
            <Printer size={17} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}
