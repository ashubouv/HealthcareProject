/* ============================================================
   API client — talks to the Express backend at /api (proxied
   by Vite to http://localhost:3001). Holds the session token in
   localStorage and attaches it as a bearer token.
   ============================================================ */

export type ProxyChoice = 'self' | 'caretaker'
export type SignInMethod = 'phone' | 'email'

export interface Person {
  id: string
  fullName: string
  ageYears: number | null
  relationship: 'self' | 'dependent'
  proxyChoice: ProxyChoice | null
  gender: string | null
  notes: string | null
}

export interface ExtractedValue {
  name: string
  value: string
  unit: string | null
  flag: string | null
}
export interface ExtractedMedication {
  name: string
  dose: string | null
  frequency: string | null
}
export interface Extracted {
  documentType: 'lab_report' | 'prescription' | 'discharge_summary' | 'scan' | 'other'
  title: string
  patientName: string | null
  doctorName: string | null
  hospital: string | null
  date: string | null
  tags: string[]
  values: ExtractedValue[]
  medications: ExtractedMedication[]
  plainLanguageSummary: string
}

export interface RecordRow {
  id: string
  personId: string | null
  kind: string | null
  title: string | null
  doctor: string | null
  hospital: string | null
  date: string | null
  sourceFilename: string | null
  documentId: string | null
  extracted: Extracted | null
  explanation: string | null
  createdAt: string
  updatedAt: string | null
}

const TOKEN_KEY = 'phr_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`/api${path}`, { ...init, headers })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(body.error || res.statusText, res.status)
  }
  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const api = {
  // ---- auth ----
  passwordLogin(email: string, password: string) {
    return postJson<{ token: string; userId: string; isNew: boolean }>('/auth/password-login', {
      email,
      password,
    })
  },
  sendOtp(contact: string, method: SignInMethod) {
    return postJson<{ sent: true }>('/auth/request-otp', { contact, method })
  },
  verifyOtp(method: SignInMethod, contact: string, code: string) {
    return postJson<{ token: string; userId: string }>('/auth/verify-otp', {
      method,
      contact,
      code,
    })
  },
  me() {
    return request<{ user: { id: string }; persons: Person[] }>('/auth/me')
  },
  logout() {
    return postJson<{ ok: true }>('/auth/logout', {})
  },

  // ---- persons ----
  listPersons() {
    return request<Person[]>('/persons')
  },
  createPerson(input: {
    fullName: string
    ageYears?: number
    relationship: 'self' | 'dependent'
    proxyChoice: ProxyChoice
    gender?: string
  }) {
    return postJson<Person>('/persons', input)
  },
  updatePerson(id: string, input: { fullName?: string; ageYears?: number; gender?: string; notes?: string }) {
    return request<Person>(`/persons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  // ---- documents / AI extraction ----
  extractDocument(file: File) {
    const form = new FormData()
    form.append('file', file)
    return request<{ extracted: Extracted; sourceFilename: string; documentId: string }>('/extract', {
      method: 'POST',
      body: form,
    })
  },

  /** Fetch the original uploaded file (with auth) as a blob object URL for viewing. */
  async getDocumentBlobUrl(documentId: string): Promise<string> {
    const token = getToken()
    const res = await fetch(`/api/documents/${documentId}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new ApiError(body.error || res.statusText, res.status)
    }
    return URL.createObjectURL(await res.blob())
  },

  // ---- records ----
  listRecords(personId?: string) {
    const q = personId ? `?personId=${encodeURIComponent(personId)}` : ''
    return request<RecordRow[]>(`/records${q}`)
  },
  saveRecord(input: {
    personId: string | null
    kind: string | null
    title: string | null
    doctor: string | null
    hospital: string | null
    date: string | null
    sourceFilename: string | null
    documentId: string | null
    extracted: Extracted
    explanation: string | null
  }) {
    return postJson<RecordRow>('/records', input)
  },
  updateRecord(
    id: string,
    input: {
      title?: string | null
      doctor: string | null
      hospital: string | null
      date: string | null
      extracted: Extracted
    },
  ) {
    return request<RecordRow>(`/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },
  deleteRecord(id: string) {
    return request<null>(`/records/${id}`, { method: 'DELETE' })
  },

  // ---- dev ----
  devReset() {
    return postJson<{ ok: true }>('/dev/reset', {})
  },
}
