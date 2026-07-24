import { Home, CalendarClock, Pill, LayoutGrid, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export function AppTabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="tabbar">
      <Tab label="Home" icon={<Home size={22} />} active={pathname === '/app'} onClick={() => navigate('/app')} />
      <Tab
        label="Timeline"
        icon={<CalendarClock size={22} />}
        active={pathname.startsWith('/app/timeline') || pathname.startsWith('/app/record')}
        onClick={() => navigate('/app/timeline')}
      />
      <button className="tabbar__add" onClick={() => navigate('/app/add')} aria-label="Add a document">
        <Plus size={26} strokeWidth={2.4} />
      </button>
      <Tab label="Meds" icon={<Pill size={22} />} active={pathname.startsWith('/app/meds')} onClick={() => navigate('/app/meds')} />
      <Tab label="More" icon={<LayoutGrid size={22} />} active={pathname.startsWith('/app/labs')} onClick={() => navigate('/app/labs')} />
    </div>
  )
}

function Tab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button className={`tab${active ? ' tab--on' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
