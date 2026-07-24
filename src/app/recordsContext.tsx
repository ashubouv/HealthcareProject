import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { api, type RecordRow } from '../api/client'
import { useSession } from '../state/session'

/* ============================================================
   Shared records store for the main app. Loads the patient's
   records once and exposes refresh() so screens update as soon
   as a new document is added.
   ============================================================ */

interface RecordsContextValue {
  records: RecordRow[]
  loading: boolean
  refresh: () => Promise<void>
  byId: (id: string) => RecordRow | undefined
}

const RecordsContext = createContext<RecordsContextValue | null>(null)

export function RecordsProvider({ children }: { children: ReactNode }) {
  const { activePerson } = useSession()
  const [records, setRecords] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const rows = await api.listRecords(activePerson?.id)
      setRecords(rows)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [activePerson?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<RecordsContextValue>(
    () => ({ records, loading, refresh, byId: (id) => records.find((r) => r.id === id) }),
    [records, loading, refresh],
  )

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>
}

// Layout route: provides records to the whole /app subtree.
export function RecordsLayout() {
  return (
    <RecordsProvider>
      <Outlet />
    </RecordsProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext)
  if (!ctx) throw new Error('useRecords must be used within RecordsProvider')
  return ctx
}
