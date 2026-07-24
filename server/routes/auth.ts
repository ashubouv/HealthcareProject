import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware.js'
import { sendOtpEmail } from '../email.js'

export const authRouter = Router()

/* ---- password sign-in rate limiting (in-memory; resets on restart) ---- */
const FAILS_ALLOWED = 10
const LOCK_MINUTES = 15
const failed = new Map<string, { count: number; lockedUntil: number }>()

function locked(email: string): boolean {
  const f = failed.get(email)
  return !!f && f.count >= FAILS_ALLOWED && Date.now() < f.lockedUntil
}
function recordFail(email: string): void {
  const f = failed.get(email) ?? { count: 0, lockedUntil: 0 }
  f.count += 1
  if (f.count >= FAILS_ALLOWED) f.lockedUntil = Date.now() + LOCK_MINUTES * 60_000
  failed.set(email, f)
}
function clearFails(email: string): void {
  failed.delete(email)
}

const OTP_TTL_MINUTES = 10
const OTP_MAX_ATTEMPTS = 5
const OTP_RESEND_LIMIT = 5 // max codes per contact per 10 minutes

function newToken(): string {
  return randomBytes(24).toString('hex')
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

function codesMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/** Upsert a user by (method, contact) and start a session. */
async function startSession(method: string, contact: string) {
  const user = await query<{ id: string }>(
    `insert into users (method, contact) values ($1, $2)
     on conflict (method, contact) do update set contact = excluded.contact
     returning id`,
    [method, contact],
  )
  const userId = user.rows[0].id
  const token = newToken()
  await query('insert into sessions (token, user_id) values ($1, $2)', [token, userId])
  return { token, userId }
}

// Email + password sign-in. One endpoint covers both cases:
//  - unknown email        → creates the account with this password
//  - known email          → verifies the password
//  - legacy code-era user → their first password login sets their password
// No email delivery involved, so it works on fully free hosting.
authRouter.post(
  '/password-login',
  asyncHandler(async (req, res) => {
    const { email: rawEmail, password } = req.body ?? {}
    const email = String(rawEmail ?? '').trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address' })
      return
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }
    if (locked(email)) {
      res.status(429).json({ error: 'Too many wrong attempts. Try again in 15 minutes.' })
      return
    }

    const existing = await query<{ id: string; password_hash: string | null }>(
      `select id, password_hash from users where method = 'email' and contact = $1`,
      [email],
    )
    const user = existing.rows[0]
    const isNew = !user

    if (user?.password_hash) {
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) {
        recordFail(email)
        res.status(401).json({ error: 'Wrong password for this email.' })
        return
      }
    } else {
      // New account, or a legacy account from the emailed-code era claiming a password.
      const hash = await bcrypt.hash(password, 10)
      await query(
        `insert into users (method, contact, password_hash) values ('email', $1, $2)
         on conflict (method, contact) do update set password_hash = excluded.password_hash`,
        [email, hash],
      )
    }

    clearFails(email)
    const session = await startSession('email', email)
    res.json({ ...session, isNew })
  }),
)

// Request a one-time code. A real 6-digit code is generated, stored hashed with
// a 10-minute expiry, and emailed to the user.
authRouter.post(
  '/request-otp',
  asyncHandler(async (req, res) => {
    const { method, contact } = req.body ?? {}
    if (!method || !contact) {
      res.status(400).json({ error: 'method and contact are required' })
      return
    }
    if (method !== 'email') {
      // TODO(prod): integrate an SMS provider (e.g. Twilio) for phone sign-in.
      res.status(400).json({ error: 'Phone sign-in is coming soon — please use email for now.' })
      return
    }
    const email = String(contact).trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address' })
      return
    }

    // Basic rate limit so an address can't be flooded with codes.
    const recent = await query<{ n: string }>(
      `select count(*) as n from otp_codes
       where method = 'email' and contact = $1 and created_at > now() - interval '10 minutes'`,
      [email],
    )
    if (Number(recent.rows[0].n) >= OTP_RESEND_LIMIT) {
      res.status(429).json({ error: 'Too many codes requested. Wait a few minutes and try again.' })
      return
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    // Older codes stay in the table (so the rate-limit count above sees them)
    // but only the newest one is ever checked by verify-otp.
    await query(
      `insert into otp_codes (method, contact, code_hash, expires_at)
       values ('email', $1, $2, now() + interval '${OTP_TTL_MINUTES} minutes')`,
      [email, hashCode(code)],
    )

    await sendOtpEmail(email, code)
    res.json({ sent: true })
  }),
)

// Verify the emailed code and start a session.
authRouter.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { method, contact, code } = req.body ?? {}
    if (!method || !contact) {
      res.status(400).json({ error: 'method and contact are required' })
      return
    }
    if (!/^\d{6}$/.test(String(code ?? ''))) {
      res.status(400).json({ error: 'Enter the 6-digit code from your email' })
      return
    }
    const email = String(contact).trim().toLowerCase()

    const found = await query<{ id: string; code_hash: string; attempts: number; expired: boolean }>(
      `select id, code_hash, attempts, (expires_at < now()) as expired
       from otp_codes
       where method = $1 and contact = $2
       order by created_at desc limit 1`,
      [method, email],
    )
    const row = found.rows[0]
    if (!row || row.expired) {
      res.status(400).json({ error: 'That code has expired. Tap “Resend code” to get a new one.' })
      return
    }
    if (row.attempts >= OTP_MAX_ATTEMPTS) {
      res.status(429).json({ error: 'Too many wrong attempts. Request a new code.' })
      return
    }
    if (!codesMatch(row.code_hash, hashCode(String(code)))) {
      await query('update otp_codes set attempts = attempts + 1 where id = $1', [row.id])
      res.status(400).json({ error: 'That code isn’t right. Check the email and try again.' })
      return
    }

    // Success — codes are single-use; clear every outstanding code for this address.
    await query('delete from otp_codes where method = $1 and contact = $2', [method, email])
    res.json(await startSession(method, email))
  }),
)

// Current user + their persons — used to restore a session on page load.
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await query('select id, method, contact from users where id = $1', [req.userId])
    const persons = await query(
      `select id, full_name as "fullName", age_years as "ageYears",
              relationship, proxy_choice as "proxyChoice", gender, notes
       from persons where user_id = $1 order by created_at`,
      [req.userId],
    )
    res.json({ user: user.rows[0], persons: persons.rows })
  }),
)

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const header = req.header('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (token) await query('delete from sessions where token = $1', [token])
    res.json({ ok: true })
  }),
)
