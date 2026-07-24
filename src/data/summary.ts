import type { DoctorId, RecordId } from './types'

export interface DoctorReport {
  id: DoctorId
  initials: string
  name: string
  chipLabel: string
  role: string
  visitLabel: string
  note: string
  diagnosis: string[]
  meds: { k: string; v: string }[]
  labs: { k: string; v: string; tone?: 'alert' | 'good' }[]
  labsTitle: string
  attachment?: { title: string; meta: string; rec: RecordId }
  followUp: string
}

export const DOCTORS: DoctorReport[] = [
  {
    id: 'rao',
    initials: 'VR',
    name: 'Dr. Vikram Rao',
    chipLabel: 'Dr. Rao · Cardiology',
    role: 'Cardiology · Apollo Hospital',
    visitLabel: 'Last visit · 18 Jun 2026',
    note: 'BP still elevated at 148/92 despite Amlodipine. Lipids trending down but LDL remains high. Continue current regimen, recheck in 6 weeks. No chest pain or breathlessness reported.',
    diagnosis: ['Hypertension', 'Dyslipidemia'],
    meds: [
      { k: 'Amlodipine 5mg', v: '1× morning' },
      { k: 'Atorvastatin 10mg', v: '1× night' },
    ],
    labsTitle: 'Labs ordered',
    labs: [
      { k: 'Total cholesterol', v: '210 mg/dL', tone: 'alert' },
      { k: 'LDL', v: '138 mg/dL', tone: 'alert' },
      { k: 'Blood pressure', v: '148/92', tone: 'alert' },
    ],
    attachment: { title: 'Lipid profile · report', meta: '18 Jun · 2 pages', rec: 'lipid' },
    followUp: 'Recheck BP & lipids in 6 weeks · 30 Jul 2026',
  },
  {
    id: 'iyer',
    initials: 'SI',
    name: 'Dr. Sunita Iyer',
    chipLabel: 'Dr. Iyer · Endocrine',
    role: 'Endocrinology · Apollo Hospital',
    visitLabel: 'Last visit · 12 Jun 2026',
    note: 'HbA1c improved to 7.1% from 7.8%. Continue Metformin; reinforce diet and daily walking. Fasting glucose well controlled. Watch for interaction flagged with cardiology meds.',
    diagnosis: ['Diabetes T2'],
    meds: [{ k: 'Metformin 500mg', v: '2× daily' }],
    labsTitle: 'Labs ordered',
    labs: [
      { k: 'HbA1c', v: '7.1%', tone: 'good' },
      { k: 'Fasting glucose', v: '112 mg/dL' },
    ],
    followUp: 'Repeat HbA1c in 3 months · 12 Sep 2026',
  },
  {
    id: 'menon',
    initials: 'AM',
    name: 'Dr. Arjun Menon',
    chipLabel: 'Dr. Menon · Physician',
    role: 'General Physician · City Hospital',
    visitLabel: 'Admission · 26–28 May 2026',
    note: 'Admitted with palpitations. ECG showed normal sinus rhythm; stable angina ruled in. Discharged stable on day 3, referred back to cardiology for ongoing management.',
    diagnosis: ['Stable angina'],
    meds: [],
    labsTitle: 'Investigations',
    labs: [
      { k: 'Heart rate', v: '78 bpm', tone: 'good' },
      { k: 'ECG rhythm', v: 'Normal sinus', tone: 'good' },
    ],
    attachment: { title: 'ECG · discharge papers', meta: '28 May · 3 pages', rec: 'ecg' },
    followUp: 'Cardiology review completed · see Dr. Rao',
  },
]
