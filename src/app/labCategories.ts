import type { LabGroup } from './derive'

/* ============================================================
   Group lab measures into clinical categories so a long panel
   stays digestible. Coverage targets the tests older adults
   commonly get. Matching is keyword-based on the (lowercased)
   test name; the longest matching keyword wins, and anything
   unrecognised falls into "Other".
   ============================================================ */

export interface LabCategory {
  key: string
  label: string
  match: string[]
}

// Clinical display order. Keep keywords assigned to a single best category.
const CATEGORIES: LabCategory[] = [
  {
    key: 'cardiac',
    label: 'Heart & cardiac',
    match: ['troponin', 'nt-probnp', 'ntprobnp', 'pro-bnp', 'probnp', 'bnp', 'ck-mb', 'ckmb', 'creatine kinase', 'homocysteine', 'lipoprotein(a)', 'lp(a)', 'hs-crp', 'hscrp', 'high-sensitivity crp', 'high sensitivity crp'],
  },
  {
    key: 'lipids',
    label: 'Lipids & cholesterol',
    match: ['cholesterol', 'ldl', 'hdl', 'triglyceride', 'non-hdl', 'vldl', 'apolipoprotein', 'apo-b', 'apo b', 'apo-a', 'apo a', 'lipid'],
  },
  {
    key: 'sugar',
    label: 'Blood sugar',
    match: ['glucose', 'hba1c', 'a1c', 'blood sugar', 'fructosamine', 'insulin', 'c-peptide', 'ogtt'],
  },
  {
    key: 'kidney',
    label: 'Kidney (renal)',
    match: ['creatinine', 'urea', 'bun', 'egfr', 'uric acid', 'cystatin', 'microalbumin', 'micro-albumin', 'albumin/creatinine', 'albumin creatinine'],
  },
  {
    key: 'liver',
    label: 'Liver (hepatic)',
    match: ['alt', 'ast', 'alp', 'alkaline phosphatase', 'ggt', 'gamma-gt', 'bilirubin', 'albumin', 'total protein', 'globulin', 'sgpt', 'sgot', 'transaminase', 'aminotransferase'],
  },
  {
    key: 'thyroid',
    label: 'Thyroid',
    match: ['tsh', 'thyroid', 'thyroxine', 'triiodothyronine', 'anti-tpo', 'antitpo', 'thyroglobulin', 'ft3', 'ft4', 'free t3', 'free t4', 't3', 't4'],
  },
  {
    key: 'cbc',
    label: 'Blood count',
    match: ['hemoglobin', 'haemoglobin', 'hgb', 'hematocrit', 'haematocrit', 'hct', 'pcv', 'rbc', 'wbc', 'tlc', 'leucocyte', 'leukocyte', 'white blood', 'red blood', 'platelet', 'plt', 'mcv', 'mchc', 'mch', 'rdw', 'neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil', 'granulocyte', 'nucleated', 'reticulocyte'],
  },
  {
    key: 'iron',
    label: 'Iron studies',
    match: ['ferritin', 'iron', 'tibc', 'uibc', 'transferrin', 'iron saturation'],
  },
  {
    key: 'electrolytes',
    label: 'Electrolytes',
    match: ['sodium', 'potassium', 'chloride', 'bicarbonate', 'serum electrolyte'],
  },
  {
    key: 'bone',
    label: 'Bone & minerals',
    match: ['calcium', 'phosphorus', 'phosphate', 'magnesium', 'vitamin d', '25-hydroxy', '25 hydroxy', 'parathyroid', 'pth', 'bone density', 'dexa'],
  },
  {
    key: 'vitamins',
    label: 'Vitamins',
    match: ['vitamin b12', 'b12', 'folate', 'folic acid', 'vitamin b', 'vitamin a', 'vitamin e', 'vitamin k', 'vitamin c', 'ascorbic'],
  },
  {
    key: 'inflammation',
    label: 'Inflammation & immunity',
    match: ['crp', 'c-reactive', 'esr', 'sed rate', 'erythrocyte sedimentation', 'rheumatoid', 'ra factor', 'anti-nuclear', 'antinuclear', 'procalcitonin', 'complement'],
  },
  {
    key: 'prostate',
    label: 'Prostate (PSA)',
    match: ['psa', 'prostate-specific', 'prostate specific'],
  },
  {
    key: 'coagulation',
    label: 'Coagulation',
    match: ['prothrombin', 'inr', 'aptt', 'ptt', 'd-dimer', 'fibrinogen', 'clotting', 'coagulation'],
  },
  {
    key: 'hormones',
    label: 'Hormones',
    match: ['testosterone', 'estradiol', 'estrogen', 'cortisol', 'dhea', 'prolactin', 'fsh', 'luteinizing', 'progesterone'],
  },
  {
    key: 'urine',
    label: 'Urine',
    match: ['urine', 'urinalysis', 'specific gravity', 'urobilinogen', 'ketone', 'nitrite', 'pus cell', 'epithelial'],
  },
  {
    key: 'tumor',
    label: 'Tumour markers',
    match: ['cea', 'ca-125', 'ca 125', 'ca-19', 'ca 19-9', 'ca-15-3', 'ca 15-3', 'afp', 'alpha-fetoprotein', 'beta-hcg', 'tumor marker', 'tumour marker'],
  },
  {
    key: 'bp',
    label: 'Blood pressure',
    match: ['systolic', 'diastolic', 'blood pressure'],
  },
]
const OTHER: LabCategory = { key: 'other', label: 'Other', match: [] }

