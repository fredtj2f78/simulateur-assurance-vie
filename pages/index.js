import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

// ── DESIGN ───────────────────────────────────────────────────────────────────
const G = {
  bg: '#05080f',
  s1: '#0b1120',
  s2: '#101828',
  border: '#1a2740',
  gold: '#c9a84c',
  goldLight: '#e8c76a',
  goldDim: 'rgba(201,168,76,0.15)',
  blue: '#3b82f6',
  green: '#10b981',
  text: '#f0f6ff',
  textDim: '#8ba3c7',
  textMuted: '#3d5470',
}

// ── PLANS ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'monthly', label: 'Mensuel', price: 29, period: '/mois',
    desc: 'Résiliable à tout moment',
    features: ['3 régimes comparés (SCI IS, LMNP, Nu)', 'Graphiques interactifs', 'TRI & Multi-horizons', 'Analyse de sensibilité', 'Module IFI', 'Export PDF', 'Sauvegarde automatique'],
    highlight: false, badge: null,
  },
  {
    id: 'yearly', label: 'Annuel', price: 199, period: '/an',
    desc: '~~249 €~~ → 199 € · soit 16,58 €/mois — Offre limitée 🔥',
    features: ['Tout le mensuel inclus', 'Accès prioritaire aux nouveautés', 'Support email dédié', 'Historique illimité'],
    highlight: true, badge: '⭐ Meilleur rapport qualité/prix',
  },
  {
    id: 'lifetime', label: 'À vie', price: 599, period: ' une fois',
    desc: 'Paiement unique, accès permanent',
    features: ['Tout l\'annuel inclus', 'Toutes les futures mises à jour', 'Accès bêta aux nouvelles versions', 'Support prioritaire à vie'],
    highlight: false, badge: null,
  },
]

const TESTIMONIALS = [
  { name: 'Marc D.', role: 'Conseiller en Gestion de Patrimoine', text: 'Je l\'utilise pour chaque nouveau client investisseur. La comparaison SCI IS / LMNP en temps réel me fait gagner 2h par dossier. Les références LF 2025 sont à jour, c\'est essentiel. Cerise sur le gâteau 50% de reduction avec le code Welcome50 c\'est donné. Merci', stars: 5 },
  { name: 'Sophie L.', role: 'Investisseuse immobilière — 8 biens', text: 'Avant SimuImmo je gérais tout sur Excel. Maintenant en 5 minutes j\'ai le TRI sur 20 ans et la richesse nette après revente. Le module IFI m\'a évité une mauvaise surprise.', stars: 5 },
  { name: 'Antoine R.', role: 'Notaire — Étude parisienne', text: 'Outil sérieux, calculs vérifiables. J\'apprécie que les formules soient expliquées et référencées (art. 84 LF 2025 pour LMNP, PFU 31,4% LFSS 2026). Je le recommande à mes clients.', stars: 5 },
]

const FEATURES = [
  { icon: '📊', title: 'Comparaison 3 régimes', desc: 'SCI IS, LMNP Réel et Location Nue côte à côte. Verdict optimal calculé automatiquement.' },
  { icon: '📈', title: 'TRI & Richesse nette', desc: 'Taux de rendement interne, richesse nette après impôts et revente — la vraie performance.' },
  { icon: '🔭', title: 'Multi-horizons', desc: 'Simulez la revente à 10, 15 ou 20 ans. Anticipez l\'impact fiscal des abattements.' },
  { icon: '📐', title: 'Analyse de sensibilité', desc: 'Testez loyer, vacance, revalorisation. Identifiez les variables critiques.' },
  { icon: '🏛', title: 'Module IFI', desc: 'Calcul automatique de l\'IFI avec barème 2026. Seuil 1,3M€ intégré.' },
  { icon: '💾', title: 'Sauvegarde automatique', desc: 'Vos paramètres sauvegardés à chaque modification. Retrouvez votre simulation à la reconnexion.' },
  { icon: '📄', title: 'Export PDF', desc: 'Rapport complet à partager avec votre CGP, notaire ou banquier. Inclus dans tous les plans premium.' },
  { icon: '🔒', title: 'Calculs protégés', desc: 'Les formules s\'exécutent côté serveur. Votre méthodologie reste confidentielle.' },
]

