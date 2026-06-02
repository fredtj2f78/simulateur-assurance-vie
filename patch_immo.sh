#!/bin/bash
DIR="$HOME/simuimmov_v5"

echo "⏳ 1/4 Mise à jour de auth-helper.js..."
cat << 'EOF' > "$DIR/pages/api/auth-helper.js"
import { supabaseWithToken, supabaseAdmin } from '../../lib/supabase'

export async function verifyAuth(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Non authentifié' }
  }
  
  const token = authHeader.split(' ')[1]
  
  try {
    const client = supabaseWithToken(token)
    const { data: { user }, error } = await client.auth.getUser(token)
    
    if (error || !user) return { user: null, error: 'Token invalide' }
    return { user, error: null, token }
  } catch (e) {
    return { user: null, error: e.message }
  }
}

export async function getUserProfile(userId) {
  const admin = supabaseAdmin()
  const { data } = await admin
    .from('profiles')
    .select('plan, trial_ends_at, role, stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single()
  return data
}

export function checkAccess(profile) {
  const now = new Date()
  const hasPremiumPlan = ['premium_month', 'premium_year', 'premium_life', 'premium_lifetime'].includes(profile?.plan)
  const isTrialActive = profile?.plan === 'trial' && profile.trial_ends_at && new Date(profile.trial_ends_at) > now
  const isAdmin = profile?.role === 'admin'
  
  return {
    isPremium: hasPremiumPlan,
    isTrial: isTrialActive,
    isAdmin,
    hasFullAccess: hasPremiumPlan || isTrialActive || isAdmin
  }
}
EOF

echo "⏳ 2/4 Mise à jour de users.js..."
cat << 'EOF' > "$DIR/pages/api/users.js"
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
 .select('id, email, plan, role, trial_ends_at, stripe_customer_id, created_at')
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
EOF

echo "⏳ 3/4 Création de TableauComparatif.js..."
mkdir -p "$DIR/components"
cat << 'EOF' > "$DIR/components/TableauComparatif.js"
import React from 'react';

export default function TableauComparatif({ data }) {
  if (!data) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
  const formatPercent = (val) => (val !== undefined && val !== null) ? `${val.toFixed(2)} %` : '-';

  return (
    <div className="overflow-x-auto my-8">
      <h3 className="text-xl font-bold mb-4">Comparatif des Montages</h3>
      <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border text-left">Indicateur</th>
            <th className="px-4 py-2 border text-center">Location Nue</th>
            <th className="px-4 py-2 border text-center">LMNP</th>
            <th className="px-4 py-2 border text-center">SCI IS</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">EBE (Excédent Brut d'Exploitation)</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.nue?.ebe)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.lmnp?.ebe)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.sci?.ebe)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">Cash Flow (Après Impôt)</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.nue?.cashFlow)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.lmnp?.cashFlow)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.sci?.cashFlow)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">Rendement Brut</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.nue?.rendBrut)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.lmnp?.rendBrut)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.sci?.rendBrut)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">Rendement Net</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.nue?.rendNet)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.lmnp?.rendNet)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.sci?.rendNet)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">TRI (Taux de Rentabilité Interne)</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.nue?.tri)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.lmnp?.tri)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.sci?.tri)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
EOF

echo "⏳ 4/4 Sécurisation des apostrophes dans simulateur.js..."
sed -i "s|.*tab_emprunt.*| {id:'tab_emprunt',label:\"Tableau d'Amortissement\"},|" "$DIR/pages/simulateur.js"
sed -i "s|.*🏦 Tableau d.*|          <Section title=\"🏦 Tableau d'Amortissement\" color={T.blue}>|" "$DIR/pages/simulateur.js"
sed -i "s|.*Période d.*essai.*|                🔒 Période d'essai terminée. <a href=\"/pricing\" style={{color:T.gold,fontWeight:700}}>Passez Premium</a> pour accéder aux résultats complets.|" "$DIR/pages/simulateur.js"

echo "✅ Script terminé avec succès !"
