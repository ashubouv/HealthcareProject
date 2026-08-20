import { useCallback, useEffect, useState } from 'react'

/**
 * Medications are derived from prescription records, so "this medicine is old /
 * no longer needed" is a user judgement we keep locally rather than inventing a
 * server field. Archived medicines stay in the data (and in the archive list)
 * but move out of the active list. Keyed by the medicine name (lowercased).
 */
const KEY = 'phr_archived_meds'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function medKey(name: string): string {
  return name.trim().toLowerCase()
}

export function useMedArchive() {
  const [archived, setArchived] = useState<Set<string>>(() => load())

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...archived]))
    } catch {
      /* storage unavailable — archive just won't persist */
    }
  }, [archived])

  const isArchived = useCallback((name: string) => archived.has(medKey(name)), [archived])

  const archive = useCallback((name: string) => {
    setArchived((prev) => new Set(prev).add(medKey(name)))
  }, [])

  const restore = useCallback((name: string) => {
    setArchived((prev) => {
      const next = new Set(prev)
      next.delete(medKey(name))
      return next
    })
  }, [])

  return { isArchived, archive, restore }
}
