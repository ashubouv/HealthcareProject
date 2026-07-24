import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, clearToken, getToken, setToken, type Person, type ProxyChoice, type SignInMethod } from '../api/client'

/* ============================================================
   Session state — now backed by the Express/Postgres backend.
   The bearer token lives in localStorage; on load we restore the
   session from /api/me. Onboarding progress (method/contact/proxy)
   is kept in memory until the person record is created server-side.
   ============================================================ */

export type AuthStatus = 'unauthenticated' | 'authenticated'

interface SessionContextValue {
  loading: boolean
  status: AuthStatus
  userId: string | null
  method: SignInMethod | null
  contact: string | null
  proxyChoice: ProxyChoice | null
  persons: Person[]
  onboardingComplete: boolean
  canEnterApp: boolean
  /** True if someone has successfully signed in on this device before. */
  knownUser: boolean
  /** The patient currently being viewed/managed (a caretaker can have several). */
  activePerson: Person | null

  setSignIn: (method: SignInMethod, contact: string) => void
  authenticate: (userId: string, token: string) => void
  setProxyChoice: (choice: ProxyChoice) => void
  addPerson: (person: Person) => void
  replacePerson: (person: Person) => void
  setActivePerson: (personId: string) => void
  completeOnboarding: () => void
  reset: () => Promise<void>
}

const ACTIVE_PERSON_KEY = 'phr_active_person'
const KNOWN_USER_KEY = 'phr_known_user'

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<AuthStatus>('unauthenticated')
  const [userId, setUserId] = useState<string | null>(null)
  const [method, setMethod] = useState<SignInMethod | null>(null)
  const [contact, setContact] = useState<string | null>(null)
  const [proxyChoice, setProxyChoiceState] = useState<ProxyChoice | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  // Which patient is being viewed. Falls back to the first person if the stored
  // choice is missing or stale, so it is always valid.
  const [activePersonId, setActivePersonId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_PERSON_KEY),
  )

  // Restore an existing session on first load.
  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const { user, persons } = await api.me()
        if (cancelled) return
        setStatus('authenticated')
        setUserId(user.id)
        setPersons(persons)
        setOnboardingComplete(persons.length > 0)
        if (persons[0]?.proxyChoice) setProxyChoiceState(persons[0].proxyChoice)
      } catch {
        clearToken()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const setSignIn = useCallback((m: SignInMethod, c: string) => {
    setMethod(m)
    setContact(c)
  }, [])

  const [knownUser, setKnownUser] = useState<boolean>(
    () => localStorage.getItem(KNOWN_USER_KEY) === '1',
  )

  const authenticate = useCallback((id: string, token: string) => {
    setToken(token)
    setStatus('authenticated')
    setUserId(id)
    // Remember that this device has an account, so the welcome screen can say
    // "Log in" instead of "Get started" next time.
    setKnownUser(true)
    try {
      localStorage.setItem(KNOWN_USER_KEY, '1')
    } catch {
      /* best-effort */
    }
  }, [])

  const setProxyChoice = useCallback((choice: ProxyChoice) => setProxyChoiceState(choice), [])
  const addPerson = useCallback((person: Person) => setPersons((p) => [...p, person]), [])
  const replacePerson = useCallback(
    (person: Person) => setPersons((p) => p.map((x) => (x.id === person.id ? person : x))),
    [],
  )
  const setActivePerson = useCallback((personId: string) => {
    setActivePersonId(personId)
    try {
      localStorage.setItem(ACTIVE_PERSON_KEY, personId)
    } catch {
      /* persistence is best-effort */
    }
  }, [])
  const completeOnboarding = useCallback(() => setOnboardingComplete(true), [])

  const reset = useCallback(async () => {
    // Dev: wipe the database, drop the session, and return to a clean slate.
    try {
      await api.devReset()
    } catch {
      /* ignore — still clear locally */
    }
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    clearToken()
    try {
      localStorage.removeItem(ACTIVE_PERSON_KEY)
      localStorage.removeItem(KNOWN_USER_KEY)
    } catch {
      /* ignore */
    }
    setKnownUser(false)
    setStatus('unauthenticated')
    setUserId(null)
    setMethod(null)
    setContact(null)
    setProxyChoiceState(null)
    setPersons([])
    setActivePersonId(null)
    setOnboardingComplete(false)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      loading,
      status,
      userId,
      method,
      contact,
      proxyChoice,
      persons,
      onboardingComplete,
      canEnterApp: status === 'authenticated' && onboardingComplete,
      knownUser,
      activePerson: persons.find((p) => p.id === activePersonId) ?? persons[0] ?? null,
      setSignIn,
      authenticate,
      setProxyChoice,
      addPerson,
      replacePerson,
      setActivePerson,
      completeOnboarding,
      reset,
    }),
    [
      loading,
      status,
      userId,
      method,
      contact,
      proxyChoice,
      persons,
      activePersonId,
      onboardingComplete,
      knownUser,
      setSignIn,
      authenticate,
      setProxyChoice,
      addPerson,
      replacePerson,
      setActivePerson,
      completeOnboarding,
      reset,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
