# Guide Stripe — SimuImmo v4

## 1. Créer le compte Stripe
→ https://stripe.com → Sign up
→ Complète le profil (nom, adresse, SIRET si auto-entrepreneur)
→ Mode test d'abord (toggle en haut à droite du dashboard)

---

## 2. Récupérer les clés API
dashboard.stripe.com → Developers → API keys

| Variable .env | Valeur Stripe |
|---|---|
| STRIPE_SECRET_KEY | sk_test_... (test) / sk_live_... (prod) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | pk_test_... / pk_live_... |

---

## 3. Créer les 3 produits

dashboard.stripe.com → Products → Add product

### Plan Mensuel
- Name : SimuImmo Premium Mensuel
- Price : 29,00 € — Recurring — Every month
- → Note l'ID prix : STRIPE_PRICE_MONTHLY=price_XXXXX

### Plan Annuel
- Name : SimuImmo Premium Annuel
- Price : 249,00 € — Recurring — Every year
- → Note l'ID prix : STRIPE_PRICE_YEARLY=price_XXXXX

### Plan À vie
- Name : SimuImmo Premium À vie
- Price : 599,00 € — One time
- → Note l'ID prix : STRIPE_PRICE_LIFETIME=price_XXXXX

---

## 4. Configurer le Webhook

dashboard.stripe.com → Developers → Webhooks → Add endpoint

URL : https://TON_DOMAINE.vercel.app/api/webhook

Events à cocher :
✓ checkout.session.completed
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_failed

→ Copie le Signing secret : STRIPE_WEBHOOK_SECRET=whsec_XXXXX

---

## 5. Ajouter toutes les variables dans Vercel

Dans Termux (dossier du projet) :

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_MONTHLY
vercel env add STRIPE_PRICE_YEARLY
vercel env add STRIPE_PRICE_LIFETIME
vercel --prod
```

Pour chaque variable → colle la valeur → choisis ALL (Production + Preview + Development)

---

## 6. Créer un code promo dans Supabase

Supabase → SQL Editor → colle et exécute :

```sql
insert into public.promo_codes
  (code, description, price_monthly, price_yearly, price_lifetime)
values
  ('CGP2026', 'Partenaire CGP — prix préférentiel', 1900, 14900, 39900);
  -- monthly=19€, yearly=149€, lifetime=399€
```

Pour un code avec expiration :
```sql
insert into public.promo_codes
  (code, description, price_monthly, price_yearly, price_lifetime, expires_at)
values
  ('ETE2026', 'Promo été 2026', 1450, 12450, 29950, '2026-09-30');
```

Pour voir tous tes codes :
```sql
select code, description,
  price_monthly/100.0 as mensuel_eur,
  price_yearly/100.0 as annuel_eur,
  price_lifetime/100.0 as avie_eur,
  usage_count, expires_at, is_active
from public.promo_codes
order by created_at desc;
```

Pour désactiver un code :
```sql
update public.promo_codes set is_active = false where code = 'ETE2026';
```

---

## 7. Tester en mode test Stripe

Carte de test : 4242 4242 4242 4242
Date : n'importe quelle date future
CVC : 123

Vérifie dans Supabase → profiles → plan = premium après paiement

---

## 8. Passer en production

1. Dans Stripe → active ton compte (KYC identité)
2. Remplace sk_test_ par sk_live_ dans Vercel
3. Remplace pk_test_ par pk_live_
4. Recrée le webhook en mode Live avec la même URL
5. vercel --prod