const FAQS = [
  { q: 'SimuImmo est-il mis à jour avec les lois fiscales ?', r: 'Oui — SimuImmo intègre le PFU à 31,4% (LFSS 2026), la réintégration des amortissements LMNP (LF 2025 art. 84), les barèmes IS 15%/25% en vigueur, et les abattements pour durée de détention (CGI art. 150 VC).' },
  { q: 'Puis-je annuler mon abonnement mensuel ?', r: 'Oui, à tout moment depuis votre espace client Stripe. Aucun préavis, aucune pénalité. L\'accès reste actif jusqu\'à la fin de la période payée.' },
  { q: 'L\'offre à vie inclut-elle les futures mises à jour ?', r: 'Oui — toutes les mises à jour fiscales et fonctionnelles sont incluses à vie, sans surcoût.' },
  { q: 'SimuImmo remplace-t-il un conseil professionnel ?', r: 'Non. SimuImmo est un outil pédagogique d\'aide à la décision. Nous recommandons de consulter un CGP, expert-comptable ou avocat fiscaliste avant tout investissement.' },
  { q: 'Mes données sont-elles sécurisées ?', r: 'Vos simulations sont stockées sur Supabase (infrastructure AWS Europe, chiffrée TLS). Les calculs s\'exécutent côté serveur. Nous ne partageons jamais vos données.' },
  { q: 'J\'ai un code parrainage, où le saisir ?', r: 'Sur la page de paiement, un champ "Code promo" vous permet de saisir votre code. Les prix personnalisés s\'appliquent automatiquement.' },
]

