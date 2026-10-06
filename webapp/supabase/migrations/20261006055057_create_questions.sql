-- Interview question bank. Public, read-only content.

create table public.question_categories (
  id         text primary key,
  name       text not null,
  symbol     text not null,
  summary    text not null,
  sort_order integer not null
);

create table public.questions (
  id                 text primary key,
  category_id        text not null references public.question_categories (id),
  title              text not null,
  prompt             text not null,
  format             text not null check (format in ('short', 'concept', 'design')),
  difficulty         text not null check (difficulty in ('easy', 'medium', 'hard')),
  expected_answer    text not null,
  time_limit_minutes integer not null check (time_limit_minutes > 0),
  tags               text[] not null default '{}',
  key_points         text[] not null default '{}',
  follow_ups         text[] not null default '{}',
  sources            text[] not null default '{}',
  -- ids from public/concepts.json, which is not stored in the database, so no foreign key
  concepts           text[] not null default '{}'
);

create index questions_category_id_idx on public.questions (category_id);
create index questions_concepts_idx on public.questions using gin (concepts);

-- Anyone may read. No insert/update/delete policies exist, so writes need the
-- service role or a migration.
alter table public.question_categories enable row level security;
alter table public.questions enable row level security;

create policy "question_categories are public" on public.question_categories
  for select to anon, authenticated using (true);

create policy "questions are public" on public.questions
  for select to anon, authenticated using (true);
