import { verifyAuth, getUserProfile, checkAccess } from '../auth-helper'
import { supabaseAdmin } from '../../../lib/supabase'

const ADMIN_EMAIL = 'ft.bu@ik.me'

export default async function handler(req, res) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return res.status(401).json({ error: 'Non authentifié' })
  if (user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Accès interdit' })

  const admin = supabaseAdmin()

  if (req.method === 'GET') {
    const { data: profiles, error: errProf } = await admin
      .from('profiles')
.select('id, email, plan, trial_ends_at, stripe_customer_id, created_at')
      .order('created_at', { ascending: false })
    if (errProf) return res.status(500).json({ error: errProf.message })
    return res.status(200).json({ users: profiles })
  }

  if (req.method === 'PUT') {
    const { userId, plan, trial_ends_at } = req.body
    if (!userId) return res.status(400).json({ error: 'userId manquant' })

    const updates = { plan }
    if (trial_ends_at) updates.trial_ends_at = trial_ends_at
    if (plan === 'trial' && !trial_ends_at) {
      const d = new Date()
      d.setDate(d.getDate() + 3)
      updates.trial_ends_at = d.toISOString()
    }

    const { error: errUp } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    if (errUp) return res.status(500).json({ error: errUp.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
