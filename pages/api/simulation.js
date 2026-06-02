/**
 * GET  /api/simulation  → charge les paramètres sauvegardés
 * POST /api/simulation  → sauvegarde les paramètres
 */
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' })
  const token = authHeader.split(' ')[1]
  const admin = supabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Token invalide' })

  if (req.method === 'GET') {
    const { data } = await admin
      .from('simulations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    return res.status(200).json({ simulation: data ?? null })
  }

  if (req.method === 'POST') {
    const { params, nom } = req.body
    // Upsert : crée ou met à jour
    const { data: existing } = await admin
      .from('simulations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (existing) {
      await admin.from('simulations').update({ params, nom, updated_at: new Date() }).eq('id', existing.id)
    } else {
      await admin.from('simulations').insert({ user_id: user.id, params, nom })
    }
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
