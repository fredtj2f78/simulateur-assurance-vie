/**
 * Fichier : pages/api/admin/users.js
 */
import { verifyAuth, getUserProfile, checkAccess } from '../api/auth-helper'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return res.status(401).json({ error: 'Non authentifié' })

  const profile = await getUserProfile(user.id)
  const { isAdmin } = checkAccess(profile)
  if (!isAdmin) return res.status(403).json({ error: 'Accès interdit — Administrateur uniquement' })

  const adminClient = supabaseAdmin()

  if (req.method === 'GET') {
    const { data: profiles, error: errProf } = await adminClient
      .from('profiles')
      .select('id, email, plan, role, trial_ends_at, created_at')
      .order('created_at', { ascending: false })
    if (errProf) return res.status(500).json({ error: errProf.message })
    return res.status(200).json({ users: profiles })
  }

  if (req.method === 'PUT') {
    const { userId, plan, role, trial_ends_at } = req.body
    if (!userId) return res.status(400).json({ error: 'Identifiant utilisateur manquant' })

    const updates = {}
    if (plan !== undefined) updates.plan = plan
    if (role !== undefined) updates.role = role
    if (trial_ends_at !== undefined) updates.trial_ends_at = trial_ends_at

    const { error: errUp } = await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (errUp) return res.status(500).json({ error: errUp.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
