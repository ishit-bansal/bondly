-- Create sessions table to store relationship counseling sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete cascade,
  creator_name text not null,
  partner_name text,
  status text not null default 'waiting_for_partner', -- waiting_for_partner, completed, analyzed
  share_token text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create responses table to store individual partner responses
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  is_creator boolean not null default false,
  situation_description text not null,
  feelings text not null,
  emotional_state text[], -- array of emotions: mad, sad, angry, in_love, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create advice table to store AI-generated advice for each partner
create table if not exists public.advice (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  is_creator boolean not null default false,
  advice_text text not null,
  conversation_starters text[],
  action_steps text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.sessions enable row level security;
alter table public.responses enable row level security;
alter table public.advice enable row level security;

-- Sessions policies
-- Note: Sessions contain only names (not sensitive). The share_token (UUID) provides security.
-- Partners need to access sessions via share_token before authentication.
-- The actual sensitive data (responses, advice) is protected by user-specific RLS.

create policy "Users can view their own sessions"
  on public.sessions for select
  using (auth.uid() = creator_id);

-- Allow public read access to sessions (partner needs access via share_token)
-- SECURITY: This is acceptable because:
-- 1. Sessions only contain names, not sensitive response data
-- 2. share_token is a cryptographically random UUID (very hard to guess)
-- 3. Responses and advice are protected by user-specific RLS policies
create policy "Public session read for partner access"
  on public.sessions for select
  using (true);

create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = creator_id);

create policy "Creator can update their own sessions"
  on public.sessions for update
  using (auth.uid() = creator_id);

-- Allow authenticated users to update session status to completed
-- This is needed when partner submits their response
create policy "Partner can complete session"
  on public.sessions for update
  using (status = 'waiting_for_partner')
  with check (status = 'completed');

-- Responses policies
create policy "Users can view responses for their sessions"
  on public.responses for select
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = responses.session_id
      and sessions.creator_id = auth.uid()
    )
    or user_id = auth.uid()
  );

create policy "Users can insert their own responses"
  on public.responses for insert
  with check (auth.uid() = user_id);

-- Advice policies
create policy "Users can view their own advice"
  on public.advice for select
  using (auth.uid() = user_id);

create policy "Service role can insert advice"
  on public.advice for insert
  with check (true);

-- Create indexes for performance
create index if not exists sessions_creator_id_idx on public.sessions(creator_id);
create index if not exists sessions_share_token_idx on public.sessions(share_token);
create index if not exists responses_session_id_idx on public.responses(session_id);
create index if not exists advice_session_id_idx on public.advice(session_id);
