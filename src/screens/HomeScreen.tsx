import { ChevronRight, AlertTriangle, ArrowUp, ArrowRight } from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Eyebrow, Badge, DocThumb } from '../components/ui'
import { useStore } from '../state/store'

const CONDITIONS: { name: string; status: string; tone: 'warn' | 'good' | 'alert' }[] = [
  { name: 'Hypertension', status: 'Above target', tone: 'alert' },
  { name: 'Type 2 diabetes', status: 'Improving', tone: 'good' },
  { name: 'High cholesterol', status: 'Rising', tone: 'warn' },
]

export function HomeScreen() {
  const { openRecord, go, showToast } = useStore()
  return (
    <div className="screen">
      <StatusBar />
      <div className="screen__body scroll">
        {/* greeting */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0 0' }}>
          <div style={{ flex: 1 }}>
            <div className="greeting__small">Good morning</div>
            <div className="greeting__name">Welcome back, Lakshmi</div>
          </div>
          <button
            className="avatar"
            style={{ width: 42, height: 42 }}
            onClick={() => showToast('Switch profile')}
          >
            LI
          </button>
        </div>
        <div className="greeting__line">Everything’s up to date. Nicely done.</div>

        {/* health overview */}
        <Eyebrow>Health overview</Eyebrow>
        <div className="card card--pad" style={{ marginBottom: 16 }}>
          <Eyebrow>Active conditions</Eyebrow>
          <div>
            {CONDITIONS.map((c) => (
              <div className="cond-row" key={c.name}>
                <div className="cond-row__name">{c.name}</div>
                <Badge tone={c.tone}>{c.status}</Badge>
              </div>
            ))}
          </div>
          <div className="overview-foot">
            <div>
              <div className="overview-foot__k">Care team</div>
              <div className="overview-foot__v">3 doctors</div>
            </div>
            <div>
              <div className="overview-foot__k">Active meds</div>
              <div className="overview-foot__v">3</div>
            </div>
            <div>
              <div className="overview-foot__k">Next visit</div>
              <div className="overview-foot__v">Dr. Rao · 24 Jun</div>
            </div>
          </div>
        </div>

        {/* attention */}
        <Eyebrow>Needs your attention</Eyebrow>
        <div className="stack" style={{ gap: 9, marginBottom: 18 }}>
          <button className="callout" onClick={() => openRecord('lipid')}>
            <span className="callout__icon">
              <AlertTriangle size={17} />
            </span>
            <span className="callout__text">
              Possible <b>duplicate test</b> · Lipid profile
            </span>
          </button>
          <button className="callout" onClick={() => go('meds')}>
            <span className="callout__icon">
              <AlertTriangle size={17} />
            </span>
            <span className="callout__text">
              Drug <b>interaction</b> flagged · review meds
            </span>
          </button>
        </div>

        {/* key readings */}
        <Eyebrow>Key readings</Eyebrow>
        <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
          <div className="reading-card">
            <div className="reading-card__k">Blood pressure</div>
            <div className="reading-card__v">148/92</div>
            <div className="reading-card__d" style={{ color: 'var(--alert)' }}>
              <ArrowUp size={12} /> high
            </div>
          </div>
          <div className="reading-card">
            <div className="reading-card__k">Sugar A1c</div>
            <div className="reading-card__v">7.1%</div>
            <div className="reading-card__d" style={{ color: 'var(--ink-3)' }}>
              <ArrowRight size={12} /> stable
            </div>
          </div>
          <button className="reading-card" onClick={() => go('labs')}>
            <div className="reading-card__k">Cholesterol</div>
            <div className="reading-card__v">210</div>
            <div className="reading-card__d" style={{ color: 'var(--alert)' }}>
              <ArrowUp size={12} /> vs 188
            </div>
          </button>
        </div>

        {/* recent results */}
        <Eyebrow>Recent results to follow up</Eyebrow>
        <div className="stack" style={{ gap: 9 }}>
          <button className="listrow" onClick={() => openRecord('lipid')}>
            <DocThumb width={32} height={40} />
            <div style={{ flex: 1 }}>
              <div className="listrow__title">Lipid profile added</div>
              <div className="listrow__sub">Apollo · Dr. Rao · 18 Jun</div>
            </div>
            <ChevronRight size={18} className="chev" />
          </button>
          <button className="listrow" onClick={() => openRecord('rx')}>
            <DocThumb width={32} height={40} />
            <div style={{ flex: 1 }}>
              <div className="listrow__title">Prescription added</div>
              <div className="listrow__sub">Apollo · Dr. Rao · 12 Jun</div>
            </div>
            <ChevronRight size={18} className="chev" />
          </button>
        </div>
      </div>
    </div>
  )
}
