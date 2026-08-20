import { ChevronLeft, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface TopBarProps {
  title?: ReactNode
  onBack?: () => void
  backIcon?: 'chevron' | 'close'
  action?: ReactNode
}

export function TopBar({ title, onBack, backIcon = 'chevron', action }: TopBarProps) {
  return (
    <div className="topbar">
      {onBack && (
        <button className="iconbtn" onClick={onBack} aria-label="Back">
          {backIcon === 'chevron' ? <ChevronLeft size={20} /> : <X size={19} />}
        </button>
      )}
      {title && <div className="topbar__title">{title}</div>}
      {action}
    </div>
  )
}
