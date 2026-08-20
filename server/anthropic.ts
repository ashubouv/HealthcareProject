import Anthropic from '@anthropic-ai/sdk'

/* ============================================================
   Claude document-extraction.
   Sends a photographed/uploaded medical document (PDF or image)
   to Claude and gets back structured fields as JSON, constrained
   to the schema below via structured outputs.
   ============================================================ */

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  // Don't throw at import time — let the server boot so non-AI routes work,
  // and surface a clear error only when /api/extract is actually called.
  console.warn('[anthropic] ANTHROPIC_API_KEY is not set — /api/extract will fail until it is.')
}

const client = new Anthropic({ apiKey: apiKey ?? 'missing' })
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8'

export interface ExtractedValue {
  name: string
  value: string
  unit: string | null
  flag: string | null
}
export interface ExtractedMedication {
  name: string
  dose: string | null
  frequency: string | null
}
export interface Extracted {
  documentType: 'lab_report' | 'prescription' | 'discharge_summary' | 'scan' | 'other'
  title: string
  patientName: string | null
  doctorName: string | null
  hospital: string | null
  date: string | null
  tags: string[]
  values: ExtractedValue[]
  medications: ExtractedMedication[]
  plainLanguageSummary: string
}

/** JSON Schema given to the model via structured outputs. */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    documentType: {
      type: 'string',
      enum: ['lab_report', 'prescription', 'discharge_summary', 'scan', 'other'],
    },
    title: { type: 'string' },
    patientName: { type: ['string', 'null'] },
    doctorName: { type: ['string', 'null'] },
    hospital: { type: ['string', 'null'] },
    date: { type: ['string', 'null'] },
    tags: { type: 'array', items: { type: 'string' } },
    values: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          unit: { type: ['string', 'null'] },
          flag: { type: ['string', 'null'] },
        },
        required: ['name', 'value', 'unit', 'flag'],
      },
    },
    medications: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          dose: { type: ['string', 'null'] },
          frequency: { type: ['string', 'null'] },
        },
        required: ['name', 'dose', 'frequency'],
      },
    },
    plainLanguageSummary: { type: 'string' },
  },
  required: [
    'documentType',
    'title',
    'patientName',
    'doctorName',
    'hospital',
    'date',
    'tags',
    'values',
    'medications',
    'plainLanguageSummary',
  ],
} as const

const SYSTEM = `You read medical documents (lab reports, prescriptions, discharge summaries, scans) and extract structured data.
- Use exactly the fields requested. If a field is not present in the document, use null (or an empty array).
- "title" is a short human label, e.g. "Lipid profile" or "Cardiology prescription".
- "values" holds measured results (test name, value, unit, and a flag like "high"/"low" if the document marks one).
- "medications" holds prescribed drugs with dose and frequency.
- "plainLanguageSummary" explains the document in at most 2 short, simple sentences a patient or caretaker can understand.
- "tags": at most 3 short tags.
- Be concise everywhere; keep test names as written but do not add commentary.
- Do not invent data. Extract only what the document shows.`

const PDF_TYPE = 'application/pdf'

/** Build the document/image content block for Claude from an uploaded file. */
function fileBlock(buffer: Buffer, mimeType: string): Anthropic.ContentBlockParam {
  const data = buffer.toString('base64')
  if (mimeType === PDF_TYPE) {
    return { type: 'document', source: { type: 'base64', media_type: PDF_TYPE, data } }
  }
  // images: image/png, image/jpeg, image/webp, image/gif
  const media = (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mimeType)
    ? mimeType
    : 'image/png') as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
  return { type: 'image', source: { type: 'base64', media_type: media, data } }
}

export async function extractDocument(buffer: Buffer, mimeType: string): Promise<Extracted> {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.')
  }

  // output_config is a recent API field; cast params to keep TS happy across SDK versions.
  const params = {
    model: MODEL,
    // Dense lab panels (30+ rows) need far more than 2k output tokens — a low
    // cap silently truncates the JSON mid-string ("Unterminated string in JSON").
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract the structured fields from this medical document.' },
          fileBlock(buffer, mimeType),
        ],
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  const response = await client.messages.create(params)
  // If the model ran out of room anyway, say so clearly instead of failing on
  // a half-finished JSON string.
  if (response.stop_reason === 'max_tokens') {
    throw new Error(
      'This document has more data than can be read in one pass. Try uploading it as separate pages or photos.',
    )
  }
  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Model returned no text content.')
  }
  try {
    return JSON.parse(textBlock.text) as Extracted
  } catch {
    throw new Error('The AI response was cut short. Please try the upload again.')
  }
}
