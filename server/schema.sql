-- Personal Health Records — database schema
-- Idempotent: safe to run on every server boot.

create extension if not exists pgcrypto;

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  method      text not null,                       -- 'phone' | 'email'
  contact     text not null,
  created_at  timestamptz not null default now(),
  unique (method, contact)
);

-- One-time sign-in codes. Only the SHA-256 hash is stored; codes expire and
-- allow a limited number of attempts.
create table if not exists otp_codes (
  id          uuid primary key default gen_random_uuid(),
  method      text not null,                       -- 'phone' | 'email'
  contact     text not null,
  code_hash   text not null,
  attempts    int not null default 0,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists otp_codes_contact_idx on otp_codes (method, contact, created_at desc);

create table if not exists sessions (
  token       text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists persons (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  full_name     text not null,
  age_years     int,
  relationship  text not null,                     -- 'self' | 'dependent'
  proxy_choice  text,                              -- 'self' | 'caretaker'
  created_at    timestamptz not null default now()
);

create table if not exists records (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  person_id        uuid references persons(id) on delete cascade,
  kind             text,                           -- lab_report | prescription | discharge_summary | scan | other
  title            text,
  doctor           text,
  hospital         text,
  record_date      text,
  source_filename  text,
  extracted        jsonb,                          -- full structured extraction from the AI
  explanation      text,                           -- plain-language summary
  created_at       timestamptz not null default now()
);

create index if not exists records_person_idx on records (person_id, created_at desc);

-- Original uploaded files (PDF/image), stored so the user can view them later.
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  filename    text,
  mime        text not null,
  data        bytea not null,
  created_at  timestamptz not null default now()
);

-- Link a record to its original document (added via ALTER for existing DBs).
alter table records add column if not exists document_id uuid references documents(id) on delete set null;

-- Password sign-in (bcrypt hash). Null for accounts created via emailed codes.
alter table users add column if not exists password_hash text;

-- Patient profile extensions.
alter table persons add column if not exists gender text;          -- 'female' | 'male' | 'other'
alter table persons add column if not exists notes text;           -- freeform history/notes

-- Track edits so derived views (e.g. medications) treat edited records as fresh.
alter table records add column if not exists updated_at timestamptz;
