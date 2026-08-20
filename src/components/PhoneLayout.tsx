import { Outlet } from 'react-router-dom'
import { DevReset } from './DevReset'

/**
 * Shared chrome: the desktop presentation backdrop + phone frame. The active
 * route renders inside the phone screen via <Outlet/>.
 */
export function PhoneLayout() {
  return (
    <div className="board">
      <div className="board__intro">
        <div className="board__eyebrow">HealthKeeper</div>
        <h1 className="board__title">New patient setup</h1>
        <p className="board__sub">
          A fresh, empty account. Walk through onboarding from the very first screen — sign in,
          choose who the record is for, and add the patient. Use <b>Reset</b> to start over.
        </p>
      </div>
      <div className="phone">
        <div className="phone__screen">
          <Outlet />
        </div>
      </div>
      <DevReset />
    </div>
  )
}
