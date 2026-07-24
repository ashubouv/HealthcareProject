import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Droplets,
  Activity,
  TestTubes,
  TestTube,
  Beaker,
  Bone,
  ShieldAlert,
  Microscope,
  type LucideIcon,
} from 'lucide-react'
import { StatusBar } from '../components/StatusBar'
import { Eyebrow, Badge, TrendIcon } from '../components/ui'
import { useRecords } from './recordsContext'
import { EmptyState } from './EmptyState'
import { deriveLabs, labChartBars, prettyName, type LabGroup, type ChartBar } from './derive'
import { evaluateRange } from './refRanges'
import { describeMeasure } from './measureInfo'
import { groupBySpecialty, type SpecialtyGroup } from './labCategories'
import type { Trend } from '../data/types'

type View =
  | { level: 'categories' }
  | { level: 'category'; cat: string }
  | { level: 'measure'; name: string; cat: string }

export function LabsScreen() {
  const navigate = useNavigate()
  const { records, loading } = useRecords()
  const groups = deriveLabs(records)
  const specs = groupBySpecialty(groups)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ level: 'categories' })

  const top = () => bodyRef.current?.scrollTo({ top: 0 })
  const goCategories = () => {
    setView({ level: 'categories' })
    top()
  }
  const openCategory = (cat: string) => {
    setView({ level: 'category', cat })
    top()
  }
  const openMeasure = (name: string, cat: string) => {
    setView({ level: 'measure', name, cat })
    top()
  }

  const currentSpec = view.level !== 'categories' ? specs.find((s) => s.key === view.cat) : undefined
  const currentMeasure = view.level === 'measure' ? groups.find((g) => g.name === view.name) : undefined

  // Which level actually renders (fall back if a target vanished after a data change).
  const showMeasure = view.level === 'measure' && currentMeasure
  const showCategory = view.level === 'category' && currentSpec
  const heading = showMeasure ? prettyName(currentMeasure!.name) : showCategory ? currentSpec!.label : null

  return (
    <div className="screen">
      <StatusBar />

      {heading ? (
        <div style={{ padding: '6px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="iconbtn"
            aria-label="Back"
            onClick={() => (showMeasure && currentSpec ? openCategory(currentSpec.key) : goCategories())}
          >
            <ChevronLeft size={20} />
          </button>
          <div
            style={{
              font: '600 18px var(--font-ui)',
              color: 'var(--ink)',
              flex: 1,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {heading}
          </div>
        </div>
      ) : (
        <div style={{ padding: '6px 20px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ font: '600 20px var(--font-ui)', color: 'var(--ink)', flex: 1, letterSpacing: '-0.01em' }}>
            Lab results &amp; trends
          </div>
          {groups.length > 0 && (
            <button
              className="btn btn--ghost"
              style={{ width: 'auto', height: 36, padding: '0 14px', fontSize: 13 }}
              onClick={() => navigate('/app/summary')}
            >
              Doctor summary
            </button>
          )}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="screen__body scroll">
          <EmptyState
            icon={<FlaskConical size={26} />}
            title="No lab results yet"
            body="Add a lab report and the measured values (cholesterol, BP, sugar, and more) are tracked here over time."
          />
        </div>
      )}

      {groups.length > 0 && (
        <div className="screen__body scroll" ref={bodyRef}>
          {showMeasure ? (
            <MeasureDetail
              key={currentMeasure!.name}
              group={currentMeasure!}
              summary={records.find((r) => r.id === currentMeasure!.latest.recordId)?.explanation ?? null}
              onOpenRecord={(id) => navigate(`/app/record/${id}`)}
            />
          ) : showCategory ? (
            <CategoryMeasures items={currentSpec!.items} onOpenMeasure={(n) => openMeasure(n, currentSpec!.key)} />
          ) : (
            <AreaCards specs={specs} onOpen={openCategory} />
          )}
        </div>
      )}
    </div>
  )
}

function isMeasureAlert(g: LabGroup): boolean {
  const re = evaluateRange(g.name, g.latest.num)
  return !!g.latest.flag || (re?.status != null && re.status !== 'in')
}

const SPEC_ICON: Record<string, LucideIcon> = {
  cardiology: HeartPulse,
  endocrine: Activity,
  nephrology: Droplets,
  gastro: FlaskConical,
  hematology: TestTubes,
  bonevit: Bone,
  immunology: ShieldAlert,
  urology: Beaker,
  oncology: Microscope,
  other: TestTube,
}

// Distinct icon colour + soft tint per specialty, for a calm, scannable hub.
const SPEC_COLOR: Record<string, { c: string; bg: string }> = {
  cardiology: { c: 'oklch(0.6 0.19 20)', bg: 'oklch(0.95 0.035 20)' },
  endocrine: { c: 'oklch(0.56 0.19 300)', bg: 'oklch(0.95 0.04 300)' },
  nephrology: { c: 'oklch(0.58 0.15 250)', bg: 'oklch(0.95 0.04 250)' },
  gastro: { c: 'oklch(0.56 0.13 150)', bg: 'oklch(0.95 0.04 150)' },
  hematology: { c: 'oklch(0.58 0.2 15)', bg: 'oklch(0.95 0.04 15)' },
  bonevit: { c: 'oklch(0.6 0.15 130)', bg: 'oklch(0.95 0.05 130)' },
  immunology: { c: 'oklch(0.62 0.16 50)', bg: 'oklch(0.95 0.05 55)' },
  urology: { c: 'oklch(0.58 0.11 200)', bg: 'oklch(0.95 0.035 200)' },
  oncology: { c: 'oklch(0.55 0.16 310)', bg: 'oklch(0.95 0.04 310)' },
  other: { c: 'oklch(0.52 0.02 260)', bg: 'oklch(0.94 0.006 260)' },
}

/** Main Labs page: one Apple Health-style card per area (kind of doctor), flagged first. */
function AreaCards({ specs, onOpen }: { specs: SpecialtyGroup[]; onOpen: (key: string) => void }) {
  const ordered = [...specs].sort(
    (a, b) => Number(!a.items.some(isMeasureAlert)) - Number(!b.items.some(isMeasureAlert)),
  )
  return (
    <div className="stack" style={{ gap: 12, paddingTop: 2, paddingBottom: 8 }}>
      {ordered.map((spec) => (
        <AreaCard key={spec.key} spec={spec} onClick={() => onOpen(spec.key)} />
      ))}
    </div>
  )
}

function AreaCard({ spec, onClick }: { spec: SpecialtyGroup; onClick: () => void }) {
  const Icon = SPEC_ICON[spec.key] ?? TestTube
  const col = SPEC_COLOR[spec.key] ?? SPEC_COLOR.other
  const flaggedCount = spec.items.filter(isMeasureAlert).length
  // Show flagged tests first in the card preview.
  const ordered = [...spec.items].sort((a, b) => Number(!isMeasureAlert(a)) - Number(!isMeasureAlert(b)))
  const shown = ordered.slice(0, 3)
  return (
    <button
      className="card"
      onClick={onClick}
      style={{ textAlign: 'left', display: 'block', width: '100%', padding: 16, cursor: 'pointer' }}
    >
      {/* header: colored icon + title, subtle label + chevron (Apple Health style) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 15 }}>
        <Icon size={17} color={col.c} style={{ flex: 'none' }} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            font: '700 16px var(--font-ui)',
            color: col.c,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {spec.label}
        </span>
        <span
          style={{
            font: '13px var(--font-ui)',
            color: flaggedCount > 0 ? 'oklch(0.56 0.13 65)' : 'var(--ink-4)',
            flex: 'none',
          }}
        >
          {flaggedCount > 0
            ? `${flaggedCount} to review`
            : `${spec.items.length} ${spec.items.length === 1 ? 'test' : 'tests'}`}
        </span>
        <ChevronRight size={16} className="chev" />
      </div>

      {/* body: big-value stat columns */}
      <div style={{ display: 'flex' }}>
        {shown.map((g, i) => {
          const status = isMeasureAlert(g)
            ? g.latest.flag ?? evaluateRange(g.name, g.latest.num)?.statusLabel ?? 'Review'
            : ''
          return (
            <div
              key={g.name}
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                paddingLeft: i ? 12 : 0,
                paddingRight: i === shown.length - 1 ? 0 : 8,
                borderLeft: i ? '1px solid var(--line)' : undefined,
              }}
            >
              <div
                style={{
                  font: '11.5px/1.3 var(--font-ui)',
                  color: 'var(--ink-3)',
                  marginBottom: 4,
                  minHeight: 30,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {prettyName(g.name)}
              </div>
              <div
                style={{
                  font: '700 18px var(--font-ui)',
                  color: 'var(--ink)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {g.latest.value}
              </div>
              {g.latest.unit && (
                <div style={{ font: '10.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 1, overflowWrap: 'anywhere' }}>
                  {g.latest.unit}
                </div>
              )}
              {status && (
                <div style={{ font: '11px var(--font-ui)', color: 'oklch(0.58 0.12 70)', marginTop: 2 }}>{status}</div>
              )}
            </div>
          )
        })}
      </div>
    </button>
  )
}

/** Second level: the measures for a specialty, as clean metric tiles with a mini trend. */
function CategoryMeasures({ items, onOpenMeasure }: { items: LabGroup[]; onOpenMeasure: (name: string) => void }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
        paddingTop: 4,
        paddingBottom: 8,
      }}
    >
      {items.map((g) => (
        <MeasureTile key={g.name} group={g} onClick={() => onOpenMeasure(g.name)} />
      ))}
    </div>
  )
}

function MeasureTile({ group: g, onClick }: { group: LabGroup; onClick: () => void }) {
  const re = evaluateRange(g.name, g.latest.num)
  const alert = isMeasureAlert(g)
  const dot = alert ? 'var(--alert)' : re?.status === 'in' ? 'var(--good)' : 'var(--ink-4)'
  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 14,
        minHeight: 116,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: 'pointer',
        minWidth: 0,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flex: 'none', marginTop: 5 }} />
        <span
          style={{
            font: '12px/1.3 var(--font-ui)',
            color: 'var(--ink-3)',
            flex: 1,
            minWidth: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {prettyName(g.name)}
        </span>
      </span>
      <span style={{ flex: 1 }} />
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            font: '700 21px var(--font-ui)',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            color: alert ? 'var(--alert)' : 'var(--ink)',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {g.latest.value}
        </span>
        {g.latest.unit && (
          <span style={{ display: 'block', font: '11px var(--font-ui)', color: 'var(--ink-4)', marginTop: 1 }}>
            {g.latest.unit}
          </span>
        )}
      </span>
      <Sparkline group={g} color={alert ? 'var(--alert)' : 'var(--primary)'} />
    </button>
  )
}

/** Tiny inline trend line for a measure's numeric readings (nothing if <2 points). */
function Sparkline({ group, color }: { group: LabGroup; color: string }) {
  const nums = group.readings
    .filter((r) => r.num != null)
    .sort((a, b) => a.time - b.time)
    .map((r) => r.num as number)
  if (nums.length < 2) return <span style={{ width: 54, flex: 'none' }} />
  const W = 54
  const H = 26
  const pad = 3
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min || 1
  const pt = (n: number, i: number) => {
    const x = pad + ((W - 2 * pad) * i) / (nums.length - 1)
    const y = pad + (H - 2 * pad) * (1 - (n - min) / span)
    return { x, y }
  }
  const points = nums.map((n, i) => pt(n, i))
  const last = points[points.length - 1]
  return (
    <svg width={W} height={H} style={{ flex: 'none', display: 'block' }} aria-hidden="true">
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.2" fill={color} />
    </svg>
  )
}

/** Small tappable card summarising another measure, shown beneath the current one. */

function MeasureDetail({
  group: g,
  summary,
  onOpenRecord,
}: {
  group: LabGroup
  summary: string | null
  onOpenRecord: (recordId: string) => void
}) {
  const bars = labChartBars(g)
  const delta = computeDelta(g)
  const rangeEval = evaluateRange(g.name, g.latest.num)
  // A description that matches THIS measure (what the test is + where the value
  // sits), falling back to the document's own summary only if we know nothing.
  const description = describeMeasure(g.name, g.latest.value, rangeEval) ?? summary
  // Prefer the document's own flag; otherwise derive a status from the reference range.
  const badge = g.latest.flag
    ? { text: g.latest.flag, tone: 'alert' as const }
    : rangeEval?.statusLabel
      ? { text: rangeEval.statusLabel, tone: rangeEval.tone }
      : null
  const chartTone = badge?.tone === 'alert' ? 'alert' : 'neutral'

  const READINGS_PREVIEW = 6
  const [showAllReadings, setShowAllReadings] = useState(false)
  const shownReadings = showAllReadings ? g.readings : g.readings.slice(0, READINGS_PREVIEW)

  return (
    <>
      <div className="lab-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ font: '14px var(--font-ui)', color: 'var(--ink-2)', minWidth: 0 }}>{prettyName(g.name)}</div>
          {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
          <div className="lab-hero__value">
            {g.latest.value}
            {g.latest.unit && <span className="lab-hero__unit">{g.latest.unit}</span>}
          </div>
          {delta && <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-3)' }}>{delta}</div>}
        </div>
        {rangeEval?.label && (
          <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)' }}>{rangeEval.label}</div>
        )}
        <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginBottom: 14, marginTop: 2 }}>
          Latest · {g.latest.date}
        </div>

        {bars.length >= 1 ? (
          <>
            <BarChart bars={bars} tone={chartTone} />
            {bars.length === 1 && (
              <div style={{ font: '11.5px var(--font-ui)', color: 'var(--ink-4)', marginTop: 8 }}>
                One reading so far — add more reports of this test and the trend builds out here.
              </div>
            )}
          </>
        ) : (
          <div style={{ font: '12px var(--font-ui)', color: 'var(--ink-4)' }}>
            No numeric value to chart for this measure.
          </div>
        )}
      </div>

      {description && (
        <div
          className="card card--pad"
          style={{ font: '13px/1.6 var(--font-ui)', color: 'var(--ink-2)', marginBottom: 20 }}
        >
          {description}
        </div>
      )}

      <Eyebrow>All readings</Eyebrow>
      <div className="stack" style={{ gap: 8, marginBottom: 10 }}>
        {shownReadings.map((r, i) => {
          const re = evaluateRange(g.name, r.num)
          const alert = !!r.flag || (re?.status != null && re.status !== 'in')
          return (
            <button
              key={i}
              onClick={() => onOpenRecord(r.recordId)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)',
                padding: '12px 14px',
                font: '14px var(--font-ui)',
                color: 'var(--ink-2)',
                textAlign: 'left',
              }}
            >
              <span>{r.date}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: alert ? 'var(--alert)' : 'var(--ink)', fontWeight: 500 }}>
                {r.value}
                {r.unit ? ` ${r.unit}` : ''}
                <TrendIcon trend={readingTrend(g, i)} />
              </span>
            </button>
          )
        })}
      </div>

      {g.readings.length > READINGS_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAllReadings((s) => !s)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            font: '600 13px var(--font-ui)',
            color: 'var(--primary)',
            marginBottom: rangeEval ? 12 : 20,
            display: 'block',
          }}
        >
          {showAllReadings ? 'Show fewer' : `Show all ${g.readings.length} readings`}
        </button>
      )}

      {rangeEval && (
        <div style={{ font: '11px/1.5 var(--font-ui)', color: 'var(--ink-4)', marginBottom: 20 }}>
          Reference ranges are general adult guidance, not a diagnosis. Your doctor interprets
          results in context.
        </div>
      )}
    </>
  )
}

