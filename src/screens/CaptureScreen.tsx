import { Images, Copy, Check, ChevronLeft, X, Pencil, Plus } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Eyebrow, Badge, DocThumb } from '../components/ui'
import { useStore } from '../state/store'

export function CaptureScreen() {
  const { cap } = useStore()
  return (
    <div className="capture">
      {cap === 'camera' && <Camera />}
      {cap === 'extracting' && <Extracting />}
      {cap === 'review' && <Review />}
      {cap === 'duplicate' && <Duplicate />}
      {cap === 'saved' && <Saved />}
    </div>
  )
}

function CaptureHeader({
  title,
  icon = 'close',
  onBack,
}: {
  title: string
  icon?: 'close' | 'chevron'
  onBack: () => void
}) {
  return (
    <div className="topbar" style={{ paddingTop: 14 }}>
      <button className="iconbtn" onClick={onBack} aria-label="Cancel">
        {icon === 'close' ? <X size={19} /> : <ChevronLeft size={20} />}
      </button>
      <div className="topbar__title" style={{ fontSize: 16 }}>
        {title}
      </div>
    </div>
  )
}

function Camera() {
  const { go, shutter, startUpload, showToast } = useStore()
  return (
    <>
      <StatusBar />
      <CaptureHeader title="Capture" onBack={() => go('home')} />
      <div className="viewfinder">
        <div className="corner corner--tl" />
        <div className="corner corner--tr" />
        <div className="corner corner--bl" />
        <div className="corner corner--br" />
        <div className="viewfinder__hint">Point at document</div>
      </div>
      <div className="shutter-row">
        <button className="cam-aux" onClick={startUpload}>
          <span className="cam-aux__btn">
            <Images size={20} />
          </span>
          Gallery
        </button>
        <button className="shutter" onClick={shutter} aria-label="Take photo" />
        <button className="cam-aux" onClick={() => showToast('Add another page')}>
          <span className="cam-aux__btn">
            <Copy size={19} />
          </span>
          Multi-page
        </button>
      </div>
      <div
        style={{
          textAlign: 'center',
          font: '12px var(--font-ui)',
          color: 'var(--ink-3)',
          paddingBottom: 18,
        }}
      >
        Original is always kept
      </div>
    </>
  )
}

function Extracting() {
  const { go } = useStore()
  return (
    <>
      <StatusBar />
      <CaptureHeader title="Reading document…" onBack={() => go('home')} />
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 }}>
          <DocThumb width={60} height={76} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 11, width: '78%', marginBottom: 10 }} />
            <div
              style={{
                height: 8,
                background: 'var(--surface-3)',
                borderRadius: 5,
                overflow: 'hidden',
              }}
            >
              <div style={{ width: '68%', height: '100%', background: 'var(--primary)' }} />
            </div>
            <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 9 }}>
              Extracting fields…
            </div>
          </div>
        </div>
        <Eyebrow>Detected</Eyebrow>
        <div className="stack" style={{ gap: 13 }}>
          <DetectRow label="Doctor" done />
          <DetectRow label="Date" done />
          <DetectRow label="Test type" />
        </div>
        <div
          style={{
            marginTop: 28,
            textAlign: 'center',
            font: '12px var(--font-ui)',
            color: 'var(--ink-3)',
          }}
        >
          You can edit anything in the next step
        </div>
      </div>
    </>
  )
}

function DetectRow({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="extract-row" style={{ padding: 0 }}>
      <span
        className="extract-row__check"
        style={{
          background: done ? 'var(--good-tint)' : 'var(--surface-3)',
          color: done ? 'var(--good)' : 'var(--ink-4)',
        }}
      >
        {done ? <Check size={13} strokeWidth={3} /> : <span style={{ fontSize: 10 }}>···</span>}
      </span>
      <div style={{ font: '14px var(--font-ui)', color: done ? 'var(--ink-2)' : 'var(--ink-4)' }}>
        {label}
      </div>
      <div
        className={done ? '' : 'skeleton'}
        style={{
          flex: 1,
          height: 9,
          borderRadius: 5,
          background: done ? 'var(--surface-3)' : undefined,
        }}
      />
    </div>
  )
}

