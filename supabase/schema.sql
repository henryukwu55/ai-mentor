-- AI Mentor — Supabase schema
-- Requires the pgvector extension (enabled by default on supabase.com,
-- or `CREATE EXTENSION` on self-hosted Postgres).

create extension if not exists vector;

-- Students / users
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  created_at timestamptz default now()
);

-- Mentor sessions (one per conversation)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  project_name text,
  status text default 'active', -- active | completed | abandoned
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Individual messages within a session (text + optional sentiment metadata)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sentiment jsonb,        -- e.g. {"frustration": 0.7, "confidence": 0.3}
  created_at timestamptz default now()
);

-- Knowledge base documents for RAG (project briefs, docs, FAQs, etc.)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text not null,
  embedding vector(768), -- dimension for nomic-embed-text; adjust if you change embed model
  created_at timestamptz default now()
);

-- Vector similarity search function used by lib/rag.ts
create or replace function match_documents(
  query_embedding vector(768),
  match_count int default 4
)
returns table (id uuid, title text, content text, similarity float)
language sql stable
as $$
  select id, title, content,
         1 - (embedding <=> query_embedding) as similarity
  from documents
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Basic RLS (tighten further for production)
alter table students enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table documents enable row level security;

create policy "service role full access students" on students for all using (true);
create policy "service role full access sessions" on sessions for all using (true);
create policy "service role full access messages" on messages for all using (true);
create policy "service role full access documents" on documents for all using (true);
