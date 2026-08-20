import type { TimelineEvent } from './types'

/** Full medical timeline — visits, blood tests, prescriptions, admissions. */
export const TIMELINE: TimelineEvent[] = [
  {
    month: 'jun',
    date: '18 Jun',
    title: 'Cardiology follow-up',
    sub: 'Dr. Rao · Apollo',
    badge: 'Visit',
    tone: 'neutral',
    kind: 'visit',
    rec: null,
    note: 'BP still 148/92 on Amlodipine. No chest pain. Continue regimen, recheck in 6 weeks.',
    tags: ['rao', 'apollo', 'cardio'],
  },
  {
    month: 'jun',
    date: '18 Jun',
    title: 'Lipid profile',
    sub: 'Apollo lab · ordered by Dr. Rao',
    badge: 'Blood test',
    tone: 'alert',
    kind: 'test',
    rec: 'lipid',
    tags: ['rao', 'apollo', 'cardio'],
  },
  {
    month: 'jun',
    date: '12 Jun',
    title: 'Prescription updated',
    sub: 'Dr. Rao · Apollo',
    badge: 'Prescription',
    tone: 'neutral',
    kind: 'rx',
    rec: 'rx',
    tags: ['rao', 'apollo', 'cardio'],
  },
  {
    month: 'jun',
    date: '12 Jun',
    title: 'Endocrinology review',
    sub: 'Dr. Iyer · Apollo',
    badge: 'Visit',
    tone: 'good',
    kind: 'visit',
    rec: null,
    note: 'HbA1c down to 7.1% from 7.8%. Continue Metformin, reinforce diet.',
    tags: ['apollo'],
  },
  {
    month: 'jun',
    date: '05 Jun',
    title: 'HbA1c',
    sub: 'Apollo lab · ordered by Dr. Iyer',
    badge: 'Blood test',
    tone: 'good',
    kind: 'test',
    rec: null,
    tags: ['apollo'],
  },
  {
    month: 'may',
    date: '28 May',
    title: 'ECG · discharge',
    sub: 'Dr. Menon · City Hospital',
    badge: 'Discharge',
    tone: 'neutral',
    kind: 'discharge',
    rec: 'ecg',
    tags: ['cardio'],
  },
  {
    month: 'may',
    date: '26 May',
    title: 'Hospital admission',
    sub: 'Palpitations · City Hospital',
    badge: 'Admission',
    tone: 'alert',
    kind: 'admission',
    rec: null,
    note: 'Admitted for palpitations. Normal sinus rhythm, stable angina ruled in. Discharged day 3.',
    tags: ['cardio'],
  },
]

export interface OverviewPanel {
  initials?: string
  title: string
  sub: string
  count: string
  note?: string
  metrics: { k: string; v: string; tone?: 'alert' | 'good' }[]
  doctors?: { name: string; detail: string }[]
}

export const TIMELINE_OVERVIEWS: Record<'rao' | 'apollo' | 'cardio', OverviewPanel> = {
  rao: {
    initials: 'VR',
    title: 'Dr. Vikram Rao',
    sub: 'Cardiology · Apollo',
    count: '2 visits · 1 blood test · since Mar 2026',
    note: '“BP still elevated at 148/92 despite Amlodipine. LDL high. Continue regimen, recheck in 6 weeks.”',
    metrics: [
      { k: 'Blood pressure', v: '148/92', tone: 'alert' },
      { k: 'LDL', v: '138 mg/dL', tone: 'alert' },
    ],
  },
  cardio: {
    title: 'Cardiology',
    sub: 'Dr. Rao (Apollo) · Dr. Menon (City Hospital)',
    count: '1 follow-up · 1 admission · 1 ECG',
    note: 'Admitted in May for palpitations — ECG normal sinus rhythm, stable angina ruled in. Now managed medically with BP still elevated.',
    metrics: [
      { k: 'BP', v: '148/92', tone: 'alert' },
      { k: 'Rhythm', v: 'Normal sinus', tone: 'good' },
      { k: 'Heart rate', v: '78 bpm', tone: 'good' },
    ],
  },
  apollo: {
    title: 'Apollo Hospital',
    sub: 'Cardiology · Endocrinology',
    count: '2 visits · 2 blood tests across 2 departments',
    metrics: [],
    doctors: [
      { name: 'Dr. Rao', detail: 'Cardiology · BP, lipids' },
      { name: 'Dr. Iyer', detail: 'Endocrine · HbA1c 7.1%' },
    ],
  },
}
