import { compute } from '../../lib/calcul'
import { verifyAuth, getUserProfile, checkAccess } from './auth-helper'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  // 1. Vérifier l'identité de l'utilisateur
  const { user, error } = await verifyAuth(req)
  if (error || !user) return res.status(401).json({ error: 'Non authentifié' })

  // 2. Lire son statut réel dans Supabase
  const profile = await getUserProfile(user.id)
  const { hasFullAccess } = checkAccess(profile)

  // 3. Effectuer les mathématiques
  let result
  try {
    result = compute(req.body)
  } catch (e) {
    return res.status(400).json({ error: 'Calcul impossible', detail: e.message })
  }

  // 4. Si l'utilisateur est Premium, on renvoie absolument tout
  if (hasFullAccess) {
    return res.status(200).json({ restricted: false, plan: profile?.plan, ...result })
  }

  // 5. Si l'utilisateur est Gratuit (Free), on bloque les données avancées
  return res.status(200).json({
    restricted: true,
    plan: profile?.plan ?? 'free',
    // On ne renvoie QUE les KPI de base pour les utilisateurs gratuits
    verdict: result.verdict,
    coutTotal: result.coutTotal,
    rendBrut: result.rendBrut,
    rendNet: result.rendNet,
    mensualite: result.mensualite,
    rendNetNetSCI: result.rendNetNetSCI,
    rendNetNetLN: result.rendNetNetLN,
    rendNetNetLMNP: result.rendNetNetLMNP,
    loyerHCAnn: result.loyerHCAnn,
    chargesCommunes: result.chargesCommunes,
    cfe: req.body.cfe || 0,
    comptable: req.body.comptable || 0,
    years: [], // Bloqué
    loan: [], // Bloqué
    horizons: null // Bloqué
  })
}
