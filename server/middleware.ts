import type { NextFunction, Request, Response } from 'express'
import { query } from './db.js'

export interface AuthedRequest extends Request {
  userId?: string
}

/** Bearer-token auth backed by the sessions table. */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }
  const result = await query<{ user_id: string }>(
    'select user_id from sessions where token = $1',
    [token],
  )
  if (result.rowCount === 0) {
    res.status(401).json({ error: 'Invalid session' })
    return
  }
  req.userId = result.rows[0].user_id
  next()
}

/** Wrap an async handler so rejected promises hit the error middleware. */
export function asyncHandler(
  fn: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
