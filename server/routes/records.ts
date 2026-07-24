import { Router } from 'express'
import { query } from '../db.js'
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware.js'

export const recordsRouter = Router()
recordsRouter.use(requireAuth)

const COLS = `id, person_id as "personId", kind, title, doctor, hospital,
              record_date as "date", source_filename as "sourceFilename",
              document_id as "documentId", extracted, explanation,
              created_at as "createdAt", updated_at as "updatedAt"`

recordsRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { personId } = req.query
    const params: unknown[] = [req.userId]
    let where = 'where user_id = $1'
    if (personId) {
      params.push(personId)
      where += ' and person_id = $2'
    }
    const result = await query(`select ${COLS} from records ${where} order by created_at desc`, params)
    res.json(result.rows)
  }),
)

recordsRouter.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const {
      personId,
      kind,
      title,
      doctor,
      hospital,
      date,
      sourceFilename,
      documentId,
      extracted,
      explanation,
    } = req.body ?? {}
    const result = await query(
      `insert into records
         (user_id, person_id, kind, title, doctor, hospital, record_date,
          source_filename, document_id, extracted, explanation)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       returning ${COLS}`,
      [
        req.userId,
        personId ?? null,
        kind ?? null,
        title ?? null,
        doctor ?? null,
        hospital ?? null,
        date ?? null,
        sourceFilename ?? null,
        documentId ?? null,
        extracted ?? null,
        explanation ?? null,
      ],
    )
    res.status(201).json(result.rows[0])
  }),
)

// PATCH /api/records/:id — update editable fields (and the extracted JSON, which
// the client keeps in sync). Owner-scoped.
recordsRouter.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { title, doctor, hospital, date, extracted } = req.body ?? {}
    const result = await query(
      `update records set
         title       = $1,
         doctor      = $2,
         hospital    = $3,
         record_date = $4,
         extracted   = coalesce($5, extracted),
         updated_at  = now()
       where id = $6 and user_id = $7
       returning ${COLS}`,
      [
        title ?? null,
        doctor ?? null,
        hospital ?? null,
        date ?? null,
        extracted ?? null,
        req.params.id,
        req.userId,
      ],
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Record not found' })
      return
    }
    res.json(result.rows[0])
  }),
)

// DELETE /api/records/:id — remove a record (and its stored original file, if
// any). Owner-scoped.
recordsRouter.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const found = await query<{ document_id: string | null }>(
      'select document_id from records where id = $1 and user_id = $2',
      [req.params.id, req.userId],
    )
    if (found.rowCount === 0) {
      res.status(404).json({ error: 'Record not found' })
      return
    }
    await query('delete from records where id = $1 and user_id = $2', [req.params.id, req.userId])
    const docId = found.rows[0].document_id
    if (docId) {
      await query('delete from documents where id = $1 and user_id = $2', [docId, req.userId])
    }
    res.status(204).end()
  }),
)
