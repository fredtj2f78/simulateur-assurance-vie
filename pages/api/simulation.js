/**
 * GET    /api/simulation          → charge la liste de tous les biens (id, nom, date)
 * GET    /api/simulation?id=xxx   → charge les paramètres d'un bien spécifique
 * POST   /api/simulation          → crée un nouveau bien
 * PUT    /api/simulation?id=xxx   → met à jour les paramètres ou le nom d'un bien
 * DELETE /api/simulation?id=xxx   → supprime un bien
 */
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' })
  
  const token = authHeader.split(' ')[1]
  const admin = supabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  
  if (error || !user) return res.status(401).json({ error: 'Token invalide' })

  // Récupération de l'ID s'il est passé dans la requête (?id=...)
  const { id } = req.query

  try {
    // ---------------------------------------------------------
    // 1. LECTURE (GET)
    // ---------------------------------------------------------
    if (req.method === 'GET') {
      if (id) {
        // A. Charger un bien spécifique
        const { data, error } = await admin
          .from('simulations')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()
          
        if (error && error.code !== 'PGRST116') throw error // Ignore l'erreur si aucun résultat
        return res.status(200).json({ simulation: data ?? null })
      } else {
        // B. Charger la liste des biens pour le menu déroulant
        const { data, error } = await admin
          .from('simulations')
          .select('id, nom, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          
        if (error) throw error
        return res.status(200).json({ simulations: data ?? [] })
      }
    }

    // ---------------------------------------------------------
    // 2. CRÉATION (POST)
    // ---------------------------------------------------------
    if (req.method === 'POST') {
      const { params, nom } = req.body
      
      const { data, error } = await admin
        .from('simulations')
        .insert({ user_id: user.id, params, nom })
        .select('id')
        .single()
        
      if (error) throw error
      // On renvoie l'ID généré pour que le front puisse cibler ce nouveau bien
      return res.status(200).json({ ok: true, id: data.id })
    }

    // ---------------------------------------------------------
    // 3. MISE À JOUR (PUT)
    // ---------------------------------------------------------
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'ID manquant pour la mise à jour' })
      
      const { params, nom } = req.body
      const updatePayload = { updated_at: new Date() }
      
      if (params) updatePayload.params = params
      if (nom) updatePayload.nom = nom

      const { error } = await admin
        .from('simulations')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    // ---------------------------------------------------------
    // 4. SUPPRESSION (DELETE)
    // ---------------------------------------------------------
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'ID manquant pour la suppression' })
      
      const { error } = await admin
        .from('simulations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    // Si la méthode n'est ni GET, POST, PUT ou DELETE
    return res.status(405).json({ error: 'Méthode non autorisée' })

  } catch (err) {
    console.error("Erreur API /api/simulation:", err)
    return res.status(500).json({ error: 'Erreur serveur interne' })
  }
}
