-- Esquema de Supabase para Figus Tracker.
-- Pegá y ejecutá esto en: Supabase -> SQL Editor -> New query -> Run.

-- Tabla con la colección de cada usuario (un registro JSONB por usuario).
-- `data`       = colección de figuritas (id -> cantidad).
-- `packs`      = historial de sobres abiertos (array de eventos) para gasto/predicción.
-- `milestones` = fecha en que cada país se completó por primera vez (equipo -> ISO).
create table if not exists public.collections (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}',
  packs jsonb not null default '[]',
  milestones jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Migración para bases que ya tenían la tabla sin la columna `packs`.
alter table public.collections
  add column if not exists packs jsonb not null default '[]';

-- Migración para la columna `milestones` (hitos de completado por país).
alter table public.collections
  add column if not exists milestones jsonb not null default '{}';

-- Activar Row Level Security: cada usuario solo accede a SU fila.
alter table public.collections enable row level security;

-- Políticas (idempotentes).
drop policy if exists "own row select" on public.collections;
create policy "own row select" on public.collections
  for select using (auth.uid() = user_id);

drop policy if exists "own row insert" on public.collections;
create policy "own row insert" on public.collections
  for insert with check (auth.uid() = user_id);

drop policy if exists "own row update" on public.collections;
create policy "own row update" on public.collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