/** Vertical bar chart: honest proportional bars, each labelled with its value on
 *  top and its date below; the latest reading is emphasised. */
function BarChart({ bars, tone }: { bars: ChartBar[]; tone: 'alert' | 'good' | 'neutral' }) {
  const color =
    tone === 'good' ? 'var(--good)' : tone === 'alert' ? 'var(--alert)' : 'var(--primary)'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <span
              style={{
                font: '600 10.5px var(--font-ui)',
                color: b.hot ? 'var(--ink)' : 'var(--ink-4)',
                marginBottom: 5,
                whiteSpace: 'nowrap',
              }}
            >
              {b.value}
            </span>
            {/* scale to ~82% so the value label always has headroom */}
            <div
              style={{
                width: '100%',
                height: `${Math.max(8, b.height * 0.82)}%`,
                borderRadius: 7,
                background: b.hot ? color : 'oklch(0.9 0.006 95)',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
              font: '600 11px var(--font-ui)',
              color: b.hot ? 'var(--ink-2)' : 'var(--ink-4)',
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/** "↑ 22 from 188 in Feb" — change of the latest numeric reading vs the oldest. */
function computeDelta(g: LabGroup): string | null {
  const nums = g.readings.filter((r) => r.num != null)
  if (nums.length < 2) return null
  const latest = nums[0]
  const oldest = nums[nums.length - 1]
  const diff = (latest.num as number) - (oldest.num as number)
  if (diff === 0) return `No change from ${oldest.value}`
  const arrow = diff > 0 ? '↑' : '↓'
  const mag = Math.abs(diff)
  const magStr = Number.isInteger(mag) ? String(mag) : mag.toFixed(1)
  const month = new Date(oldest.time).toLocaleDateString(undefined, { month: 'short' })
  return `${arrow} ${magStr} from ${oldest.value} in ${month}`
}

/** Direction of a reading relative to the next-older reading (readings are newest-first). */
function readingTrend(g: LabGroup, i: number): Trend | undefined {
  const cur = g.readings[i]?.num
  const older = g.readings[i + 1]?.num
  if (cur == null || older == null) return undefined
  if (cur > older) return 'up'
  if (cur < older) return 'down'
  return 'flat'
}
