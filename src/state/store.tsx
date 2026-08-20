import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  CaptureStep,
  DoctorId,
  LabMetric,
  ManualStep,
  RecordId,
  Screen,
  TimelineFilter,
} from '../data/types'

interface Notif {
  record: boolean
  alerts: boolean
  appts: boolean
}

interface State {
  screen: Screen
  cap: CaptureStep
  man: ManualStep
  addSheet: boolean
  showPw: boolean
  medTab: 'current' | 'history'
  tlFilter: TimelineFilter
  tlQuery: string
  labMetric: LabMetric
  visitType: 'outpatient' | 'inpatient'
  medFreq: 'once' | 'twice' | 'prn'
  recLang: 'en' | 'ta'
  recId: RecordId
  docFilter: DoctorId
  notif: Notif
  toast: string | null
}

const INITIAL: State = {
  screen: 'login',
  cap: 'camera',
  man: 'choose',
  addSheet: false,
  showPw: false,
  medTab: 'current',
  tlFilter: 'all',
  tlQuery: '',
  labMetric: 'chol',
  visitType: 'outpatient',
  medFreq: 'once',
  recLang: 'en',
  recId: 'lipid',
  docFilter: 'rao',
  notif: { record: true, alerts: true, appts: false },
  toast: null,
}

interface Store extends State {
  set: (patch: Partial<State>) => void
  go: (screen: Screen) => void
  openAdd: () => void
  closeAdd: () => void
  startScan: () => void
  startUpload: () => void
  startManual: () => void
  shutter: () => void
  openRecord: (id: RecordId) => void
  toggleNotif: (k: keyof Notif) => void
  showToast: (msg: string) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(INITIAL)
  const capTimer = useRef<ReturnType<typeof setTimeout>>()
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const set = useCallback((patch: Partial<State>) => {
    setState((s) => ({ ...s, ...patch }))
  }, [])

  const go = useCallback((screen: Screen) => {
    clearTimeout(capTimer.current)
    setState((s) => ({ ...s, screen, addSheet: false }))
  }, [])

  const openAdd = useCallback(() => set({ addSheet: true }), [set])
  const closeAdd = useCallback(() => set({ addSheet: false }), [set])

  const startScan = useCallback(
    () => set({ screen: 'capture', cap: 'camera', addSheet: false }),
    [set],
  )

  const startUpload = useCallback(() => {
    set({ screen: 'capture', cap: 'extracting', addSheet: false })
    clearTimeout(capTimer.current)
    capTimer.current = setTimeout(() => set({ cap: 'review' }), 1900)
  }, [set])

  const startManual = useCallback(
    () => set({ screen: 'manual', man: 'choose', addSheet: false }),
    [set],
  )

  const shutter = useCallback(() => {
    set({ cap: 'extracting' })
    clearTimeout(capTimer.current)
    capTimer.current = setTimeout(() => set({ cap: 'review' }), 1900)
  }, [set])

  const openRecord = useCallback((id: RecordId) => {
    clearTimeout(capTimer.current)
    setState((s) => ({ ...s, screen: 'record', recId: id, addSheet: false }))
  }, [])

  const toggleNotif = useCallback((k: keyof Notif) => {
    setState((s) => ({ ...s, notif: { ...s.notif, [k]: !s.notif[k] } }))
  }, [])

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current)
    setState((s) => ({ ...s, toast: msg }))
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: null })), 1900)
  }, [])

  const value = useMemo<Store>(
    () => ({
      ...state,
      set,
      go,
      openAdd,
      closeAdd,
      startScan,
      startUpload,
      startManual,
      shutter,
      openRecord,
      toggleNotif,
      showToast,
    }),
    [state, set, go, openAdd, closeAdd, startScan, startUpload, startManual, shutter, openRecord, toggleNotif, showToast],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
