import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'

const T = {
  bg: '#05080f', s1: '#0e1520', s2: '#141d2e',
  border: '#1e2d45', gold: '#c9a84c', goldDim: '#7a6030',
  green: '#2ecc71', red: '#e74c3c', blue: '#4a9eff',
  text: '#e8f0fa', textDim: '#7a93b0', textMuted: '#3a5070',
}

const PLANS = [
  {
    id: 'monthly',
    label: 'Mensuel',
    price: 29,
    period: '/mois',
    desc: 'Résiliable à tout moment',
    features: ['3 régimes comparés', 'Graphiques interactifs', 'TRI & Multi-horizons', 'Sensibilité & IFI', 'Export PDF', 'Sauvegarde auto'],
    highlight: false,
  },
  {
    id: 'yearly',
    label: 'Annuel',
    price: 199,
    period: '/an',
    desc: 'soit 16,58 €/mois — économisez 149 €',
    features: ['Tout le mensuel inclus', 'Accès prioritaire nouveautés', 'Support email dédié', 'Historique illimité'],
    highlight: true,
    badge: '⭐ Meilleur choix',
  },
  {
    id: 'lifetime',
    label: 'À vie',
    price: 599,
    period: ' une fois',
    desc: 'Paiement unique, accès permanent',
    features: ['Tout l\'annuel inclus', 'Toutes les futures MAJ', 'Accès bêta', 'Support prioritaire à vie'],
    highlight: false,
  },
]

export default function Pricing() {
  const router = useRouter()
  const { user, getToken } = useAuth()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  const handleCheckout = async (plan) => {
    if (!user) { router.push(`/login?plan=${plan.id}`); return }
    setLoading(plan.id); setError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: plan.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Erreur lors de la création du paiement')
    } catch (e) {
      setError(e.message)
    } finally { setLoading(null) }
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: T.text, padding: '40px 20px' }}>
      {/* Back */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: 14, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Retour
        </button>

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.5, marginBottom: 16 }}>Choisissez votre plan</h1>
          <p style={{ color: T.textDim, fontSize: 17 }}>7 jours d'essai gratuit inclus — Annulez à tout moment</p>
        </div>

        {error && (
          <div style={{ background: `${T.red}18`, border: `1px solid ${T.red}44`, borderRadius: 8, padding: '12px 16px', color: T.red, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.highlight ? 'linear-gradient(160deg, #131c2e, #0e1520)' : T.s1,
              border: `1px solid ${plan.highlight ? 'rgba(201,168,76,0.5)' : T.border}`,
              borderRadius: 14, padding: '32px 28px', position: 'relative',
              boxShadow: plan.highlight ? '0 0 40px rgba(201,168,76,0.08)' : 'none',
            }}>
              {plan.badge && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #c9a84c, #e8c76a)', color: '#000', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 13, color: T.textDim, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{plan.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                {plan.id === 'yearly' ? (<>
                  <span style={{ fontSize: 38, fontWeight: 900, color: '#555', textDecoration: 'line-through', letterSpacing: -1 }}>249€</span>
                  <span style={{ fontSize: 56, fontWeight: 900, color: T.gold, letterSpacing: -2 }}>199€</span>
                  <span style={{ color: T.textMuted, fontSize: 14 }}>{plan.period}</span>
                </>) : (<>
                  <span style={{ fontSize: 48, fontWeight: 900, color: plan.highlight ? T.gold : T.text, letterSpacing: -2 }}>{plan.price}€</span>
                  <span style={{ color: T.textMuted, fontSize: 14 }}>{plan.period}</span>
                </>)}
              </div>
              {plan.id === 'yearly' ? (
                <div style={{ fontSize: 12, marginBottom: 28 }}>
                  <span style={{ background: '#e74c3c', color: '#fff', fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginRight: 6, fontSize: 11 }}>PROMO</span>
                  <span style={{ color: T.textMuted }}>soit 16,58 €/mois — </span>
                  <span style={{ color: '#e74c3c', fontWeight: 700 }}>Offre limitée 🔥</span>
                </div>
              ) : (
                <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 28 }}>{plan.desc}</div>
              )}

              <button onClick={() => handleCheckout(plan)} disabled={loading === plan.id}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 28,
                  background: plan.highlight ? 'linear-gradient(135deg, #c9a84c, #e8c76a)' : 'transparent',
                  border: plan.highlight ? 'none' : `1px solid rgba(201,168,76,0.4)`,
                  color: plan.highlight ? '#000' : T.gold,
                  opacity: loading === plan.id ? 0.7 : 1,
                }}>
                {loading === plan.id ? '⏳ Redirection...' : user ? 'Choisir ce plan' : 'Commencer — 7j gratuits'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: T.gold, fontSize: 13, flexShrink: 0 }}>✓</span>
                    <span style={{ color: T.textDim, fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sécurité */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 40 }}>
          {['🔒 Paiement sécurisé Stripe', '✓ Sans engagement (mensuel)', '↩️ Remboursement 14j (annuel/lifetime)'].map(t => (
            <span key={t} style={{ color: T.textMuted, fontSize: 13 }}>{t}</span>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={() => router.push('/simulateur')} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 13 }}>
            Continuer avec l'essai gratuit →
          </button>
        </div>
      </div>
    </div>
  )
}
