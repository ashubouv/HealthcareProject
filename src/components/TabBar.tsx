import { Home, CalendarClock, Pill, LayoutGrid, Plus } from 'lucide-react'
import { useStore } from '../state/store'
import type { Screen } from '../data/types'

const ROOTS: Screen[] = [
  'home',
  'timeline',
  'meds',
  'labs',
  'history',
  'sharing',
  'record',
  'summary',
]

export function TabBar() {
  const { screen, go, openAdd } = useStore()
  if (!ROOTS.includes(screen)) return null

  const onTimeline = screen === 'timeline' || screen === 'record'
  const onMore = ['labs', 'history', 'sharing', 'summary'].includes(screen)

  return (
    <div className="tabbar">
      <Tab label="Home" icon={<Home size={22} />} active={screen === 'home'} onClick={() => go('home')} />
      <Tab
        label="Timeline"
        icon={<CalendarClock size={22} />}
        active={onTimeline}
        onClick={() => go('timeline')}
      />
      <button className="tabbar__add" onClick={openAdd} aria-label="Add to record">
        <Plus size={26} strokeWidth={2.4} />
      </button>
      <Tab label="Meds" icon={<Pill size={22} />} active={screen === 'meds'} onClick={() => go('meds')} />
      <Tab label="More" icon={<LayoutGrid size={22} />} active={onMore} onClick={() => go('labs')} />
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
  icon: React.ReactNode
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
