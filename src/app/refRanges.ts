/* ============================================================
   Reference ranges for common lab tests — general adult guidance
   used to show a target line and derive a status when the document
   itself didn't flag the value. NOT a diagnosis; clinical ranges
   vary by lab, age, sex, and context.
   ============================================================ */

export interface RefRange {
  match: string[] // lowercased substrings; a test matches if its name includes one
  low?: number
  high?: number
  unit?: string
}

// Longer match strings win when several ranges match (see findRange).
const RANGES: RefRange[] = [
  // Lipids
  { match: ['total cholesterol'], high: 200, unit: 'mg/dL' },
  { match: ['ldl'], high: 100, unit: 'mg/dL' },
  { match: ['hdl'], low: 40, unit: 'mg/dL' },
  { match: ['triglyceride'], high: 150, unit: 'mg/dL' },
  { match: ['vldl'], high: 30, unit: 'mg/dL' },
  // Blood sugar
  { match: ['hba1c', 'a1c'], high: 5.7, unit: '%' },
  { match: ['fasting glucose', 'fasting blood sugar', 'glucose'], low: 70, high: 99, unit: 'mg/dL' },
  // Blood count (CBC)
  { match: ['hemoglobin', 'haemoglobin', 'hgb'], low: 12, high: 17.5, unit: 'g/dL' },
  { match: ['hematocrit', 'haematocrit', 'pcv'], low: 36, high: 50, unit: '%' },
  { match: ['rbc', 'red blood'], low: 4.2, high: 5.9, unit: 'x10^6/µL' },
  { match: ['wbc', 'white blood', 'total leucocyte', 'total leukocyte', 'tlc'], low: 4, high: 11, unit: 'x10^3/µL' },
  { match: ['platelet', 'plt'], low: 150, high: 400, unit: 'x10^3/µL' },
  { match: ['mcv'], low: 80, high: 100, unit: 'fL' },
  { match: ['mchc'], low: 32, high: 36, unit: 'g/dL' },
  { match: ['mch'], low: 27, high: 33, unit: 'pg' },
  { match: ['rdw'], low: 11.5, high: 14.5, unit: '%' },
  { match: ['neutrophil'], low: 40, high: 75, unit: '%' },
  { match: ['lymphocyte'], low: 20, high: 45, unit: '%' },
  { match: ['monocyte'], low: 2, high: 10, unit: '%' },
  { match: ['eosinophil'], low: 1, high: 6, unit: '%' },
  { match: ['basophil'], low: 0, high: 2, unit: '%' },
  // Electrolytes
  { match: ['sodium'], low: 135, high: 145, unit: 'mmol/L' },
  { match: ['potassium'], low: 3.5, high: 5.1, unit: 'mmol/L' },
  { match: ['chloride'], low: 98, high: 107, unit: 'mmol/L' },
  { match: ['bicarbonate'], low: 22, high: 29, unit: 'mmol/L' },
  // Kidney
  { match: ['creatinine'], low: 0.7, high: 1.3, unit: 'mg/dL' },
  { match: ['urea'], low: 15, high: 45, unit: 'mg/dL' },
  { match: ['bun'], low: 7, high: 20, unit: 'mg/dL' },
  { match: ['uric acid'], low: 3.5, high: 7.2, unit: 'mg/dL' },
  { match: ['egfr'], low: 90, unit: 'mL/min' },
  // Liver
  { match: ['alt', 'sgpt'], low: 7, high: 56, unit: 'U/L' },
  { match: ['ast', 'sgot'], low: 10, high: 40, unit: 'U/L' },
  { match: ['alkaline phosphatase', 'alp'], low: 44, high: 147, unit: 'U/L' },
  { match: ['ggt', 'gamma-gt'], low: 8, high: 61, unit: 'U/L' },
  { match: ['total bilirubin', 'bilirubin'], low: 0.1, high: 1.2, unit: 'mg/dL' },
  { match: ['albumin'], low: 3.5, high: 5.0, unit: 'g/dL' },
  { match: ['total protein'], low: 6.0, high: 8.3, unit: 'g/dL' },
  // Bone & minerals
  { match: ['calcium'], low: 8.6, high: 10.2, unit: 'mg/dL' },
  { match: ['phosphorus', 'phosphate'], low: 2.5, high: 4.5, unit: 'mg/dL' },
  { match: ['magnesium'], low: 1.7, high: 2.2, unit: 'mg/dL' },
  // Iron
  { match: ['ferritin'], low: 30, high: 400, unit: 'ng/mL' },
  { match: ['serum iron', 'iron'], low: 60, high: 170, unit: 'µg/dL' },
  { match: ['tibc'], low: 250, high: 450, unit: 'µg/dL' },
  // Vitamins & thyroid
  { match: ['vitamin d', '25-hydroxy'], low: 20, high: 50, unit: 'ng/mL' },
  { match: ['vitamin b12', 'b12'], low: 200, high: 900, unit: 'pg/mL' },
  { match: ['folate', 'folic acid'], low: 3, high: 17, unit: 'ng/mL' },
  { match: ['tsh'], low: 0.4, high: 4.0, unit: 'mIU/L' },
  { match: ['free t4', 'ft4'], low: 0.8, high: 1.8, unit: 'ng/dL' },
  { match: ['free t3', 'ft3'], low: 2.3, high: 4.2, unit: 'pg/mL' },
  // Inflammation & other
  { match: ['crp', 'c-reactive'], high: 3, unit: 'mg/L' },
  { match: ['esr', 'erythrocyte sedimentation'], high: 20, unit: 'mm/hr' },
  { match: ['psa', 'prostate-specific'], high: 4, unit: 'ng/mL' },
  { match: ['ldh', 'lactate dehydrogenase'], low: 140, high: 280, unit: 'U/L' },
  // Blood pressure
  { match: ['systolic'], high: 120, unit: 'mmHg' },
  { match: ['diastolic'], high: 80, unit: 'mmHg' },
]

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export type RangeStatus = 'in' | 'above' | 'below'

