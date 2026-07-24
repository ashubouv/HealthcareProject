import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { query } from '../db.js'
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware.js'

export const documentsRouter = Router()

/* One-time, short-lived view tickets so the original file can be opened as a
   plain URL in a new tab (needed for the phone's NATIVE PDF viewer — an iframe
   on iOS shows only the first page). A ticket is bound to one document, expires
   in 2 minutes, and is deleted on first use. */
const TICKET_TTL_MS = 2 * 60 * 1000
const tickets = new Map<string, { docId: string; userId: string; exp: number }>()

function sweepTickets() {
  const now = Date.now()
  for (const [k, v] of tickets) if (v.exp < now) tickets.delete(k)
}

// POST /api/documents/:id/ticket — mint a view ticket (owner only).
documentsRouter.post(
  '/:id/ticket',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const found = await query('select id from documents where id = $1 and user_id = $2', [
      req.params.id,
      req.userId,
    ])
    if (found.rowCount === 0) {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    sweepTickets()
    const ticket = randomBytes(16).toString('hex')
    tickets.set(ticket, { docId: req.params.id, userId: req.userId!, exp: Date.now() + TICKET_TTL_MS })
    res.json({ ticket })
  }),
)

// GET /api/documents/:id/file — stream the original file inline. Accepts either
// a valid one-time ticket (?t=...) for direct browser navigation, or the normal
// bearer token for in-app fetches.
documentsRouter.get(
  '/:id/file',
  (req: AuthedRequest, res, next) => {
    const t = String(req.query.t ?? '')
    const tk = tickets.get(t)
    if (tk && tk.docId === req.params.id && tk.exp > Date.now()) {
      tickets.delete(t) // single-use
      req.userId = tk.userId
      next()
      return
    }
    void requireAuth(req, res, next)
  },
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await query<{ data: Buffer; mime: string; filename: string | null }>(
      'select data, mime, filename from documents where id = $1 and user_id = $2',
      [req.params.id, req.userId],
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const { data, mime, filename } = result.rows[0]
    res.setHeader('Content-Type', mime || 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${(filename || 'document').replace(/"/g, '')}"`,
    )
    res.send(data)
  }),
)
