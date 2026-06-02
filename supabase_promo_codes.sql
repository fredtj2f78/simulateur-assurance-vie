-- ================================================================
-- SCHEMA — Table promo_codes (codes parrainage)
-- À exécuter dans Supabase SQL Editor
-- ================================================================

create table if not exists public.promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,                    -- ex: CGP2026
  description text,                             -- ex: Code partenaire Cabinet Dupont
  price_monthly integer,                        -- prix mensuel en centimes (ex: 1900 = 19€)
  price_yearly integer,                         -- prix annuel en centimes (ex: 14900 = 149€)
  price_lifetime integer,                       -- prix à vie en centimes (ex: 39900 = 399€)
  stripe_coupon_id text,                        -- ID coupon Stripe (généré automatiquement)
  expires_at timestamptz,                       -- null = pas d'expiration
  usage_count integer default 0,                -- compteur d'utilisations
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seul l'admin (service_role) peut lire/écrire
alter table public.promo_codes enable row level security;

-- Aucune politique publique = accessible uniquement via service_role (backend)
-- Les utilisateurs ne peuvent pas lire les codes depuis le navigateur

-- ================================================================
-- Exemples de codes à créer (remplace les valeurs) :
-- ================================================================
-- insert into public.promo_codes (code, description, price_monthly, price_yearly, price_lifetime)
-- values ('CGP2026', 'Code partenaire CGP', 1900, 14900, 39900);
--
-- insert into public.promo_codes (code, description, price_monthly, price_yearly, price_lifetime, expires_at)
-- values ('PROMO50', 'Promo été 2026 -50%', 1450, 12450, 29950, '2026-09-01');
-- ================================================================
