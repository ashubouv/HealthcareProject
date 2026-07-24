import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PhoneLayout } from './components/PhoneLayout'
import { ProtectedRoute, RequireAuthStep } from './routes/guards'
import { WelcomeStep } from './onboarding/WelcomeStep'
import { SignInStep } from './onboarding/SignInStep'
import { ProxyStep } from './onboarding/ProxyStep'
import { PersonStep } from './onboarding/PersonStep'
import { RecordsLayout } from './app/recordsContext'
import { AppShell } from './app/AppShell'
import { HomeScreen } from './app/HomeScreen'
import { TimelineScreen } from './app/TimelineScreen'
import { MedsScreen } from './app/MedsScreen'
import { LabsScreen } from './app/LabsScreen'
import { RecordDetailScreen } from './app/RecordDetailScreen'
import { DoctorSummaryScreen } from './app/DoctorSummaryScreen'
import { AddDocument } from './app/AddDocument'
import { useSession } from './state/session'

/**
 * A brand-new user starts unauthenticated with no data. The app boots to
 * "/" which redirects into onboarding; the protected app is unreachable until
 * the full onboarding flow completes. An existing session is restored from the
 * backend on load.
 */
export default function App() {
  const { loading } = useSession()
  if (loading) return <BootSplash />

  return (
    <Routes>
      <Route element={<PhoneLayout />}>
        {/* boot → onboarding */}
        <Route index element={<Navigate to="/onboarding" replace />} />

        {/* public onboarding flow */}
        <Route path="onboarding">
          <Route index element={<WelcomeStep />} />
          <Route path="sign-in" element={<SignInStep />} />
          {/* steps that require an authenticated session */}
          <Route element={<RequireAuthStep />}>
            <Route path="proxy" element={<ProxyStep />} />
            <Route path="person" element={<PersonStep />} />
          </Route>
        </Route>

        {/* protected app — only reachable once onboarding completes */}
        <Route path="app" element={<ProtectedRoute />}>
          <Route element={<RecordsLayout />}>
            {/* tab-rooted screens share the bottom navigation */}
            <Route element={<AppShell />}>
              <Route index element={<HomeScreen />} />
              <Route path="timeline" element={<TimelineScreen />} />
              <Route path="meds" element={<MedsScreen />} />
              <Route path="labs" element={<LabsScreen />} />
            </Route>
            {/* full-screen flows (no tab bar) */}
            <Route path="add" element={<AddDocument />} />
            <Route path="record/:id" element={<RecordDetailScreen />} />
            <Route path="summary" element={<DoctorSummaryScreen />} />
          </Route>
        </Route>

        {/* anything else → onboarding */}
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Route>
    </Routes>
  )
}

function BootSplash() {
  // If loading drags on (the free server waking from sleep), explain the wait
  // in our own words instead of leaving a bare spinner.
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        background: 'var(--bg)',
        padding: '0 32px',
        textAlign: 'center',
      }}
    >
      <img src="/icon-192.png" alt="" width={64} height={64} style={{ borderRadius: 16 }} />
      <div style={{ font: '600 18px var(--font-ui)', color: 'var(--ink)' }}>HealthKeeper</div>
      <div style={{ font: '13px/1.5 var(--font-ui)', color: 'var(--ink-3)' }}>
        {slow
          ? 'Waking up the secure server — the first open of the day can take up to a minute. Hang tight.'
          : 'Loading…'}
      </div>
    </div>
  )
}
