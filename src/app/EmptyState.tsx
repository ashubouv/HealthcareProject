import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2 } from 'lucide-react'

/** Shared "nothing here yet" panel with a CTA to add a document. */
export function EmptyState({
  icon,
  title,
  body,
  cta = 'Add a document',
  onCta,
}: {
  icon: ReactNode
  title: string
  body: string
  cta?: string
  onCta?: () => void
}) {
  const navigate = useNavigate()
  return (
    <div
      className="card card--pad"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 22px', gap: 14 }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'var(--surface-3)',
          color: 'var(--ink-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ font: '500 17px var(--font-display)', color: 'var(--ink)' }}>{title}</div>
        <div style={{ font: '13.5px/1.5 var(--font-ui)', color: 'var(--ink-3)', marginTop: 6 }}>{body}</div>
      </div>
      <button
        className="btn btn--primary"
        style={{ width: 'auto', padding: '0 20px', height: 46 }}
        onClick={() => (onCta ? onCta() : navigate('/app/add'))}
      >
        <FilePlus2 size={17} /> {cta}
      </button>
    </div>
  )
}
