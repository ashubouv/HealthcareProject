import { useCallback, useEffect, useState } from 'react'

/**
 * Home-screen "Needs your attention" cards are derived from flagged lab values,
 * not stored server-side, so dismissals are kept locally. Each dismissal is keyed
 * to the exact flagged item (record + test + flag), so clearing one won't hide a
 * *different* flag, and a genuinely new/changed result still surfaces.
 */
const KEY = 'phr_dismissed_flags'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function useDismissedFlags() {
  const [dismissed, setDismissed] = useState<Set<string>>(() => load())

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...dismissed]))
    } catch {
      /* storage full or unavailable — dismissals just won't persist */
    }
  }, [dismissed])

  const dismiss = useCallback((...keys: string[]) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => next.add(k))
      return next
    })
  }, [])

  const isDismissed = useCallback((key: string) => dismissed.has(key), [dismissed])

  return { isDismissed, dismiss }
}
