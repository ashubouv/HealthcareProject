import { useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useSession } from '../state/session'

/**
 * Dev-only "Start over" control. Wipes the database, drops the session, and
 * returns to the very first onboarding screen, so the flow can be tested
 * repeatedly from a clean slate. Hidden in production builds.
 */
export function DevReset() {
  const { reset } = useSession()
  const navigate = useNavigate()

  if (!import.meta.env.DEV) return null

  const startOver = async () => {
    await reset()
    navigate('/onboarding', { replace: true })
  }

  return (
    <button className="dev-reset" onClick={startOver} title="Clear all state and restart onboarding">
      <RotateCcw size={15} />
      Reset / Start over
    </button>
  )
}
