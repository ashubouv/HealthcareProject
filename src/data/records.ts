import type { RecordId } from './types'

export interface RecordMeta {
  id: RecordId
  title: string
  pages: string
  date: string
  source: string
  /** plain-language explanation, EN + Tamil (vernacular toggle) */
  explain: { en: string; ta: string }
}

export const RECORDS: Record<RecordId, RecordMeta> = {
  lipid: {
    id: 'lipid',
    title: 'Lipid profile',
    pages: 'View original · 2 pages',
    date: '18 Jun 2026',
    source: 'Apollo Hospital · Dr. Rao',
    explain: {
      en: 'This blood test measures the fats in your blood. Your total and LDL ("bad") cholesterol are above the healthy range, which raises heart risk over time. Dr. Rao has continued your statin and asked for a recheck in six weeks.',
      ta: 'இந்த இரத்தப் பரிசோதனை உங்கள் இரத்தத்தில் உள்ள கொழுப்பை அளவிடுகிறது. உங்கள் மொத்த மற்றும் LDL கொழுப்பு ஆரோக்கியமான அளவை விட அதிகமாக உள்ளது. டாக்டர் ராவ் உங்கள் மருந்தைத் தொடர்ந்து, ஆறு வாரங்களில் மீண்டும் சோதிக்கச் சொன்னார்.',
    },
  },
  rx: {
    id: 'rx',
    title: 'Prescription',
    pages: 'View original · 1 page',
    date: '12 Jun 2026',
    source: 'Apollo Hospital · Dr. Rao',
    explain: {
      en: 'These are the medicines Dr. Rao has prescribed: one for blood pressure, one for blood sugar, and one for cholesterol. Take each at the time shown. We check this list against your other medicines for interactions.',
      ta: 'இவை டாக்டர் ராவ் பரிந்துரைத்த மருந்துகள்: இரத்த அழுத்தம், சர்க்கரை மற்றும் கொழுப்புக்கு ஒவ்வொன்று. காட்டப்பட்டுள்ள நேரத்தில் எடுத்துக் கொள்ளுங்கள். உங்கள் மற்ற மருந்துகளுடன் இது ஒத்துப்போகிறதா என நாங்கள் சரிபார்க்கிறோம்.',
    },
  },
  ecg: {
    id: 'ecg',
    title: 'ECG · discharge',
    pages: 'View original · 3 pages',
    date: '28 May 2026',
    source: 'City Hospital · Dr. Menon',
    explain: {
      en: 'You were admitted for palpitations. The ECG showed a normal heart rhythm and serious causes were ruled out — the diagnosis was stable angina. You were discharged on day three and referred back to cardiology for ongoing care.',
      ta: 'படபடப்பு காரணமாக நீங்கள் சேர்க்கப்பட்டீர்கள். ECG சாதாரண இதய தாளத்தைக் காட்டியது, தீவிர காரணங்கள் நீக்கப்பட்டன — நோயறிதல் நிலையான ஆஞ்சினா. மூன்றாம் நாளில் வீடு திரும்பினீர்கள்.',
    },
  },
}

export const RECORD_VALUES: Record<
  RecordId,
  { heading: string; rows: { k: string; v: string; tone?: 'alert' | 'good' }[] }
> = {
  lipid: {
    heading: 'Extracted values',
    rows: [
      { k: 'Total cholesterol', v: '210 mg/dL', tone: 'alert' },
      { k: 'HDL', v: '42 mg/dL' },
      { k: 'LDL', v: '138 mg/dL', tone: 'alert' },
    ],
  },
  rx: {
    heading: 'Prescribed medications',
    rows: [
      { k: 'Amlodipine 5mg', v: '1× daily' },
      { k: 'Metformin 500mg', v: '2× daily' },
      { k: 'Atorvastatin 10mg', v: '1× night' },
    ],
  },
  ecg: {
    heading: 'Discharge summary',
    rows: [
      { k: 'Diagnosis', v: 'Stable angina' },
      { k: 'Heart rate', v: '78 bpm', tone: 'good' },
      { k: 'Rhythm', v: 'Normal sinus', tone: 'good' },
    ],
  },
}