function Review() {
  const { go, set, showToast } = useStore()
  return (
    <>
      <StatusBar />
      <CaptureHeader title="Review details" icon="chevron" onBack={() => go('home')} />
      <div className="scroll" style={{ flex: 1, padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <DocThumb width={50} height={62} />
          <div>
            <Badge variant="solid">Lab report</Badge>
            <button
              style={{
                display: 'block',
                font: '12px var(--font-ui)',
                color: 'var(--ink-3)',
                marginTop: 7,
              }}
              onClick={() => showToast('Tap any field to edit it')}
            >
              Auto-detected · tap to change
            </button>
          </div>
        </div>

        <div className="stack" style={{ gap: 9 }}>
          <ReviewField label="Patient" value="Lakshmi Iyer" />
          <ReviewField label="Doctor" value="Dr. Rao · Cardiology" />
          <ReviewField label="Hospital · Date" value="Apollo · 18 Jun 2026" />
        </div>

        <Eyebrow>Auto-tags</Eyebrow>
        <div className="chiprow">
          <span className="chip chip--tag">Cardiology</span>
          <span className="chip chip--tag">Apollo</span>
          <span className="chip chip--tag">Lipid profile</span>
          <button className="chip chip--add" onClick={() => showToast('Add a tag')}>
            <Plus size={13} /> add
          </button>
        </div>
      </div>
      <div className="screen-foot" style={{ display: 'flex', gap: 11 }}>
        <button
          className="btn btn--ghost"
          style={{ width: 96, flex: 'none' }}
          onClick={() => showToast('Tap any field to edit it')}
        >
          <Pencil size={16} /> Edit
        </button>
        <button className="btn btn--primary" onClick={() => set({ cap: 'duplicate' })}>
          Save record
        </button>
      </div>
    </>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card--pad" style={{ padding: '11px 13px' }}>
      <div className="field__label">{label}</div>
      <div style={{ font: '15px var(--font-ui)', color: 'var(--ink)', marginTop: 4 }}>{value}</div>
    </div>
  )
}

function Duplicate() {
  const { set } = useStore()
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'oklch(0.2 0.01 250 / 0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'scrimIn 0.18s ease',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          padding: '20px 20px 28px',
          animation: 'sheetUp 0.26s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 3,
            background: 'var(--line-strong)',
            margin: '0 auto 18px',
          }}
        />
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginBottom: 13 }}>
          <span className="callout__icon" style={{ borderRadius: 11 }}>
            <Copy size={17} />
          </span>
          <div style={{ font: '600 17px/1.3 var(--font-ui)', color: 'var(--ink)' }}>
            You already have a recent result for this
          </div>
        </div>
        <div style={{ font: '14px/1.5 var(--font-ui)', color: 'var(--ink-3)', marginBottom: 16 }}>
          A <b style={{ color: 'var(--ink)' }}>Lipid profile</b> was saved 6 days ago. Is this a new
          result, or the same document again?
        </div>
        <div style={{ display: 'flex', gap: 11, marginBottom: 18 }}>
          <DupCard label="Existing" date="12 Jun 2026" />
          <DupCard label="New scan" date="18 Jun 2026" highlight />
        </div>
        <button className="btn btn--primary" style={{ flexDirection: 'column', gap: 2, height: 60 }} onClick={() => set({ cap: 'saved' })}>
          <span>Add as a new result</span>
          <span style={{ font: '12px var(--font-ui)', color: 'oklch(0.92 0.02 192)', fontWeight: 400 }}>
            Keeps both — adds this to the trend
          </span>
        </button>
      </div>
    </div>
  )
}

function DupCard({ label, date, highlight }: { label: string; date: string; highlight?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        border: highlight ? '1.5px solid var(--primary)' : '1px solid var(--line)',
        borderRadius: 'var(--r-md)',
        padding: 12,
        background: highlight ? 'var(--primary-soft)' : 'var(--surface)',
      }}
    >
      <div className="field__label" style={{ color: highlight ? 'var(--primary)' : undefined }}>
        {label}
      </div>
      <div style={{ font: '14px var(--font-ui)', color: 'var(--ink)', marginTop: 6 }}>{date}</div>
      <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)', marginTop: 3 }}>
        Apollo · Dr. Rao
      </div>
    </div>
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
          Record saved &amp; organized
        </div>
        <div className="card card--pad" style={{ width: '100%' }}>
          <div className="chiprow" style={{ justifyContent: 'center', marginBottom: 11 }}>
            <span className="chip chip--tag">Cardiology</span>
            <span className="chip chip--tag">Apollo</span>
            <span className="chip chip--tag">Lab report</span>
          </div>
          <div style={{ font: '13px var(--font-ui)', color: 'var(--ink-3)' }}>
            Added to the timeline · 18 Jun
          </div>
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
