import type { ReactNode } from 'react'
import type { Tone, Trend } from '../data/types'
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'badge--neutral',
  good: 'badge--good',
  warn: 'badge--warn',
  alert: 'badge--alert',
}

export function Badge({
  children,
  tone = 'neutral',
  variant,
}: {
  children: ReactNode
  tone?: Tone
  variant?: 'solid' | 'outline'
}) {
  const cls = variant ? `badge--${variant}` : TONE_CLASS[tone]
  return <span className={`badge ${cls}`}>{children}</span>
}

export function TrendIcon({ trend, size = 14 }: { trend?: Trend; size?: number }) {
  if (trend === 'up') return <ArrowUpRight size={size} style={{ color: 'var(--alert)' }} />
  if (trend === 'down') return <ArrowDownRight size={size} style={{ color: 'var(--good)' }} />
  if (trend === 'flat') return <ArrowRight size={size} style={{ color: 'var(--ink-4)' }} />
  return null
}

export function DocThumb({
  width,
  height,
  radius = 8,
  style,
}: {
  width: number | string
  height: number | string
  radius?: number
  style?: React.CSSProperties
}) {
  return <div className="doc" style={{ width, height, borderRadius: radius, ...style }} />
}

export function toneColor(tone?: 'alert' | 'good'): string | undefined {
  if (tone === 'alert') return 'var(--alert)'
  if (tone === 'good') return 'var(--good)'
  return undefined
}
