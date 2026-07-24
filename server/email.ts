import nodemailer from 'nodemailer'

/* ============================================================
   Outgoing email — used to deliver real one-time sign-in codes.

   Configured with standard SMTP environment variables. For Gmail:
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=465
     SMTP_USER=you@gmail.com
     SMTP_PASS=<a Google "App Password", not your normal password>
     SMTP_FROM=Health Records <you@gmail.com>   (optional)

   Hosting networks sometimes block one SMTP port, so if the
   configured port can't connect we automatically retry on the
   other standard port (465 SSL <-> 587 STARTTLS). Tight timeouts
   keep the sign-in button from hanging when a port is blocked.

   If SMTP is not configured:
     - in development, the code is printed to the server console so
       local testing still works without an email account;
     - in production, sending fails loudly so a misconfigured deploy
       is obvious instead of silently letting anyone in.
   ============================================================ */

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, BREVO_API_KEY, EMAIL_FROM } = process.env

// Two delivery paths:
//  - BREVO_API_KEY → Brevo's HTTPS API (port 443). Works on hosts that block
//    SMTP ports outright (Render's free tier does). Preferred when set.
//  - SMTP_* → classic SMTP (Gmail etc.) for hosts that allow it.
export const emailConfigured = Boolean(BREVO_API_KEY || (SMTP_HOST && SMTP_USER && SMTP_PASS))

/** Which delivery path is active — used by the email status endpoint. */
export function emailMode(): 'brevo' | 'smtp' | 'none' {
  if (BREVO_API_KEY) return 'brevo'
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) return 'smtp'
  return 'none'
}

async function sendViaBrevo(message: ReturnType<typeof buildMessage>): Promise<void> {
  const sender = EMAIL_FROM || SMTP_USER
  if (!sender) throw new Error('Set EMAIL_FROM to the address codes should be sent from')
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'HealthKeeper', email: sender },
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
    }),
    signal: AbortSignal.timeout(10_000), // fail fast, never hang the sign-in button
  })
  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 300)
    throw new Error(`email API error ${res.status}: ${body}`)
  }
}

function makeTransport(port: number) {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = TLS from the start; 587 upgrades via STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Fail fast instead of hanging the request when a port is blocked.
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
  })
}

function buildMessage(to: string, code: string) {
  return {
    from: process.env.SMTP_FROM || SMTP_USER,
    to,
    subject: `${code} is your HealthKeeper sign-in code`,
    text: `Your sign-in code is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 6px;font-size:18px;color:#1c1c1c">Your sign-in code</h2>
        <p style="margin:0 0 18px;font-size:14px;color:#555">Enter this code to sign in to HealthKeeper.</p>
        <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#0f766e;padding:14px 0">${code}</div>
        <p style="font-size:12px;color:#888;margin-top:18px">The code expires in 10 minutes. If you didn't request it, ignore this email.</p>
      </div>`,
  }
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!emailConfigured) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev fallback: no email account needed to test locally.
      console.log(`[dev] Sign-in code for ${to}: ${code}`)
      return
    }
    throw new Error('Email sending is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)')
  }

  const message = buildMessage(to, code)

  // HTTPS API path — immune to SMTP port blocking.
  if (BREVO_API_KEY) {
    try {
      await sendViaBrevo(message)
      return
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.error(`[email] API send failed: ${reason}`)
      throw new Error(`Could not send the code email (${reason})`)
    }
  }

  const primary = Number(SMTP_PORT) || 465
  const fallback = primary === 465 ? 587 : 465

  try {
    await makeTransport(primary).sendMail(message)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error(`[email] send via port ${primary} failed: ${reason} — retrying on ${fallback}`)
    try {
      await makeTransport(fallback).sendMail(message)
    } catch (err2) {
      const reason2 = err2 instanceof Error ? err2.message : String(err2)
      console.error(`[email] send via port ${fallback} also failed: ${reason2}`)
      throw new Error(`Could not send the code email (${reason2})`)
    }
  }
}
