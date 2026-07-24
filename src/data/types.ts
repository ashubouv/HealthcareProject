export type Screen =
  | 'login'
  | 'email'
  | 'verify'
  | 'home'
  | 'capture'
  | 'manual'
  | 'timeline'
  | 'record'
  | 'summary'
  | 'meds'
  | 'labs'
  | 'history'
  | 'sharing'

export type CaptureStep = 'camera' | 'extracting' | 'review' | 'duplicate' | 'saved'
export type ManualStep = 'choose' | 'med' | 'lab' | 'visit' | 'saved'
export type RecordId = 'lipid' | 'rx' | 'ecg'
export type LabMetric = 'chol' | 'bp' | 'sugar'
export type DoctorId = 'rao' | 'iyer' | 'menon'
export type TimelineFilter = 'all' | 'rao' | 'apollo' | 'cardio'
export type Trend = 'up' | 'down' | 'flat'
export type Tone = 'neutral' | 'good' | 'warn' | 'alert'

export interface TimelineEvent {
  month: 'jun' | 'may'
  date: string
  title: string
  sub: string
  badge: string
  tone: Tone
  kind: 'visit' | 'test' | 'rx' | 'admission' | 'discharge'
  rec: RecordId | null
  note?: string
  tags: string[]
}
