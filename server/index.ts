import 'dotenv/config'
import { setDefaultResultOrder } from 'node:dns'
// Prefer IPv4 for outbound connections (SMTP, database). Some hosts — Render
// included — have no outbound IPv6 route, and Node otherwise tries IPv6 first,
// failing with ENETUNREACH.
setDefaultResultOrder('ipv4first')
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { migrate, wipe } from './db.js'
import { asyncHandler } from './middleware.js'
import { authRouter } from './routes/auth.js'
import { personsRouter } from './routes/persons.js'
import { recordsRouter } from './routes/records.js'
import { extractRouter } from './routes/extract.js'
import { documentsRouter } from './routes/documents.js'
import { emailMode } from './email.js'

const here = dirname(fileURLToPath(import.meta.url))
const clientDist = join(here, '..', 'dist')

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Email self-diagnosis — safe to expose (no secrets, just configuration state).
// Open /api/health/email in a browser to see why sign-in codes may not arrive.
app.get('/api/health/email', (_req, res) => {
  const mode = emailMode()
  const production = process.env.NODE_ENV === 'production'
  let verdict: string
  if (mode === 'none' && !production) {
    verdict =
      'PROBLEM: No email service is set up AND the app is not in production mode, so sign-in codes are only printed to the server logs — they are never emailed. Fix: add BREVO_API_KEY and EMAIL_FROM, and set NODE_ENV=production.'
  } else if (mode === 'none') {
    verdict =
      'PROBLEM: No email service is set up (sign-in will show an error). Fix: add BREVO_API_KEY and EMAIL_FROM environment variables.'
  } else if (mode === 'brevo' && !process.env.EMAIL_FROM && !process.env.SMTP_USER) {
    verdict = 'PROBLEM: BREVO_API_KEY is set but EMAIL_FROM is missing. Add EMAIL_FROM (the address codes are sent from).'
  } else if (!production) {
    verdict = `Email is configured via ${mode}, but NODE_ENV is not "production" — codes ARE emailed. Recommended: set NODE_ENV=production.`
  } else {
    verdict = `OK: codes are emailed via ${mode}. If they do not arrive, check the provider dashboard (delivery status / account activation) and the spam folder.`
  }
  res.json({
    emailMode: mode,
    productionMode: production,
    fromAddressSet: Boolean(process.env.EMAIL_FROM || process.env.SMTP_USER),
    verdict,
  })
})

app.use('/api/auth', authRouter)
app.use('/api/persons', personsRouter)
app.use('/api/records', recordsRouter)
app.use('/api/extract', extractRouter)
app.use('/api/documents', documentsRouter)

// Dev-only: wipe all data so onboarding can be tested from a clean slate.
if (process.env.NODE_ENV !== 'production') {
  app.post(
    '/api/dev/reset',
    asyncHandler(async (_req, res) => {
      await wipe()
      res.json({ ok: true })
    }),
  )
}

// In production (deployed), serve the built frontend from this same server, so
// the whole app is one service on one URL and the frontend's relative /api calls
// hit this backend directly (no proxy, no CORS). In local dev the dist folder
// isn't built and Vite serves the frontend instead, so this is skipped.
if (existsSync(join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(join(clientDist, 'index.html'))
  })
}

// Central error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api error]', err)
  const message = err instanceof Error ? err.message : 'Internal error'
  res.status(500).json({ error: message })
})

const PORT = Number(process.env.PORT) || 3001

migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`)
    })

    // Keep-awake: free hosting suspends idle instances, which makes the first
    // visitor of the day stare at the host's loading screen. Pinging our own
    // public URL (Render provides it as RENDER_EXTERNAL_URL) counts as traffic,
    // so the instance never idles and new users land straight on the app.
    const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL
    if (process.env.NODE_ENV === 'production' && selfUrl) {
      const target = `${selfUrl.replace(/\/$/, '')}/api/health`
      setInterval(() => {
        fetch(target).catch(() => {})
      }, 5 * 60 * 1000)
      console.log(`Keep-awake self-ping enabled → ${target}`)
    }
  })
  .catch((err) => {
    console.error('Failed to run migrations / start server:', err)
    process.exit(1)
  })
