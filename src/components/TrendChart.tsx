import { useId } from 'react'
import type { LabBar } from '../data/labs'

/**
 * Hi-fi trend chart: a smooth gradient area with a line, point markers,
 * the latest reading emphasised, and month labels beneath.
 */
export function TrendChart({ bars, tone }: { bars: LabBar[]; tone: 'alert' | 'good' | 'neutral' }) {
  const gid = useId().replace(/:/g, '')
  const W = 300
  const H = 120
  const padX = 14
  const padTop = 14
  const padBottom = 6
  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom

  const stroke =
    tone === 'good' ? 'var(--good)' : tone === 'alert' ? 'var(--alert)' : 'var(--primary)'

  const pts = bars.map((b, i) => {
    const x = padX + (bars.length === 1 ? innerW / 2 : (innerW * i) / (bars.length - 1))
    const y = padTop + innerH * (1 - b.height / 100)
    return { x, y, b }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padTop + innerH} L ${pts[0].x} ${
    padTop + innerH
  } Z`
  const last = pts[pts.length - 1]

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label="Trend over the last five readings"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line
          x1={padX}
          y1={padTop + innerH}
          x2={W - padX}
          y2={padTop + innerH}
          stroke="var(--line)"
          strokeWidth="1"
        />

        <path d={areaPath} fill={`url(#area-${gid})`} />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.b.hot ? 5 : 3}
            fill={p.b.hot ? stroke : 'var(--surface)'}
            stroke={stroke}
            strokeWidth={p.b.hot ? 0 : 2}
          />
        ))}
        {/* emphasis ring on latest */}
        <circle cx={last.x} cy={last.y} r="9" fill={stroke} fillOpacity="0.14" />
      </svg>
      <div style={{ display: 'flex', marginTop: 6 }}>
        {bars.map((b) => (
          <div
            key={b.label}
            style={{
              flex: 1,
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
