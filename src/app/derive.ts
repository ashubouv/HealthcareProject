import type { Extracted, RecordRow } from '../api/client'

export const KIND_LABEL: Record<string, string> = {
  lab_report: 'Lab report',
  prescription: 'Prescription',
  discharge_summary: 'Discharge',
  scan: 'Scan',
  other: 'Document',
}

/** One uniform date style everywhere: DD-MM-YYYY. */
export function fmtDMY(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

/** A record's display date in DD-MM-YYYY (its own date, else when it was added). */
export function displayDate(r: RecordRow): string {
  const t = recordTime(r)
  return t ? fmtDMY(t) : (r.date ?? '')
}

export function recordSubtitle(r: RecordRow): string {
  return [r.doctor, r.hospital, displayDate(r) || null].filter(Boolean).join(' · ') || 'Saved record'
}

/** One appearance of a medication on a specific document. */
export interface MedOccurrence {
  dose: string | null
  frequency: string | null
  date: string // display date of the record
  time: number // sortable
  recordId: string
  source: string | null // record title it came from
}
export interface MedRow {
  name: string
  dose: string | null // most recent dose
  frequency: string | null // most recent frequency
  source: string | null // most recent record title
  recordId: string | null // most recent record (to link back to)
  date: string | null // most recent date it was seen
  occurrences: MedOccurrence[] // every appearance, newest first
}

/**
 * All medications across records, de-duplicated by name. Records are visited
 * newest-first (by the document's own date) so each medicine keeps its LATEST
 * dose, frequency, date and source, while every appearance is retained in
 * `occurrences` so history and links to each prescription are available.
 */
export function deriveMeds(records: RecordRow[]): MedRow[] {
  const map = new Map<string, MedRow>()
  // Visit freshest-first, where an EDIT counts as freshness: a prescription the
  // user just corrected must win over an older upload of the same medicine,
  // even if the edited document itself carries an older date.
  const freshness = (r: RecordRow) =>
    Math.max(recordTime(r), r.updatedAt ? Date.parse(r.updatedAt) || 0 : 0)
  const ordered = [...records].sort((a, b) => freshness(b) - freshness(a))
  for (const r of ordered) {
    for (const m of r.extracted?.medications ?? []) {
      const name = m.name.trim()
      if (!name) continue
      const key = name.toLowerCase()
      const occ: MedOccurrence = {
        dose: m.dose,
        frequency: m.frequency,
        date: displayDate(r),
        time: recordTime(r),
        recordId: r.id,
        source: r.title,
      }
      const existing = map.get(key)
      if (!existing) {
        // First (newest) time we see this medicine sets the "current" values.
        map.set(key, {
          name,
          dose: m.dose,
          frequency: m.frequency,
          source: r.title,
          recordId: r.id,
          date: occ.date,
          occurrences: [occ],
        })
      } else {
        existing.occurrences.push(occ)
      }
    }
  }
  return [...map.values()]
}

export interface ReadingRow {
  value: string
  unit: string | null
  flag: string | null
  date: string
  time: number // sortable timestamp for the reading (test date, or added time)
  num: number | null // leading numeric value, for charting
  recordId: string
}
export interface LabGroup {
  name: string
  latest: ReadingRow
  readings: ReadingRow[] // newest first
  tone: 'alert' | 'good' | 'neutral'
}

/** Pull the first number out of a free-text value ("7.1%", "210 mg/dL" → 7.1, 210). */
function parseNumeric(value: string): number | null {
  const m = value.match(/-?\d+(?:\.\d+)?/)
  if (!m) return null
  const n = parseFloat(m[0])
  return Number.isNaN(n) ? null : n
}

/**
 * Different names for the SAME test, mapped to one canonical key so their
 * readings merge into a single trend. Applied after spelling normalisation,
 * so only the American-spelling singular forms need listing.
 */
const TEST_SYNONYMS: Record<string, string> = {
  // blood count
  hb: 'hemoglobin',
  hgb: 'hemoglobin',
  pcv: 'hematocrit',
  'packed cell volume': 'hematocrit',
  hct: 'hematocrit',
  platelet: 'platelet count',
  plt: 'platelet count',
  tlc: 'total leukocyte count',
  wbc: 'total leukocyte count',
  'wbc count': 'total leukocyte count',
  'total wbc count': 'total leukocyte count',
  'white blood cell count': 'total leukocyte count',
  'white blood cell': 'total leukocyte count',
  'total count': 'total leukocyte count',
  rbc: 'rbc count',
  'red blood cell count': 'rbc count',
  'red blood cell': 'rbc count',
  'mean corpuscular volume': 'mcv',
  'mean cell volume': 'mcv',
  'mean corpuscular hemoglobin': 'mch',
  'mean cell hemoglobin': 'mch',
  'mean corpuscular hemoglobin concentration': 'mchc',
  'mean cell hemoglobin concentration': 'mchc',
  'hemoglobin a1c': 'hba1c',
  'red cell distribution width': 'rdw',
  'rdw-cv': 'rdw',
  'rdw cv': 'rdw',
  // liver
  sgpt: 'alt',
  sgot: 'ast',
  'alanine aminotransferase': 'alt',
  'aspartate aminotransferase': 'ast',
  'alkaline phosphatase': 'alp',
  'gamma glutamyl transferase': 'ggt',
  'gamma gt': 'ggt',
  'total bilirubin': 'bilirubin',
  // kidney
  'blood urea nitrogen': 'bun',
  'urea nitrogen': 'bun', // after the "blood" specimen-prefix strip
  'sugar fasting': 'fasting glucose',
  'sugar random': 'rbs',
  // sugar
  'fasting blood sugar': 'fasting glucose',
  'fasting plasma glucose': 'fasting glucose',
  'blood sugar fasting': 'fasting glucose',
  'glucose fasting': 'fasting glucose',
  fbs: 'fasting glucose',
  'random blood sugar': 'rbs',
  'blood sugar random': 'rbs',
  'glucose random': 'rbs',
  'post prandial blood sugar': 'ppbs',
  'postprandial blood sugar': 'ppbs',
  'pp blood sugar': 'ppbs',
  'glycated hemoglobin': 'hba1c',
  'glycosylated hemoglobin': 'hba1c',
  a1c: 'hba1c',
  'hb a1c': 'hba1c',
  // lipids
  tg: 'triglyceride',
  'ldl cholesterol': 'ldl',
  'hdl cholesterol': 'hdl',
  'vldl cholesterol': 'vldl',
  'low density lipoprotein': 'ldl',
  'high density lipoprotein': 'hdl',
  // thyroid
  'thyroid stimulating hormone': 'tsh',
  triiodothyronine: 't3',
  thyroxine: 't4',
  ft3: 'free t3',
  ft4: 'free t4',
  'free triiodothyronine': 'free t3',
  'free thyroxine': 'free t4',
  // vitamins
  'vitamin d total': 'vitamin d',
  '25-hydroxy vitamin d': 'vitamin d',
  '25 hydroxy vitamin d': 'vitamin d',
  '25-oh vitamin d': 'vitamin d',
  '25 oh vitamin d': 'vitamin d',
  cyanocobalamin: 'vitamin b12',
  // inflammation & misc
  'erythrocyte sedimentation rate': 'esr',
  'c-reactive protein': 'crp',
  'c reactive protein': 'crp',
  'lactate dehydrogenase': 'ldh',
  'l.d.h': 'ldh',
  'prostate specific antigen': 'psa',
}

/**
 * Canonical key for grouping the same test across documents even when the AI
 * labels it differently: case ("hemoglobin"), qualifiers ("Hemoglobin (Hb)"),
 * British vs American spelling ("Haemoglobin"/"Leucocyte"), plurals
 * ("Basophils"), and synonyms ("SGPT" = "ALT", "PCV" = "Haematocrit").
 */
function canonicalName(name: string): string {
  let c = name.toLowerCase().replace(/\./g, '') // "M.C.H.C." → "mchc", "S. Creatinine" → "s creatinine"
  // Parenthetical content is usually noise ("(Hb)", "(EDTA)"), but sometimes a
  // meaningful qualifier — "Glucose (Fasting)" — so hoist those before dropping.
  c = c.replace(/\((fasting|random|pp|post ?prandial)\)/g, ' $1 ')
  c = c
    .replace(/\(.*?\)/g, ' ') // drop remaining parenthetical qualifiers
    .replace(/[^a-z0-9%/+ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // British → American spelling: haemoglobin→hemoglobin, oestrogen→estrogen,
  // leucocyte→leukocyte.
  c = c.replace(/ae/g, 'e').replace(/oe/g, 'e').replace(/leuco/g, 'leuko')
  // Singular-ise longer words: "basophils"→"basophil", "platelets"→"platelet".
  c = c
    .split(' ')
    .map((w) => (w.length >= 5 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .join(' ')
  // Word-level abbreviations: "vit d"→"vitamin d", "vitamin d3"→"vitamin d",
  // "b 12"→"b12", and hb/hgb as words inside longer names ("Mean Corp Hb Conc").
  c = c
    .replace(/\bvit\b/g, 'vitamin')
    .replace(/\bb\s+(\d+)\b/g, 'b$1')
    .replace(/\bd3\b/g, 'd')
    .replace(/\b(hb|hgb)\b/g, 'hemoglobin')
  // Specimen prefixes carry no meaning: "S. Creatinine" / "Serum Creatinine" /
  // "Plasma Glucose" are the same test as the bare name. "Blood" is stripped
  // only before urea ("Blood Urea") so names like "Blood Sugar" stay intact.
  c = c
    .replace(/^(serum|plasma|sr|s)\s+/, '')
    .replace(/^blood\s+(?=urea)/, '')
    .replace(/\s+/g, ' ')
    .trim()
  c = TEST_SYNONYMS[c] ?? c
  return c || name.toLowerCase()
}

/** True when two words differ by exactly one edit (substitution/insert/delete). */
function oneEditApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  if (a === b) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  // skip the differing spot in the longer (or both, for a substitution)…
  const restA = a.length >= b.length ? a.slice(i + 1) : a.slice(i)
  const restB = b.length >= a.length ? b.slice(i + 1) : b.slice(i)
  return restA === restB
}

/**
 * Typo tolerance: canonical names that differ by ONE letter inside a longer
 * word are the same test misspelled ("hemotocrit" vs "hematocrit",
 * "cholestrol" vs "cholesterol") — lab reports and OCR produce these
 * constantly. Strictly limited so genuinely different tests never merge:
 * every other word must match exactly, the differing words must be 6+ letters,
 * and no digits (keeps Vitamin D/E, T3/T4, B1/B12, LDL/HDL apart).
 */
function sameTestFuzzy(a: string, b: string): boolean {
  const aw = a.split(' ')
  const bw = b.split(' ')

  // Rule 1 — acronym vs long form: "mchc" ↔ "mean corp hemoglobin conc"
  // (initials must line up exactly, 3–6 letters, no digits).
  const acronymMatch = (short: string[], long: string[]) =>
    short.length === 1 &&
    long.length >= 2 &&
    short[0].length === long.length &&
    short[0].length >= 3 &&
    short[0].length <= 6 &&
    !/\d/.test(short[0]) &&
    long.map((w) => w[0]).join('') === short[0]
  if (acronymMatch(aw, bw) || acronymMatch(bw, aw)) return true

  if (aw.length !== bw.length) return false

  // Rule 2 — shortened words: "mean corp hemoglobin conc" ↔
  // "mean corpuscular hemoglobin concentration". Every word must be equal or a
  // 3+-letter prefix of its counterpart; digits never fuzz (keeps T3/T4 apart).
  if (aw.length >= 2) {
    let shortened = false
    let allMatch = true
    for (let k = 0; k < aw.length; k++) {
      if (aw[k] === bw[k]) continue
      const x = aw[k]
      const y = bw[k]
      if (/\d/.test(x) || /\d/.test(y) || Math.min(x.length, y.length) < 3 || !(x.startsWith(y) || y.startsWith(x))) {
        allMatch = false
        break
      }
      shortened = true
    }
    if (allMatch && shortened) return true
  }

  // Rule 3 — a single-letter typo inside a longer word: "hemotocrit" ↔
  // "hematocrit". Every other word must match exactly.
  let fuzzyUsed = false
  for (let k = 0; k < aw.length; k++) {
    if (aw[k] === bw[k]) continue
    if (fuzzyUsed) return false
    if (aw[k].length < 6 || bw[k].length < 6) return false
    if (/\d/.test(aw[k]) || /\d/.test(bw[k])) return false
    if (!oneEditApart(aw[k], bw[k])) return false
    fuzzyUsed = true
  }
  return fuzzyUsed
}

/**
 * Pick the friendlier of two labels for a merged measure: a real word beats a
 * bare abbreviation ("Hemoglobin" over "Hb"), then shorter beats longer
 * ("Hemoglobin" over "Hemoglobin (Hb) — EDTA blood").
 */
function betterDisplayName(a: string, b: string): string {
  const aAbbr = a.trim().length <= 4
  const bAbbr = b.trim().length <= 4
  if (aAbbr !== bAbbr) return aAbbr ? b : a
  return b.length < a.length ? b : a
}

/** Lab values grouped by test (name-insensitive), each group's readings newest-first. */
export function deriveLabs(records: RecordRow[]): LabGroup[] {
  const groups = new Map<string, { display: string; rows: ReadingRow[] }>()
  for (const r of records) {
    for (const v of r.extracted?.values ?? []) {
      const key = canonicalName(v.name)
      const g = groups.get(key) ?? { display: v.name, rows: [] }
      g.display = betterDisplayName(g.display, v.name)
      g.rows.push({
        value: v.value,
        unit: v.unit,
        flag: v.flag,
        date: displayDate(r),
        time: recordTime(r),
        num: parseNumeric(v.value),
        recordId: r.id,
      })
      groups.set(key, g)
    }
  }
  // Fuzzy pass: fold near-identical canonical keys (one-letter misspellings)
  // into whichever variant has more readings.
  const keys = [...groups.keys()]
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i]
      const b = keys[j]
      if (!groups.has(a) || !groups.has(b)) continue
      if (!sameTestFuzzy(a, b)) continue
      const [keep, fold] = groups.get(a)!.rows.length >= groups.get(b)!.rows.length ? [a, b] : [b, a]
      const K = groups.get(keep)!
      const F = groups.get(fold)!
      K.rows.push(...F.rows)
      K.display = betterDisplayName(K.display, F.display)
      groups.delete(fold)
    }
  }

  return (
    [...groups.values()]
      .map(({ display, rows }) => {
        // Newest-first, and drop exact duplicate readings (same date + same value)
        // that come from re-uploading or re-listing the same result.
        const sorted = [...rows].sort((a, b) => b.time - a.time)
        const seen = new Set<string>()
        const readings = sorted.filter((r) => {
          const k = `${r.date}|${r.value}`
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        const latest = readings[0]
        return { name: display, latest, readings, tone: latest.flag ? 'alert' : 'neutral' } as LabGroup
      })
      // Most recently tested measures first, everywhere they are listed.
      .sort((a, b) => b.latest.time - a.latest.time)
  )
}

export interface ChartBar {
  height: number // 0–100 (% of chart)
  label: string // date
  value: string // compact numeric value shown on top of the bar
  num: number
  hot: boolean // the latest reading
}

/** Compact numeric label for a value string ("8.6 g/dL" → "8.6"). */
function shortValue(value: string, num: number): string {
  const m = value.match(/-?\d+(?:\.\d+)?/)
  return m ? m[0] : String(num)
}

/**
 * Build chart bars for a lab group: numeric readings in chronological order
 * (oldest → newest). Bar HEIGHTS are proportional to the actual value (measured
 * from a true zero baseline), so the relative sizes are honest — a small change
 * looks small, a big change looks big — instead of being stretched to fill the
 * axis. Returns [] only when there are no numeric readings to chart.
 */
export function labChartBars(group: LabGroup): ChartBar[] {
  const chrono = group.readings.filter((r) => r.num != null).sort((a, b) => a.time - b.time)
  if (chrono.length < 1) return []
  const nums = chrono.map((r) => r.num as number)
  const max = Math.max(...nums)
  const min = Math.min(...nums)

  return chrono.map((r, i) => {
    const n = r.num as number
    let height: number
    if (max > 0 && min >= 0) {
      // Honest, proportional-to-value bars (relative to the largest reading).
      height = Math.max(6, (n / max) * 100)
    } else {
      // Values that go negative can't use a zero baseline — pad a band instead.
      const span = max - min || 1
      height = 8 + ((n - min) / span) * 84
    }
    return {
      height,
      // Chart labels stay compact: DD-MM (the full DD-MM-YYYY is in the readings list).
      label: fmtDMY(r.time).slice(0, 5),
      value: shortValue(r.value, n),
      num: n,
      hot: i === chrono.length - 1,
    }
  })
}

/**
 * Best-effort timestamp (ms) for *when a record's test/visit occurred*, parsed
 * from its free-text `date`. Falls back to when the document was added if the
 * date is missing or unparseable, so every record still has a stable position.
 */
export function recordTime(r: RecordRow): number {
  if (r.date) {
    const t = Date.parse(r.date)
    if (!Number.isNaN(t)) return t
  }
  return Date.parse(r.createdAt) || 0
}

/** Records ordered chronologically by the document's own date, most recent first. */
export function sortByRecordDate(records: RecordRow[]): RecordRow[] {
  return [...records].sort((a, b) => recordTime(b) - recordTime(a))
}

/** Clean a raw test name for display: drop parenthetical qualifiers and tidy spacing. */
export function prettyName(name: string): string {
  const cleaned = name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || name
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  } catch {
    return iso
  }
}

export const TYPE_LABEL: Record<Extracted['documentType'], string> = {
  lab_report: 'Lab report',
  prescription: 'Prescription',
  discharge_summary: 'Discharge summary',
  scan: 'Scan',
  other: 'Document',
}
