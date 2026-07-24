import type { LabMetric, Tone, Trend } from './types'

export interface LabReading {
  date: string
  value: string
  trend?: Trend
}
export interface LabBar {
  height: number // 0-100 (% of chart)
  label: string
  hot?: boolean
}
export interface LabData {
  title: string
  value: string
  unit: string
  delta: string
  status: string
  statusTone: Tone
  range: string
  summary: string
  bars: LabBar[]
  readings: LabReading[]
  recs: string[]
}

export const LABS: Record<LabMetric, LabData> = {
  chol: {
    title: 'Total cholesterol',
    value: '210',
    unit: 'mg/dL',
    delta: '↑ 22 from 188 in Feb',
    status: 'Above target',
    statusTone: 'alert',
    range: 'Target: under 200 mg/dL',
    summary:
      'Your cholesterol has been climbing over the last four months and is now above the healthy range. LDL (“bad”) cholesterol is the main driver.',
    bars: [
      { height: 56, label: 'Feb' },
      { height: 70, label: 'Mar' },
      { height: 63, label: 'Apr' },
      { height: 84, label: 'May' },
      { height: 96, label: 'Jun', hot: true },
    ],
    readings: [
      { date: '18 Jun', value: '210', trend: 'up' },
      { date: '02 May', value: '196' },
      { date: '14 Apr', value: '192' },
      { date: '08 Mar', value: '196' },
      { date: '05 Feb', value: '188' },
    ],
    recs: [
      'Cut saturated fat — less fried food, butter and red meat',
      'Add soluble fibre: oats, beans, apples, lentils',
      '30 min brisk activity, 5 days a week',
      'Recheck lipid profile in 6 weeks — Dr. Rao',
    ],
  },
  bp: {
    title: 'Blood pressure',
    value: '148/92',
    unit: 'mmHg',
    delta: '↑ from 144/90 last month',
    status: 'Above target',
    statusTone: 'alert',
    range: 'Target: under 130/80 mmHg',
    summary:
      'Blood pressure remains elevated despite medication. The top (systolic) number has stayed in the high range for several months.',
    bars: [
      { height: 58, label: 'Feb' },
      { height: 74, label: 'Mar' },
      { height: 65, label: 'Apr' },
      { height: 84, label: 'May' },
      { height: 93, label: 'Jun', hot: true },
    ],
    readings: [
      { date: '18 Jun', value: '148/92', trend: 'up' },
      { date: '02 May', value: '144/90' },
      { date: '14 Apr', value: '138/88' },
      { date: '08 Mar', value: '142/88' },
      { date: '05 Feb', value: '136/86' },
    ],
    recs: [
      'Reduce salt to under 5g a day — avoid pickles & processed food',
      'Take Amlodipine at the same time every day',
      'Daily 30-min walk; aim to lose 2–3 kg',
      'Log your BP each morning at home',
    ],
  },
  sugar: {
    title: 'HbA1c (blood sugar)',
    value: '7.1',
    unit: '%',
    delta: '↓ 0.7 from 7.8 — improving',
    status: 'Improving',
    statusTone: 'good',
    range: 'Target: under 7.0 %',
    summary:
      'Good progress — your average blood sugar has dropped steadily over the year and is now close to target. Keep up the current routine.',
    bars: [
      { height: 96, label: 'Feb' },
      { height: 88, label: 'Mar' },
      { height: 78, label: 'Apr' },
      { height: 68, label: 'May' },
      { height: 56, label: 'Jun', hot: true },
    ],
    readings: [
      { date: '12 Jun', value: '7.1%', trend: 'down' },
      { date: '02 May', value: '7.3%' },
      { date: '14 Apr', value: '7.5%' },
      { date: '08 Mar', value: '7.8%' },
      { date: '05 Feb', value: '8.0%' },
    ],
    recs: [
      'Keep to whole grains over refined carbs and sugar',
      'Continue Metformin twice daily',
      'Your daily walking is working — keep it up',
      'Repeat HbA1c in 3 months — Dr. Iyer',
    ],
  },
}
