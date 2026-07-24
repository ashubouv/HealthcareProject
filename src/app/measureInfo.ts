import type { RangeEval } from './refRanges'

/* ============================================================
   Plain-language descriptions of what each lab test measures, so
   the trend screen can show a note that matches the SPECIFIC test
   the user is looking at (instead of the whole document's summary,
   which often talks about other results). Keyword-matched on the
   lowercased test name; the longest matching keyword wins.
   ============================================================ */

interface MeasureInfo {
  match: string[]
  text: string // what the test is / why it matters
}

const INFOS: MeasureInfo[] = [
  { match: ['hemoglobin', 'haemoglobin', 'hgb'], text: 'Haemoglobin is the protein in red blood cells that carries oxygen around the body. Low levels can mean anaemia.' },
  { match: ['hematocrit', 'haematocrit', 'pcv'], text: 'Haematocrit is the share of your blood made up of red blood cells.' },
  { match: ['rbc', 'red blood'], text: 'The red blood cell count reflects how many oxygen-carrying cells are in your blood.' },
  { match: ['wbc', 'white blood', 'leucocyte', 'leukocyte', 'total count', 'tlc'], text: 'White blood cells fight infection. A high count can signal infection or inflammation; a low count can affect immunity.' },
  { match: ['platelet', 'plt'], text: 'Platelets help your blood clot. Very low or high levels can affect bleeding and clotting.' },
  { match: ['neutrophil'], text: 'Neutrophils are white cells that respond first to bacterial infection.' },
  { match: ['lymphocyte'], text: 'Lymphocytes are white cells central to your immune response, including to viruses.' },
  { match: ['sodium'], text: 'Sodium is an electrolyte that balances fluid and supports nerve and muscle function.' },
  { match: ['potassium'], text: 'Potassium is an electrolyte important for heart rhythm and muscle function.' },
  { match: ['chloride'], text: 'Chloride is an electrolyte that helps keep your body’s fluids and acid balance in check.' },
  { match: ['bicarbonate'], text: 'Bicarbonate reflects the acid–base balance of your blood.' },
  { match: ['creatinine'], text: 'Creatinine is a waste product filtered by the kidneys — it’s a key marker of kidney function.' },
  { match: ['urea', 'bun'], text: 'Urea (BUN) is a waste product that shows how well your kidneys are clearing your blood.' },
  { match: ['uric acid'], text: 'Uric acid can build up and cause gout or kidney stones when high.' },
  { match: ['egfr'], text: 'eGFR estimates how well your kidneys filter — lower numbers mean reduced kidney function.' },
  { match: ['total cholesterol', 'cholesterol'], text: 'Cholesterol is a fat in your blood. High levels raise the risk of heart disease over time.' },
  { match: ['ldl'], text: 'LDL is the “bad” cholesterol that can build up in arteries.' },
  { match: ['hdl'], text: 'HDL is the “good” cholesterol that helps clear fat from your blood — higher is better.' },
  { match: ['triglyceride'], text: 'Triglycerides are a type of fat in the blood; high levels are linked to heart risk.' },
  { match: ['hba1c', 'a1c'], text: 'HbA1c reflects your average blood sugar over the last 2–3 months — a key diabetes marker.' },
  { match: ['glucose', 'blood sugar'], text: 'Blood glucose is your blood sugar level at the time of the test.' },
  { match: ['alt', 'sgpt'], text: 'ALT is a liver enzyme; raised levels can indicate liver stress or damage.' },
  { match: ['ast', 'sgot'], text: 'AST is an enzyme from the liver and muscles; raised levels can indicate liver or muscle stress.' },
  { match: ['alkaline phosphatase', 'alp'], text: 'Alkaline phosphatase is an enzyme linked to the liver and bones.' },
  { match: ['bilirubin'], text: 'Bilirubin is a breakdown product of red blood cells processed by the liver; high levels can cause jaundice.' },
  { match: ['albumin'], text: 'Albumin is a protein made by the liver that helps keep fluid in your blood vessels.' },
  { match: ['calcium'], text: 'Calcium supports bones, nerves and muscles. Levels are tightly controlled by the body.' },
  { match: ['phosphorus', 'phosphate'], text: 'Phosphorus works with calcium to build bones and is handled by the kidneys.' },
  { match: ['magnesium'], text: 'Magnesium supports muscle, nerve and heart function.' },
  { match: ['ferritin'], text: 'Ferritin reflects your body’s iron stores. Low ferritin is an early sign of iron deficiency.' },
  { match: ['iron'], text: 'Serum iron measures the iron circulating in your blood.' },
  { match: ['vitamin d', '25-hydroxy'], text: 'Vitamin D supports bone health and immunity. Low levels are common, especially in older adults.' },
  { match: ['vitamin b12', 'b12'], text: 'Vitamin B12 is needed for nerve function and making red blood cells.' },
  { match: ['folate', 'folic acid'], text: 'Folate is a B vitamin needed to make healthy red blood cells.' },
  { match: ['tsh'], text: 'TSH is the main screening test for thyroid function — high can mean an underactive thyroid, low an overactive one.' },
  { match: ['t4', 't3'], text: 'This thyroid hormone helps show how active your thyroid gland is.' },
  { match: ['crp', 'c-reactive'], text: 'CRP is a marker of inflammation anywhere in the body.' },
  { match: ['esr', 'sedimentation'], text: 'ESR is a general marker of inflammation.' },
  { match: ['psa'], text: 'PSA is a prostate marker; raised levels can prompt further prostate checks.' },
  { match: ['ldh', 'lactate dehydrogenase'], text: 'LDH is an enzyme found in many tissues; raised levels are a general sign of tissue stress.' },
  { match: ['systolic', 'diastolic', 'blood pressure'], text: 'Blood pressure measures the force of blood against your artery walls.' },
]

function findInfo(name: string): string | null {
  const n = name.toLowerCase()
  let best: string | null = null
  let bestLen = 0
  for (const info of INFOS) {
    for (const m of info.match) {
      if (n.includes(m) && m.length > bestLen) {
        best = info.text
        bestLen = m.length
      }
    }
  }
  return best
}

/**
 * A description that matches the specific measure: what the test is, plus a
 * sentence about where the latest value sits relative to the normal range.
 * Returns null only when we know nothing useful about this test.
 */
export function describeMeasure(name: string, value: string, range: RangeEval | null): string | null {
  const what = findInfo(name)
  let status: string | null = null
  if (range?.status === 'above') status = `Your latest reading of ${value} is above the normal range (${range.label.replace(/^.*?: /, '')}).`
  else if (range?.status === 'below') status = `Your latest reading of ${value} is below the normal range (${range.label.replace(/^.*?: /, '')}).`
  else if (range?.status === 'in') status = `Your latest reading of ${value} is within the normal range.`

  if (what && status) return `${what} ${status}`
  return what ?? status
}
