import type { LabMetric, RecordId } from './types'

export interface HistMed {
  name: string
  detail: string
  by: string
}
export interface HistLab {
  name: string
  date: string
  result: string
  rec: RecordId | null
}
export interface HistVisit {
  place: string
  dept: string
  date: string
  badge: string
  rec: RecordId | null
}
export interface ConditionHistory {
  cond: string
  condSub: string
  overview: string
  stats: { k: string; v: string }[]
  meds: HistMed[]
  labs: HistLab[]
  visits: HistVisit[]
}

export const HISTORY: Record<LabMetric, ConditionHistory> = {
  chol: {
    cond: 'High cholesterol',
    condSub: 'Dyslipidemia · managed by Dr. Rao',
    overview:
      'Flagged in March 2026 and trending upward. Managed with a statin plus diet and exercise under Cardiology.',
    stats: [
      { k: 'First flagged', v: 'Mar 2026' },
      { k: 'Latest', v: '210 mg/dL' },
      { k: 'Readings', v: '5' },
    ],
    meds: [{ name: 'Atorvastatin 10mg', detail: '1× daily · night', by: 'Dr. Rao · since May 2026' }],
    labs: [
      { name: 'Lipid profile', date: '18 Jun 2026', result: '210 ↑', rec: 'lipid' },
      { name: 'Lipid profile', date: '02 May 2026', result: '196', rec: null },
    ],
    visits: [
      { place: 'Apollo Hospital', dept: 'Cardiology · Dr. Rao', date: '18 Jun', badge: 'Follow-up', rec: null },
      { place: 'Apollo Hospital', dept: 'Cardiology · Dr. Rao', date: '12 Jun', badge: 'Prescription', rec: 'rx' },
    ],
  },
  bp: {
    cond: 'High blood pressure',
    condSub: 'Hypertension · managed by Dr. Rao',
    overview:
      'A long-standing condition, still above target despite medication. Under ongoing Cardiology review.',
    stats: [
      { k: 'First flagged', v: '2023' },
      { k: 'Latest', v: '148/92' },
      { k: 'Status', v: 'High' },
    ],
    meds: [
      { name: 'Amlodipine 5mg', detail: '1× daily · morning', by: 'Dr. Rao · since Mar 2026' },
      { name: 'Telmisartan 40mg', detail: 'Stopped · replaced by Amlodipine', by: 'Dr. Rao · Jan–Mar 2026' },
    ],
    labs: [
      { name: 'BP reading', date: '18 Jun 2026', result: '148/92 ↑', rec: null },
      { name: 'Renal function panel', date: '02 May 2026', result: 'Normal', rec: null },
    ],
    visits: [
      { place: 'City Hospital', dept: 'Cardiac admission · Dr. Menon', date: '26–28 May', badge: 'Discharge', rec: 'ecg' },
      { place: 'Apollo Hospital', dept: 'Cardiology · Dr. Rao', date: '18 Jun', badge: 'Follow-up', rec: null },
    ],
  },
  sugar: {
    cond: 'Type 2 diabetes',
    condSub: 'Managed by Dr. Iyer, Endocrinology',
    overview:
      'Diagnosed in 2025. Well controlled and steadily improving with medication and lifestyle changes.',
    stats: [
      { k: 'Diagnosed', v: 'Jan 2025' },
      { k: 'Latest HbA1c', v: '7.1%' },
      { k: 'Status', v: 'Improving' },
    ],
    meds: [{ name: 'Metformin 500mg', detail: '2× daily', by: 'Dr. Iyer · since Jan 2025' }],
    labs: [
      { name: 'HbA1c', date: '12 Jun 2026', result: '7.1% ↓', rec: null },
      { name: 'HbA1c', date: '08 Mar 2026', result: '7.8%', rec: null },
      { name: 'Fasting glucose', date: '05 Jun 2026', result: '112', rec: null },
    ],
    visits: [
      { place: 'Apollo Hospital', dept: 'Endocrinology · Dr. Iyer', date: '12 Jun', badge: 'Review', rec: null },
    ],
  },
}
