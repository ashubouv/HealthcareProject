import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../state/session'

/**
 * Gate for the main app. An unauthenticated / not-yet-onboarded user is sent
 * straight back to the start of onboarding — they can never reach a protected
 * screen directly.
 */
export function ProtectedRoute() {
  const { canEnterApp } = useSession()
  if (!canEnterApp) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/**
 * Gate for the steps that come AFTER the user authenticates (proxy choice,
 * add-person). Hitting them out of order bounces back to the right place.
 */
export function RequireAuthStep() {
  const { status } = useSession()
  if (status !== 'authenticated') return <Navigate to="/onboarding" replace />
  return <Outlet />
}
