import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and point it at your local Postgres.',
  )
}

/**
 * Local Postgres speaks plaintext; hosted providers (Supabase, Neon, RDS, …)
 * require TLS. Enable SSL automatically for any non-local host, unless overridden
 * with DATABASE_SSL=true/false. `rejectUnauthorized: false` accepts the
 * provider's certificate chain without bundling a CA (fine for this app).
 */
function useSsl(cs: string): boolean {
  if (process.env.DATABASE_SSL === 'true') return true
  if (process.env.DATABASE_SSL === 'false') return false
  if (/[?&]sslmode=disable/.test(cs)) return false
  return !/@(localhost|127\.0\.0\.1|\[::1\]|::1)[:/]/.test(cs)
}

export const pool = new pg.Pool({
  connectionString,
  ssl: useSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
})

/** Thin query helper. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params)
}

/** Create tables if they don't exist. Runs on every boot. */
export async function migrate(): Promise<void> {
  const sql = readFileSync(join(here, 'schema.sql'), 'utf8')
  await pool.query(sql)
}

/** Dev-only: wipe all data back to a clean slate. */
export async function wipe(): Promise<void> {
  await pool.query('truncate documents, records, sessions, persons, users restart identity cascade')
}
