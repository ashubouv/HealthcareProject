import 'dotenv/config'
import { pool, wipe } from './db.js'

// Standalone: `npm run db:reset` wipes all data back to a clean slate.
wipe()
  .then(() => {
    console.log('Database wiped clean.')
    return pool.end()
  })
  .catch((err) => {
    console.error('Reset failed:', err)
    process.exit(1)
  })
