-- ================================================================
-- SCHEMA SUPABASE — SimuImmov
-- À exécuter dans : supabase.com → ton projet → SQL Editor
-- ================================================================

-- Table profiles (extension de auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text not null default 'trial',        -- 'trial' | 'premium' | 'free'
  trial_ends_at timestamptz default (now() + interval '7 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Activer Row Level Security
alter table public.profiles enable row level security;

-- Politique : chaque utilisateur ne voit que son propre profil
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Fonction : créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger : se déclenche à chaque nouvel utilisateur
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- Pour vérifier que tout fonctionne :
-- select * from public.profiles;
-- ================================================================
