import { Outlet } from 'react-router-dom'
import { AppTabBar } from './AppTabBar'

/** Wraps the tab-rooted screens (Home/Timeline/Meds/More) with the bottom nav. */
export function AppShell() {
  return (
    <>
      <Outlet />
      <AppTabBar />
    </>
  )
}
