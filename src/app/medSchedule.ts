/* ============================================================
   Turn a free-text medication frequency ("twice daily", "1-0-1",
   "at night", "once a week", "as needed") into structured dosing
   slots so we can lay out a simple daily/weekly dose calendar.
   Best-effort: anything we can't parse is treated as a plain daily
   dose with an unknown time.
   ============================================================ */

export type Slot = 'morning' | 'afternoon' | 'evening' | 'night'
export const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'night']
export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
}

export interface Schedule {
  slots: Slot[] // which times of day a dose is taken
  weekly: boolean // taken on set days rather than daily
  asNeeded: boolean // PRN / SOS
  perDay: number // doses per day (0 if weekly / as-needed / unknown)
}

/** Parse a "1-0-1"-style pattern (morning-afternoon-night, India-common). */
function parseNumericPattern(f: string): Slot[] | null {
  const m = f.match(/(\d)\s*-\s*(\d)\s*-\s*(\d)(?:\s*-\s*(\d))?/)
  if (!m) return null
  const counts = [m[1], m[2], m[3], m[4]].filter((x) => x != null).map(Number)
  // 3 numbers → morning / afternoon / night;  4 → morning/afternoon/evening/night
  const map3: Slot[] = ['morning', 'afternoon', 'night']
  const map4: Slot[] = ['morning', 'afternoon', 'evening', 'night']
  const map = counts.length === 4 ? map4 : map3
  const slots: Slot[] = []
  counts.forEach((c, i) => {
    if (c > 0) slots.push(map[i])
  })
  return slots
}

export function parseSchedule(frequency: string | null): Schedule {
  const f = (frequency ?? '').toLowerCase().trim()
  if (!f) return { slots: [], weekly: false, asNeeded: false, perDay: 1 }

  if (/\b(as needed|as-needed|prn|sos|when required)\b/.test(f)) {
    return { slots: [], weekly: false, asNeeded: true, perDay: 0 }
  }
  if (/\b(weekly|once a week|every week|per week)\b/.test(f) || /\bevery\s+\d+\s+days?\b/.test(f)) {
    return { slots: [], weekly: true, asNeeded: false, perDay: 0 }
  }

  // Explicit numeric pattern like 1-0-1
  const pattern = parseNumericPattern(f)
  if (pattern) return { slots: pattern, weekly: false, asNeeded: false, perDay: pattern.length }

  // Time-of-day keywords
  const slots: Slot[] = []
  if (/\bmorning\b|\bbreakfast\b|\bam\b|\bsunrise\b/.test(f)) slots.push('morning')
  if (/\bafternoon\b|\bnoon\b|\blunch\b|\bmidday\b/.test(f)) slots.push('afternoon')
  if (/\bevening\b|\bdinner\b|\bsupper\b/.test(f)) slots.push('evening')
  if (/\bnight\b|\bbedtime\b|\bhs\b|\bpm\b/.test(f)) slots.push('night')

  // Counts: once/twice/thrice/four times, od/bd/tds/qds
  let perDay = 0
  if (/\b(once|1 time|1x|od|qd|daily)\b/.test(f)) perDay = 1
  if (/\b(twice|2 times|2x|bd|bid)\b/.test(f)) perDay = 2
  if (/\b(thrice|three times|3 times|3x|tds|tid)\b/.test(f)) perDay = 3
  if (/\b(four times|4 times|4x|qds|qid)\b/.test(f)) perDay = 4

  if (slots.length > 0) {
    return { slots, weekly: false, asNeeded: false, perDay: Math.max(perDay, slots.length) }
  }

  // No explicit time — spread the per-day count across sensible default slots.
  const defaults: Record<number, Slot[]> = {
    1: ['morning'],
    2: ['morning', 'night'],
    3: ['morning', 'afternoon', 'night'],
    4: ['morning', 'afternoon', 'evening', 'night'],
  }
  const n = perDay || 1
  return { slots: defaults[n] ?? ['morning'], weekly: false, asNeeded: false, perDay: n }
}
