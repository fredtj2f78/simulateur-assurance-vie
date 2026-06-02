/**
 * POST /api/promo
 * Valide un code promo et retourne les prix associés
 */
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code manquant' })

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Code invalide ou expiré' })

  // Vérif expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Ce code a expiré' })
  }

  // Incrément usage
  await admin.from('promo_codes').update({ usage_count: (data.usage_count || 0) + 1 }).eq('id', data.id)

  return res.status(200).json({
    valid: true,
    code: data.code,
    description: data.description,
    prices: {
      monthly: data.price_monthly,   // en centimes
      yearly: data.price_yearly,
      lifetime: data.price_lifetime,
    }
  })
}
