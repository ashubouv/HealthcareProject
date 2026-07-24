import { Router } from 'express'
import { query } from '../db.js'
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware.js'

export const personsRouter = Router()
personsRouter.use(requireAuth)

const COLS = `id, full_name as "fullName", age_years as "ageYears",
              relationship, proxy_choice as "proxyChoice", gender, notes`

personsRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await query(
      `select ${COLS} from persons where user_id = $1 order by created_at`,
      [req.userId],
    )
    res.json(result.rows)
  }),
)

personsRouter.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { fullName, ageYears, relationship, proxyChoice, gender } = req.body ?? {}
    if (!fullName || !relationship) {
      res.status(400).json({ error: 'fullName and relationship are required' })
      return
    }
    const result = await query(
      `insert into persons (user_id, full_name, age_years, relationship, proxy_choice, gender)
       values ($1, $2, $3, $4, $5, $6)
       returning ${COLS}`,
      [req.userId, fullName, ageYears ?? null, relationship, proxyChoice ?? null, gender ?? null],
    )
    res.status(201).json(result.rows[0])
  }),
)

// PATCH /api/persons/:id — update profile fields / freeform history notes.
personsRouter.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { fullName, ageYears, gender, notes } = req.body ?? {}
    const result = await query(
      `update persons set
         full_name = coalesce($1, full_name),
         age_years = coalesce($2, age_years),
         gender    = coalesce($3, gender),
         notes     = coalesce($4, notes)
       where id = $5 and user_id = $6
       returning ${COLS}`,
      [fullName ?? null, ageYears ?? null, gender ?? null, notes ?? null, req.params.id, req.userId],
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Patient not found' })
      return
    }
    res.json(result.rows[0])
  }),
)