export interface RangeEval {
  label: string // e.g. "Target: under 200 mg/dL" / "Healthy range: 12–17.5 g/dL"
  status?: RangeStatus // undefined when the value isn't numeric
  statusLabel?: string // "Above target" / "Below range" / "In range"
  shortLabel?: string // compact "High" / "Low" / "Normal" tag
  tone: 'alert' | 'good' | 'neutral'
}

export function findRange(testName: string): RefRange | null {
  const n = testName.toLowerCase()
  let best: RefRange | null = null
  let bestLen = 0
  for (const r of RANGES) {
    for (const m of r.match) {
      if (n.includes(m) && m.length > bestLen) {
        best = r
        bestLen = m.length
      }
    }
  }
  return best
}

function rangeLabel(r: RefRange): string {
  const u = r.unit ? ` ${r.unit}` : ''
  if (r.low != null && r.high != null) return `Healthy range: ${fmt(r.low)}–${fmt(r.high)}${u}`
  if (r.high != null) return `Target: under ${fmt(r.high)}${u}`
  if (r.low != null) return `Target: over ${fmt(r.low)}${u}`
  return ''
}

/** Evaluate a value against the known range for a test, or null if unknown. */
export function evaluateRange(testName: string, num: number | null): RangeEval | null {
  const range = findRange(testName)
  if (!range) return null
  const label = rangeLabel(range)
  if (num == null) return { label, tone: 'neutral' }
  let status: RangeStatus = 'in'
  if (range.high != null && num > range.high) status = 'above'
  else if (range.low != null && num < range.low) status = 'below'
  const statusLabel = status === 'above' ? 'Above target' : status === 'below' ? 'Below range' : 'In range'
  const shortLabel = status === 'above' ? 'High' : status === 'below' ? 'Low' : 'Normal'
  const tone = status === 'in' ? 'good' : 'alert'
  return { label, status, statusLabel, shortLabel, tone }
}
