# Personal Health Records

A hi-fi implementation of the **Health Records Prototype** handed off from Claude Design.
The **frontend** is React + Vite + TypeScript; the **backend** is an Express + TypeScript API
backed by **PostgreSQL**, with document extraction powered by the **Claude API**
(`claude-opus-4-8`). It elevates the lo-fi wireframe into a calm clinical design system while
wiring onboarding, persistence, and the AI capture pipeline up for real.

## Prerequisites (one-time)

1. **Node.js 18+** and **PostgreSQL** installed locally.
   On macOS: install [Postgres.app](https://postgresapp.com/) or `brew install postgresql@16`,
   then start it.
2. **Create the database:**
   ```bash
   createdb health_records
   ```
3. **Get a Claude API key** from <https://console.anthropic.com>.
4. **Configure environment** — copy the example and fill it in:
   ```bash
   cp .env.example .env
   # then edit .env:
   #   DATABASE_URL=postgres://localhost:5432/health_records
   #   ANTHROPIC_API_KEY=sk-ant-...
   ```

## Run it

```bash
npm install
npm run dev        # starts BOTH the API (port 3001) and the web app (Vite) together
```

Open the printed Vite URL. Tables are created automatically on first boot. Other scripts:

```bash
npm run web        # frontend only
npm run server     # backend only (tsx watch)
npm run build      # type-check + production build (frontend)
npm run db:reset   # wipe all data back to a clean slate
```

### Walk the flow

**Get started → enter a phone/email → type any 6-digit code → choose who the record is for
→ add the patient → Finish setup** lands on the dashboard. Tap **Add your first document**,
upload a photo or PDF of a lab report/prescription, and the **AI reads it into structured
fields** for review, then saves it to Postgres. The **Reset / Start over** button (dev only)
wipes the database and returns to the first onboarding screen.

> No real SMS/email is sent — any 6-digit code is accepted (`TODO(prod)` markers note where a
> real OTP provider and password hashing go).

## Architecture

**Backend — `server/`** (Express + TypeScript, run with `tsx`):

- `server/index.ts` — app entry; runs migrations on boot, mounts routes, dev `/api/dev/reset`.
- `server/db.ts` + `server/schema.sql` — Postgres pool, idempotent schema (users, sessions,
  persons, records).
- `server/routes/auth.ts` — OTP/email sign-in with bearer-token sessions.
- `server/routes/persons.ts` / `records.ts` — per-user CRUD, auth-guarded. Records support
  `GET` / `POST` / `PATCH /:id` (edit doctor, hospital, date, and the extracted JSON) /
  `DELETE /:id` (removes the record and its stored original file).
- `server/routes/extract.ts` + `server/anthropic.ts` — `POST /api/extract` takes an uploaded
  PDF/image, **stores the original file** (in the `documents` table), and calls Claude with
  **structured outputs** to return typed fields (doctor, date, test type, values, medications,
  plain-language summary).
- `server/routes/documents.ts` — `GET /api/documents/:id/file` streams the original uploaded
  file back (owner-scoped) so it can be viewed; records link to it via `document_id`.

**Frontend — `src/`:**

- `src/api/client.ts` — typed `fetch` client; holds the bearer token, calls `/api/*`
  (Vite proxies to the backend).
- `src/state/session.tsx` — session state, restored from `/api/me` on load.
- `src/routes/guards.tsx` — `ProtectedRoute` / `RequireAuthStep`.
- `src/onboarding/` — Welcome → SignIn → Verify → Proxy → Person, wired to the real API.
- `src/app/` — the main app, with the **Home / Timeline / + / Meds / More** tab bar
  (`AppShell` + `AppTabBar`). All screens read live records from `recordsContext` and show
  empty states for new users, filling in as documents are added:
  - `HomeScreen` — greeting + snapshot (record/med/flag counts), attention flags, recent.
    The **"Needs your attention"** flags are **dismissible** (per-card `×` and "Clear all");
    dismissals persist locally (`dismissedFlags.ts`) and are keyed to the exact result so a
    genuinely new/changed flag still surfaces.
  - `TimelineScreen` — every saved document in chronological order by the date on the
    document (most recent first), falling back to when it was added if the date is missing.
  - `MedsScreen` — medications aggregated across records, **de-duplicated by name** keeping the
    **latest dose, frequency and date** (with a "seen N×" history and a **link to the source
    prescription**). A **List / Schedule** toggle shows a **daily dose calendar** (meds laid out by
    Morning / Afternoon / Evening / Night, plus Weekly and As-needed groupings, parsed from the
    free-text frequency in `medSchedule.ts`). Medicines can be **added manually** (a bottom sheet
    that saves a small prescription record) and **archived** ("no longer taking" → moves to an
    Archived section; state persisted in `medArchive.ts`).
  - `LabsScreen` — the landing **is** an Apple Health-style stack of cards, one per area (kind of
    doctor), flagged areas first. Each card has a colored icon/title, a "N to review" (or "N
    tests") label, and a body of big-value stat columns (test name, value, and High/Low on the
    flagged ones) like Apple's Activity card. `labCategories.ts` rolls the fine test categories up
    into areas (Cardiologist, Endocrinologist, Nephrologist, Gastroenterologist, Haematologist,
    Bone health, Rheumatologist, Urologist, Oncologist). Tapping a card shows that area's
    **measures** as clean **metric tiles** (status dot, cleaned-up test name, big value, mini
    **sparkline**) → tap a measure for its
    **trend**: a hero card (status badge, latest value, delta vs the earliest reading), a
    **bar-chart trend** where every reading is a bar in chronological order, **labelled with its
    value on top and date below**, the latest emphasised, and **bar heights proportional to the
    actual value** (measured from a true zero baseline) so relative sizes are honest rather than
    stretched. Below it a description **specific to that measure** (`measureInfo.ts` — what the test
    is + where the latest value sits vs the normal range), and all readings with up/down trend arrows
    (long lists collapse with a "show all" toggle). A back arrow steps up each level. Repeat tests are
    grouped across documents even when the AI labels them slightly differently ("Hemoglobin" vs
    "Hemoglobin (Hb)"), and **exact duplicate readings** (same date + value) are de-duplicated.
    `refRanges.ts` holds reference ranges for a broad set of tests older adults get (CBC,
    electrolytes, kidney, liver, lipids, thyroid, iron, bone, vitamins, PSA, …) used to show a
    **normal range** and derive a **High / Low / Normal** status when the document didn't flag the
    value.
  - `DoctorSummaryScreen` — a one-page, auto-generated clinical summary (reached from the Labs
    header): patient, flagged/out-of-range results, current medications, latest lab values, and
    recent documents — all **dated**. **Share** uses the native share sheet (falling back to copy),
    and **Print** uses a print stylesheet that strips the desktop board + phone frame and prints just
    the summary full-width.
  - `RecordDetailScreen` — a single record's extracted fields, with an **Edit** mode
    (pencil) for the patient name, doctor, hospital, date, and each medicine's name / dosage /
    frequency, and a **Delete document** action (removes the record and its stored original file via
    `DELETE /api/records/:id`). Saving `PATCH`es the record and keeps the extracted JSON in sync.
  - `AddDocument` — **upload a file or take a photo** → AI extraction → review → save (then
    refreshes + lands on Timeline). Camera/library photos are downscaled client-side
    (`prepareUpload.ts`, max 1600px JPEG) so full-resolution phone shots stay within the vision
    model's limits and extract reliably; PDFs pass through untouched.
  - `derive.ts` — helpers that turn raw records into meds/labs/snapshot views.
- `src/components/DevReset.tsx` — dev-only Reset (wipes DB + session).

### Retained for reference (not in the active route tree)

The original hi-fi screens built from the prototype — Home dashboard, Capture flow, Manual
entry, Timeline, Record detail, Doctor summary, Meds, Labs & trends, History, Sharing — and
their seeded demo data still live in `src/screens/`, `src/data/`, and `src/state/store.tsx`.
They are **no longer rendered** (so the running app has no demo data); they remain as the
design reference to rebuild each screen against real state, one at a time.

- `src/styles/` — design tokens (`theme.css`) and shared styles, used throughout.
- `project/` & `chats/` — the original Claude Design handoff bundle (see below).

---

# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 2 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Health Records Prototype.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `Design scope and approach` project files (HTML prototypes, assets, components)