// ── ANIMATED SIMULATOR PREVIEW ───────────────────────────────────────────────
function SimPreview() {
  const [step, setStep] = useState(0)
  const [value, setValue] = useState(380000)

  const steps = [
    { label: 'Prix d\'achat', val: 380000, target: 380000 },
    { label: 'Loyer mensuel CC', val: 3583, target: 3583 },
    { label: 'Calcul en cours...', val: null, target: null },
    { label: 'Résultats', val: null, target: null },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s + 1) % 4)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const results = [
    { label: 'SCI IS', value: '187 420 €', color: G.gold, winner: true },
    { label: 'Location Nue', value: '142 310 €', color: G.blue },
    { label: 'LMNP Réel', value: '168 940 €', color: G.green },
  ]

  return (
    <div style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20, maxWidth: 480, margin: '0 auto', fontFamily: 'monospace' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ width: 22, height: 22, background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>⌂</div>
        <span style={{ color: G.text, fontWeight: 700, fontSize: 13, fontFamily: 'sans-serif' }}>SimuImmo</span>
        <span style={{ background: `${G.gold}22`, border: `1px solid ${G.gold}44`, borderRadius: 4, color: G.gold, fontSize: 9, padding: '1px 5px' }}>v29</span>
        {step >= 2 && <span style={{ marginLeft: 'auto', color: G.green, fontSize: 11, animation: 'pulse 1s infinite' }}>● calcul...</span>}
      </div>

      {/* Input simulation */}
      {step < 2 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: G.textMuted, fontSize: 10, marginBottom: 4 }}>{steps[step].label}</div>
          <div style={{ background: G.s2, border: `1px solid ${G.gold}66`, borderRadius: 6, padding: '8px 12px', color: G.gold, fontSize: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{step === 0 ? '380 000' : '3 583'}</span>
            <span style={{ color: G.textMuted, fontSize: 11 }}>€</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            {['A. Acquisition', 'B. Financement', 'C. Charges', 'D. Revenus'].map((t, i) => (
              <div key={t} style={{ fontSize: 9, color: i === (step === 0 ? 0 : 3) ? G.gold : G.textMuted, background: i === (step === 0 ? 0 : 3) ? `${G.gold}15` : 'transparent', border: `1px solid ${i === (step === 0 ? 0 : 3) ? G.gold + '44' : G.border}`, borderRadius: 3, padding: '2px 5px' }}>{t}</div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {step === 2 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ color: G.textDim, fontSize: 12, marginBottom: 12 }}>Calcul des 3 régimes...</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: G.gold, opacity: 0.3 + i * 0.3, animation: `bounce ${0.6 + i * 0.2}s infinite alternate` }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {step === 3 && (
        <div>
          <div style={{ color: G.textDim, fontSize: 10, marginBottom: 10, letterSpacing: 1 }}>RICHESSE NETTE FINALE — AN 20</div>
          {results.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 6, background: r.winner ? `${r.color}12` : G.s2, border: `1px solid ${r.winner ? r.color : G.border}`, borderRadius: 7, position: 'relative' }}>
              {r.winner && <div style={{ position: 'absolute', top: -8, right: 8, background: r.color, color: '#000', fontSize: 7, fontWeight: 800, padding: '1px 5px', borderRadius: 3 }}>GAGNANT</div>}
              <span style={{ color: r.color, fontSize: 12, fontWeight: 600 }}>{r.label}</span>
              <span style={{ color: r.winner ? r.color : G.text, fontSize: 14, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '6px 10px', background: `${G.gold}08`, border: `1px solid ${G.gold}22`, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: G.textDim }}>TRI SCI IS</span>
            <span style={{ color: G.gold }}>7,24 %</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-6px)} }
      `}</style>
    </div>
  )
}

// ── PRICING CARD ──────────────────────────────────────────────────────────────
function PricingCard({ plan, promoPrice, onSelect, loading }) {
  const displayPrice = promoPrice != null ? Math.round(promoPrice / 100) : plan.price
  const isPromo = promoPrice != null && displayPrice !== plan.price

  return (
    <div style={{
      background: plan.highlight ? 'linear-gradient(160deg,#111d35,#0b1120)' : G.s1,
      border: `1px solid ${plan.highlight ? 'rgba(201,168,76,0.5)' : G.border}`,
      borderRadius: 14, padding: '32px 28px', position: 'relative',
      boxShadow: plan.highlight ? '0 0 60px rgba(201,168,76,0.07)' : 'none',
      transition: 'transform 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {plan.badge && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, color: '#000', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          {plan.badge}
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 12, color: G.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>{plan.label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        {plan.id === 'yearly' ? (<>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#555', textDecoration: 'line-through', letterSpacing: -1 }}>249€</span>
          <span style={{ fontSize: 56, fontWeight: 900, color: G.gold, letterSpacing: -2 }}>199€</span>
          <span style={{ color: G.textMuted, fontSize: 13 }}>{plan.period}</span>
        </>) : (<>
          {isPromo && <span style={{ fontSize: 18, color: G.textMuted, textDecoration: 'line-through', marginRight: 4 }}>{plan.price}€</span>}
          <span style={{ fontSize: 48, fontWeight: 900, color: plan.highlight ? G.gold : G.text, letterSpacing: -2 }}>{displayPrice}€</span>
          <span style={{ color: G.textMuted, fontSize: 13 }}>{plan.period}</span>
        </>)}
      </div>
      {isPromo && <div style={{ color: G.green, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>✓ Code promo appliqué</div>}
      {plan.id === 'yearly' ? (
  <div style={{ fontSize: 12, marginBottom: 28 }}>
    <s style={{ color: '#666', marginRight: 6 }}>249 €</s>
    <span style={{ color: G.gold, fontWeight: 700 }}>199 € </span>
    <span style={{ color: G.textMuted }}>· soit 16,58 €/mois — </span>
    <span style={{ color: '#e74c3c', fontWeight: 700 }}>Offre limitée 🔥</span>
  </div>
) : (
  <div style={{ color: G.textMuted, fontSize: 12, marginBottom: 28 }}>{plan.desc}</div>
)}
      <button onClick={() => onSelect(plan)} disabled={loading}
        style={{ width: '100%', padding: '13px 0', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 28, background: plan.highlight ? `linear-gradient(135deg,${G.gold},${G.goldLight})` : 'transparent', border: plan.highlight ? 'none' : `1px solid rgba(201,168,76,0.4)`, color: plan.highlight ? '#000' : G.gold, opacity: loading ? 0.7 : 1 }}>
        {loading ? '⏳...' : 'Commencer — 7j gratuits'}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: G.gold, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ color: G.textDim, fontSize: 13, lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Landing() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(null)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true); setPromoError(''); setPromoResult(null)
    try {
      const res = await fetch('/api/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPromoResult(data)
    } catch (e) { setPromoError(e.message) }
    finally { setPromoLoading(false) }
  }

  const handleSelect = async (plan) => {
    setCheckoutLoading(plan.id)
    router.push(`/login?plan=${plan.id}${promoCode ? `&promo=${promoCode}` : ''}`)
  }

  const getPromoPrice = (planId) => {
    if (!promoResult) return null
    return promoResult.prices[planId] ?? null
  }

  return (
    <div style={{ background: G.bg, minHeight: '100vh', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: G.text, overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(5,8,15,0.96)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: `1px solid ${scrolled ? 'rgba(201,168,76,0.12)' : 'transparent'}`, transition: 'all 0.3s', padding: '0 40px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#FFCD00', borderRadius: 8, padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="/logo.png" alt="SimuImmo" style={{ width: 48, height: 40, objectFit: 'contain' }} /></div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>SimuImmo</span>
          <span style={{ fontSize: 10, color: G.gold, background: `${G.gold}18`, border: `1px solid ${G.gold}33`, padding: '1px 6px', borderRadius: 4 }}>v29</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<a href="/guide-investisseur" style={{ color: G.textDim, fontSize: 14, textDecoration: 'none' }}>Mes analyses</a>
<a href="#features" style={{ color: G.textDim, fontSize: 14, textDecoration: 'none' }}>Fonctionnalités</a>
          <a href="#pricing" style={{ color: G.textDim, fontSize: 14, textDecoration: 'none' }}>Tarifs</a>
          <a href="/contact" style={{ color: G.textDim, fontSize: 14, textDecoration: 'none' }}>Contact</a>
          <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: `1px solid ${G.gold}44`, borderRadius: 8, color: G.gold, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Connexion</button>
          <button onClick={() => router.push('/login')} style={{ background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, border: 'none', borderRadius: 8, color: '#000', padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 800 }}>Essai 7j gratuit</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 130, paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: `radial-gradient(ellipse,rgba(201,168,76,0.06) 0%,transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${G.gold}12`, border: `1px solid ${G.gold}30`, borderRadius: 20, padding: '6px 16px', fontSize: 13, color: G.gold, marginBottom: 28 }}>
              🎁 7 jours d'essai gratuit — Sans carte bancaire
            </div>
            <h1 style={{ fontSize: 'clamp(32px,4.5vw,58px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: -2, marginBottom: 22 }}>
              Le simulateur fiscal<br />
              <span style={{ background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>immo qui calcule vrai</span>
            </h1>
            <p style={{ fontSize: 18, color: G.textDim, lineHeight: 1.65, marginBottom: 36, maxWidth: 500 }}>
              Comparez SCI IS, LMNP Réel et Location Nue en temps réel. TRI, richesse nette, fiscalité à la revente — tout ce qu'un investisseur averti doit savoir avant de signer.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/login')} style={{ background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, border: 'none', borderRadius: 10, color: '#000', padding: '14px 30px', fontSize: 16, cursor: 'pointer', fontWeight: 800 }}>
                Démarrer gratuitement →
              </button>
              <a href="#pricing" style={{ background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, padding: '14px 24px', fontSize: 15, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                Voir les tarifs
              </a>
            </div>
            <div style={{ marginTop: 32, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['PFU 31,4% LFSS 2026', 'LF 2025 art.84 LMNP', 'IS 15%/25% 2026'].map(t => (
                <span key={t} style={{ color: G.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: G.gold }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>
          {/* Animated preview */}
          <div>
            <SimPreview />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginBottom: 14 }}>Tout ce dont vous avez besoin</h2>
          <p style={{ color: G.textDim, fontSize: 17 }}>Des calculs rigoureux, pas des estimations approximatives.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 12, padding: '22px 20px', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${G.gold}44`; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 7, color: G.text }}>{f.title}</div>
              <div style={{ color: G.textDim, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '60px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, textAlign: 'center', marginBottom: 48 }}>Ce qu'ils en disent</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 12, padding: '24px 22px' }}>
              <div style={{ color: G.gold, fontSize: 16, marginBottom: 14 }}>{'★'.repeat(t.stars)}</div>
              <p style={{ color: G.textDim, fontSize: 14, lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic' }}>"{t.text}"</p>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: G.text }}>{t.name}</div>
                <div style={{ color: G.textMuted, fontSize: 12, marginTop: 2 }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginBottom: 14 }}>Tarifs simples et transparents</h2>
          <p style={{ color: G.textDim, fontSize: 17 }}>7 jours d'essai gratuit — Annulez à tout moment</p>
        </div>

        {/* Code promo */}
        <div style={{ maxWidth: 440, margin: '0 auto 40px', background: G.s1, border: `1px solid ${G.border}`, borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ color: G.textDim, fontSize: 12, marginBottom: 8 }}>Vous avez un code parrainage ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Ex: CGP2026"
              onKeyDown={e => e.key === 'Enter' && applyPromo()}
              style={{ flex: 1, background: G.s2, border: `1px solid ${promoResult ? G.green : G.border}`, borderRadius: 6, color: G.text, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
            <button onClick={applyPromo} disabled={promoLoading}
              style={{ background: `${G.gold}22`, border: `1px solid ${G.gold}44`, borderRadius: 6, color: G.gold, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              {promoLoading ? '...' : 'Appliquer'}
            </button>
          </div>
          {promoError && <div style={{ color: G.gold, fontSize: 12, marginTop: 6 }}>⚠️ {promoError}</div>}
          {promoResult && <div style={{ color: G.green, fontSize: 12, marginTop: 6 }}>✓ Code {promoResult.code} appliqué — {promoResult.description}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 24 }}>
          {PLANS.map(plan => (
            <PricingCard key={plan.id} plan={plan} promoPrice={getPromoPrice(plan.id)} onSelect={handleSelect} loading={checkoutLoading === plan.id} />
          ))}
        </div>

        {/* Free tier */}
        <div style={{ background: '#080d18', border: `1px solid ${G.border}`, borderRadius: 10, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: G.text, marginBottom: 3 }}>Gratuit — 7 jours d'essai complet</div>
            <div style={{ color: G.textMuted, fontSize: 13 }}>Après 7 jours : KPIs & rendements uniquement. Pas de carte bancaire requise.</div>
          </div>
          <button onClick={() => router.push('/login')} style={{ background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 8, color: G.textDim, padding: '10px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Démarrer gratuitement
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '60px 24px', maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, textAlign: 'center', marginBottom: 40 }}>Questions fréquentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} r={f.r} />)}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.5, marginBottom: 18 }}>
            Simulez votre prochain<br />
            <span style={{ background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              investissement aujourd'hui
            </span>
          </h2>
          <p style={{ color: G.textDim, fontSize: 17, marginBottom: 32 }}>7 jours gratuits, sans engagement, sans carte bancaire.</p>
          <button onClick={() => router.push('/login')} style={{ background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, border: 'none', borderRadius: 12, color: '#000', padding: '16px 40px', fontSize: 17, cursor: 'pointer', fontWeight: 800 }}>
            Démarrer gratuitement →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${G.border}`, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⌂</span>
          <span style={{ fontWeight: 700, color: G.text }}>SimuImmo</span>
          <span style={{ color: G.textMuted, fontSize: 12 }}>— Outil pédagogique fiscal immobilier</span>
        </div>
        <div style={{ color: G.textMuted, fontSize: 11 }}>PFU 31,4% LFSS 2026 · LF 2025 art.84 · IS 15%/25% · CGI art.150 VC</div>
      </footer>
    </div>
  )
}

function FaqItem({ q, r }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
        <span style={{ color: G.text, fontWeight: 600, fontSize: 14 }}>{q}</span>
        <span style={{ color: G.gold, fontSize: 18, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
      </button>
      {open && <div style={{ padding: '0 20px 16px', color: G.textDim, fontSize: 13, lineHeight: 1.7 }}>{r}</div>}
    </div>
  )
}