export function categoryOf(name: string): LabCategory {
  const n = name.toLowerCase()
  let best = OTHER
  let bestLen = 0
  for (const c of CATEGORIES) {
    for (const m of c.match) {
      if (n.includes(m) && m.length > bestLen) {
        best = c
        bestLen = m.length
      }
    }
  }
  return best
}

export interface CategoryGroup {
  key: string
  label: string
  items: LabGroup[]
}

/** Bucket measures into categories, in clinical display order, skipping empties. */
export function groupByCategory(groups: LabGroup[]): CategoryGroup[] {
  const map = new Map<string, LabGroup[]>()
  for (const g of groups) {
    const c = categoryOf(g.name)
    const list = map.get(c.key) ?? []
    list.push(g)
    map.set(c.key, list)
  }
  return [...CATEGORIES, OTHER]
    .filter((c) => map.has(c.key))
    .map((c) => ({ key: c.key, label: c.label, items: map.get(c.key)! }))
}

/* ---- Broader "kind of doctor" (specialty) grouping over the categories ---- */

interface Specialty {
  key: string
  label: string
  sub: string // the kind of doctor
  cats: string[]
}

const SPECIALTIES: Specialty[] = [
  { key: 'cardiology', label: 'Heart & circulation', sub: 'Cardiologist', cats: ['cardiac', 'lipids', 'bp'] },
  { key: 'endocrine', label: 'Diabetes & hormones', sub: 'Endocrinologist', cats: ['sugar', 'thyroid', 'hormones'] },
  { key: 'nephrology', label: 'Kidney & fluids', sub: 'Nephrologist', cats: ['kidney', 'electrolytes'] },
  { key: 'gastro', label: 'Liver & digestion', sub: 'Gastroenterologist', cats: ['liver'] },
  { key: 'hematology', label: 'Blood', sub: 'Haematologist', cats: ['cbc', 'iron', 'coagulation'] },
  { key: 'bonevit', label: 'Bone & vitamins', sub: 'Bone health', cats: ['bone', 'vitamins'] },
  { key: 'immunology', label: 'Inflammation & immunity', sub: 'Rheumatologist', cats: ['inflammation'] },
  { key: 'urology', label: 'Urine & prostate', sub: 'Urologist', cats: ['prostate', 'urine'] },
  { key: 'oncology', label: 'Cancer markers', sub: 'Oncologist', cats: ['tumor'] },
]
const SPEC_OTHER: Specialty = { key: 'other', label: 'Other tests', sub: 'General', cats: ['other'] }

const CAT_TO_SPEC = new Map<string, string>()
for (const s of SPECIALTIES) for (const c of s.cats) CAT_TO_SPEC.set(c, s.key)

export interface SpecialtyGroup {
  key: string
  label: string
  sub: string
  items: LabGroup[]
}

/** Bucket measures by kind of doctor (specialty), in display order, skipping empties. */
export function groupBySpecialty(groups: LabGroup[]): SpecialtyGroup[] {
  const map = new Map<string, LabGroup[]>()
  for (const g of groups) {
    const catKey = categoryOf(g.name).key
    const specKey = CAT_TO_SPEC.get(catKey) ?? 'other'
    const list = map.get(specKey) ?? []
    list.push(g)
    map.set(specKey, list)
  }
  return [...SPECIALTIES, SPEC_OTHER]
    .filter((s) => map.has(s.key))
    .map((s) => ({ key: s.key, label: s.label, sub: s.sub, items: map.get(s.key)! }))
}
