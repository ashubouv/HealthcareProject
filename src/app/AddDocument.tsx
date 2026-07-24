import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Camera, FileText, Sparkles, Check, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { TopBar } from '../components/TopBar'
import { Eyebrow, Badge } from '../components/ui'
import { useSession } from '../state/session'
import { useRecords } from './recordsContext'
import { api, type Extracted } from '../api/client'
import { prepareUpload } from './prepareUpload'
import { viewDocument } from './viewDocument'

type Phase = 'choose' | 'extracting' | 'review' | 'saving' | 'batch' | 'batchDone'

const BATCH_LIMIT = 10

interface BatchItem {
  name: string
  ok: boolean
  title?: string // saved record title on success
  error?: string
}

const TYPE_LABEL: Record<Extracted['documentType'], string> = {
  lab_report: 'Lab report',
  prescription: 'Prescription',
  discharge_summary: 'Discharge summary',
  scan: 'Scan',
  other: 'Document',
}

export function AddDocument() {
  const navigate = useNavigate()
  const { activePerson } = useSession()
  const { refresh } = useRecords()
  const [phase, setPhase] = useState<Phase>('choose')
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batch, setBatch] = useState<{ current: number; total: number; name: string } | null>(null)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])

  /** Upload + AI-read one file, with a single automatic retry for network hiccups. */
  const extractWithRetry = async (picked: File) => {
    const file = await prepareUpload(picked) // downscale big camera photos so extraction is reliable
    try {
      return { file, result: await api.extractDocument(file) }
    } catch {
      await new Promise((r) => setTimeout(r, 800))
      return { file, result: await api.extractDocument(file) }
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    // Allow re-selecting the same file/photo again later.
    e.target.value = ''
    if (files.length === 0) return
    if (files.length > 1) {
      void runBatch(files.slice(0, BATCH_LIMIT))
      return
    }
    const picked = files[0]
    if (picked.size === 0) {
      setError('That file came through empty — please pick or photograph it again.')
      return
    }
    setPhase('extracting')
    setError(null)
    try {
      const { file, result } = await extractWithRetry(picked)
      setExtracted(result.extracted)
      setFilename(result.sourceFilename)
      setDocumentId(result.documentId)
      setLocalUrl(URL.createObjectURL(file)) // view the file we just picked
      setPhase('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
      setPhase('choose')
    }
  }

  /** Several files at once: read and save each in turn, then show a summary. */
  const runBatch = async (files: File[]) => {
    setPhase('batch')
    setError(null)
    setBatchItems([])
    const results: BatchItem[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      setBatch({ current: i + 1, total: files.length, name: f.name })
      try {
        if (f.size === 0) throw new Error('The file was empty')
        const { result } = await extractWithRetry(f)
        await api.saveRecord({
          personId: activePerson?.id ?? null,
          kind: result.extracted.documentType,
          title: result.extracted.title,
          doctor: result.extracted.doctorName,
          hospital: result.extracted.hospital,
          date: result.extracted.date,
          sourceFilename: result.sourceFilename,
          documentId: result.documentId,
          extracted: result.extracted,
          explanation: result.extracted.plainLanguageSummary,
        })
        results.push({ name: f.name, ok: true, title: result.extracted.title })
      } catch (err) {
        results.push({ name: f.name, ok: false, error: err instanceof Error ? err.message : 'Failed' })
      }
      setBatchItems([...results])
    }
    await refresh()
    setBatch(null)
    setPhase('batchDone')
  }

  const save = async () => {
    if (!extracted) return
    setPhase('saving')
    try {
      const saved = await api.saveRecord({
        personId: activePerson?.id ?? null,
        kind: extracted.documentType,
        title: extracted.title,
        doctor: extracted.doctorName,
        hospital: extracted.hospital,
        date: extracted.date,
        sourceFilename: filename,
        documentId,
        extracted,
        explanation: extracted.plainLanguageSummary,
      })
      await refresh()
      // Land on the saved record itself — an old document date would sort it far
      // down the timeline and make the add look like it silently failed.
      navigate(`/app/record/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      setPhase('review')
    }
  }

  return (
    <div className="screen">
      <StatusBar />
      <TopBar title="Add a document" onBack={() => navigate('/app')} />

      {phase === 'choose' && (
        <div className="screen__body" style={{ paddingTop: 6 }}>
          <div style={{ font: '13px/1.5 var(--font-ui)', color: 'var(--ink-3)', marginBottom: 16 }}>
            Upload a photo or PDF of a lab report, prescription, or discharge summary. The AI reads
            it and fills in the details for you.
          </div>

          <label className="choice" style={{ marginBottom: 11 }}>
            <span className="choice__icon">
              <Upload size={21} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="choice__title" style={{ display: 'block' }}>
                Upload a file
              </span>
              <span className="choice__sub" style={{ display: 'block' }}>
                PDFs or photos from this device
              </span>
            </span>
            {/* multiple: selecting several documents just works — no separate mode */}
            <input type="file" accept=".pdf,image/*" multiple onChange={onFile} style={{ display: 'none' }} />
          </label>

          <label className="choice">
            <span className="choice__icon">
              <Camera size={21} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="choice__title" style={{ display: 'block' }}>
                Take a photo
              </span>
              <span className="choice__sub" style={{ display: 'block' }}>
                Photograph a paper document
              </span>
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFile}
              style={{ display: 'none' }}
            />
          </label>

          {error && (
            <div className="callout" style={{ marginTop: 16, background: 'var(--alert-tint)', borderColor: 'oklch(0.85 0.06 35)' }}>
              <span className="callout__text" style={{ color: 'var(--alert)' }}>{error}</span>
            </div>
          )}
        </div>
      )}

      {phase === 'extracting' && (
        <div className="center-col" style={{ flex: 1, gap: 16, padding: '0 24px', textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--primary-tint)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulseDot 1.2s ease-in-out infinite',
            }}
          >
            <Sparkles size={28} />
          </div>
          <div style={{ font: '500 18px var(--font-display)', color: 'var(--ink)' }}>
            Reading your document…
          </div>
          <div style={{ font: '13px var(--font-ui)', color: 'var(--ink-3)' }}>
            The AI is extracting the doctor, date, and results.
          </div>
        </div>
      )}

      {phase === 'batch' && (
        <div className="screen__body scroll" style={{ paddingTop: 10 }}>
          <div className="center-col" style={{ gap: 14, padding: '18px 0 22px', textAlign: 'center' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'var(--primary-tint)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulseDot 1.2s ease-in-out infinite',
              }}
            >
              <Sparkles size={26} />
            </div>
            <div style={{ font: '500 17px var(--font-display)', color: 'var(--ink)' }}>
              Reading document {batch?.current} of {batch?.total}…
            </div>
            <div style={{ font: '12.5px var(--font-ui)', color: 'var(--ink-3)', wordBreak: 'break-word', padding: '0 20px' }}>
              {batch?.name}
            </div>
          </div>
          {batchItems.length > 0 && <BatchList items={batchItems} />}
        </div>
      )}

      {phase === 'batchDone' && (
        <>
          <div className="screen__body scroll" style={{ paddingTop: 10 }}>
            <div style={{ font: '500 20px var(--font-display)', color: 'var(--ink)', margin: '6px 0 4px' }}>
              {batchItems.filter((b) => b.ok).length} of {batchItems.length} documents added
            </div>
            <div style={{ font: '13px var(--font-ui)', color: 'var(--ink-3)', marginBottom: 16 }}>
              {batchItems.some((b) => !b.ok)
                ? 'The ones that failed can be tried again one at a time.'
                : 'Everything was read and saved to the record.'}
            </div>
            <BatchList items={batchItems} />
          </div>
          <div className="screen-foot">
            <button className="btn btn--primary" onClick={() => navigate('/app/timeline', { replace: true })}>
              <Check size={18} /> Done
            </button>
          </div>
        </>
      )}

      {(phase === 'review' || phase === 'saving') && extracted && (
        <>
          <div className="screen__body scroll">
            <div style={{ marginBottom: 14 }}>
              <Badge variant="solid">{TYPE_LABEL[extracted.documentType]}</Badge>
            </div>

            {(documentId || localUrl) && (
              <button
                className="attach"
                onClick={() => {
                  // Native viewer via ticket URL (shows every PDF page); fall
                  // back to the local copy if the file wasn't stored.
                  if (documentId) void viewDocument(documentId).catch(() => localUrl && window.open(localUrl, '_blank'))
                  else if (localUrl) window.open(localUrl, '_blank')
                }}
                style={{ marginBottom: 16 }}
              >
                <span className="choice__icon">
                  <FileText size={18} />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', font: '14px var(--font-ui)', color: 'var(--ink)' }}>
                    View original document
                  </span>
                  <span style={{ display: 'block', font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 2 }}>
                    {filename ?? 'Opens in a new tab'}
                  </span>
                </span>
                <ExternalLink size={17} className="chev" />
              </button>
            )}

            <div style={{ font: '500 20px var(--font-display)', color: 'var(--ink)', marginBottom: 14 }}>
              {extracted.title}
            </div>

            <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
              <Field k="Patient" v={extracted.patientName} />
              <Field k="Doctor" v={extracted.doctorName} />
              <Field k="Hospital" v={extracted.hospital} />
              <Field k="Date" v={extracted.date} />
            </div>

            {extracted.values.length > 0 && (
              <>
                <Eyebrow>Results</Eyebrow>
                <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
                  {extracted.values.map((row, i) => (
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

            {extracted.medications.length > 0 && (
              <>
                <Eyebrow>Medications</Eyebrow>
                <div className="card card--pad" style={{ padding: '4px 14px', marginBottom: 16 }}>
                  {extracted.medications.map((m, i) => (
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

            <Eyebrow>What this means</Eyebrow>
            <div className="card card--pad" style={{ font: '14px/1.6 var(--font-ui)', color: 'var(--ink-2)', marginBottom: 16 }}>
              {extracted.plainLanguageSummary}
            </div>

            {extracted.tags.length > 0 && (
              <div className="chiprow">
                {extracted.tags.map((t) => (
                  <span key={t} className="chip chip--tag">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="screen-foot">
            {error && (
              <div style={{ font: '12px var(--font-ui)', color: 'var(--alert)', marginBottom: 10 }}>
                {error}
              </div>
            )}
            <button className="btn btn--primary" disabled={phase === 'saving'} onClick={save}>
              <Check size={18} /> {phase === 'saving' ? 'Saving…' : 'Save to record'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function BatchList({ items }: { items: BatchItem[] }) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      {items.map((b, i) => (
        <div
          key={i}
          className="card"
          style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px' }}
        >
          {b.ok ? (
            <CheckCircle2 size={18} style={{ color: 'var(--good)', flex: 'none', marginTop: 1 }} />
          ) : (
            <XCircle size={18} style={{ color: 'var(--alert)', flex: 'none', marginTop: 1 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '14px var(--font-ui)', color: 'var(--ink)', wordBreak: 'break-word' }}>
              {b.ok ? b.title ?? b.name : b.name}
            </div>
            <div style={{ font: '12px var(--font-ui)', color: b.ok ? 'var(--ink-4)' : 'var(--alert)', marginTop: 2, wordBreak: 'break-word' }}>
              {b.ok ? `Saved · ${b.name}` : b.error}
            </div>
          </div>
        </div>
      ))}
    </div>
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
