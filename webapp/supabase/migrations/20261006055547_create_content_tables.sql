-- Study content: concepts, glossary, videos, chapters. Public, read-only.
-- Large chapter bodies and images live in the `chapters` Storage bucket, not in tables.

create table public.concepts (
  id         text primary key,
  name       text not null,
  parent_id  text references public.concepts (id),
  summary    text not null,
  sort_order integer not null
);
create index concepts_parent_id_idx on public.concepts (parent_id);

create table public.glossary_categories (
  id         text primary key,
  name       text not null,
  sort_order integer not null
);

create table public.glossary_terms (
  id            text primary key,
  term          text not null,
  aliases       text[] not null default '{}',
  category_id   text not null references public.glossary_categories (id),
  definition    text not null,
  example       text not null,
  how_it_works  text,
  tradeoffs     text,
  failure_modes text,
  code_snippet  text,
  -- ids of other glossary terms
  related       text[] not null default '{}',
  -- ids from public.concepts
  concepts      text[] not null default '{}',
  -- slugs from public.chapters
  chapters      text[] not null default '{}',
  sort_order    integer not null
);
create index glossary_terms_category_id_idx on public.glossary_terms (category_id);

create table public.videos (
  id         text primary key,
  youtube_id text not null,
  title      text not null,
  channel    text not null,
  level      text not null check (level in ('beginner', 'intermediate', 'advanced')),
  summary    text not null,
  -- ids from public.concepts
  concepts   text[] not null default '{}',
  sort_order integer not null
);

-- One row per chapter. The body is the file `<slug>/index.md` in the `chapters`
-- bucket and each figure is a file under `<slug>/images/`.
create table public.chapters (
  slug                text primary key,
  number              integer not null unique,
  volume              integer not null check (volume in (1, 2)),
  title               text not null,
  summary             text not null,
  -- ids from public.concepts
  concepts            text[] not null default '{}',
  -- [{ "depth": 2, "text": "..." }]
  headings            jsonb not null default '[]',
  -- [{ "src": "/chapters/<slug>/images/x.png", "alt": "...", "section": "..." }]
  figures             jsonb not null default '[]',
  unreferenced_images text[] not null default '{}',
  word_count          integer not null,
  reading_minutes     integer not null
);
comment on table public.chapters is
  'Source: https://github.com/liquidslr/system-design-notes, notes on System Design Interview, Vol 1 and 2, by Alex Xu.';

alter table public.concepts enable row level security;
alter table public.glossary_categories enable row level security;
alter table public.glossary_terms enable row level security;
alter table public.videos enable row level security;
alter table public.chapters enable row level security;

create policy "concepts are public" on public.concepts
  for select to anon, authenticated using (true);
create policy "glossary_categories are public" on public.glossary_categories
  for select to anon, authenticated using (true);
create policy "glossary_terms are public" on public.glossary_terms
  for select to anon, authenticated using (true);
create policy "videos are public" on public.videos
  for select to anon, authenticated using (true);
create policy "chapters are public" on public.chapters
  for select to anon, authenticated using (true);

-- Public bucket: files are readable by URL. No storage.objects write policy exists,
-- so uploads need the service role or the CLI.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chapters', 'chapters', true, 10485760, array['image/png', 'text/markdown'])
on conflict (id) do nothing;
