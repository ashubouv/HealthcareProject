import { Router, type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { extractDocument } from '../anthropic.js'
import { query } from '../db.js'
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware.js'

export const extractRouter = Router()

// Keep the uploaded file in memory; we base64 it straight to Claude.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
})

// Run multer ourselves so a broken/interrupted upload stream (flaky mobile
// connection, proxy hiccup — surfaces as "Unexpected end of form") becomes a
// clear, retryable 400 instead of an opaque 500.
function parseUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) return next()
    console.error('[upload error]', err)
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'That file is too large (max 25 MB).' })
      return
    }
    res.status(400).json({
      error: 'The upload didn’t come through completely. Please try again.',
    })
  })
}

// POST /api/extract — multipart upload field "file" (PDF or image).
// Runs Claude extraction and returns the structured fields for the user to
// review. Saving happens separately via POST /api/records.
extractRouter.post(
  '/',
  requireAuth,
  parseUpload,
  asyncHandler(async (req: AuthedRequest, res) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'No file uploaded (expected form field "file").' })
      return
    }
    if (file.size === 0 || file.buffer.length === 0) {
      res.status(400).json({ error: 'The file came through empty. Please try again.' })
      return
    }
    try {
      const extracted = await extractDocument(file.buffer, file.mimetype)
      // Persist the original file so the user can view it later.
      const doc = await query<{ id: string }>(
        'insert into documents (user_id, filename, mime, data) values ($1, $2, $3, $4) returning id',
        [req.userId, file.originalname, file.mimetype, file.buffer],
      )
      res.json({ extracted, sourceFilename: file.originalname, documentId: doc.rows[0].id })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed'
      res.status(502).json({ error: message })
    }
  }),
)
