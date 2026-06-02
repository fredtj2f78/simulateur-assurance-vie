-- ================================================================
-- SCHEMA SUPABASE — Table simulations (sauvegarde paramètres)
-- À exécuter dans : supabase.com → SQL Editor
-- ================================================================

-- Table pour sauvegarder les paramètres de simulation
create table if not exists public.simulations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  nom text default 'Mon bien',
  params jsonb not null default '{}',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Index pour accès rapide par user
create index if not exists simulations_user_id_idx on public.simulations(user_id);

-- RLS
alter table public.simulations enable row level security;

create policy "Users can manage own simulations"
  on public.simulations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fonction mise à jour timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_simulation_updated
  before update on public.simulations
  for each row execute procedure public.handle_updated_at();

