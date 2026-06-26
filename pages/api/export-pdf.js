import { supabaseWithToken, supabaseAdmin } from '../../lib/supabase'
import { compute } from '../../lib/calcul'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' })
  const token = authHeader.split(' ')[1]

  const client = supabaseWithToken(token)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return res.status(401).json({ error: 'Token invalide' })

  const admin = supabaseAdmin()
  const { data: profile } = await admin.from('profiles').select('plan, trial_ends_at').eq('id', user.id).single()
  const now = new Date()
  const isPremium = ['premium_month', 'premium_year', 'premium_life'].includes(profile?.plan)
  const isTrial = profile?.plan === 'trial' && profile.trial_ends_at && new Date(profile.trial_ends_at) > now

  if (!isPremium && !isTrial) {
    return res.status(403).json({ error: 'Fonctionnalité réservée aux abonnés Premium' })
  }

  const { params } = req.body
  let result
  try { result = compute(params) } catch (e) { return res.status(400).json({ error: 'Paramètres invalides' }) }

  const nf = (v, d = 0) => v == null || isNaN(v) ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
  const eur = (v) => v == null || isNaN(v) ? '—' : `${nf(v)} €`
  const pct = (v, d = 1) => v == null || isNaN(v) ? '—' : `${nf(v * 100, d)} %`
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const cfSCIAn1 = result.years?.[0]?.cfSCI ?? 0
  const cfLNAn1 = result.years?.[0]?.cfLN ?? 0
  const cfLMNPAn1 = result.years?.[0]?.cfLMNP ?? 0
  const rnnSCI = pct(cfSCIAn1 / result.coutTotal)
  const rnnLN = pct(cfLNAn1 / result.coutTotal)
  const rnnLMNP = pct(cfLMNPAn1 / result.coutTotal)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>SimuImmo — ${params.adresse || 'Rapport'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:12px;line-height:1.5}
  .page{max-width:900px;margin:0 auto;padding:40px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c9a84c;padding-bottom:18px;margin-bottom:28px}
  .logo{font-size:20px;font-weight:900;color:#1a1a2e}.logo span{color:#c9a84c}
  .meta{text-align:right;font-size:11px;color:#666}
  .meta .addr{font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:3px}
  h2{font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#c9a84c;margin:24px 0 12px;padding-bottom:5px;border-bottom:1px solid #eee}
  table{width:100%;border-collapse:collapse;margin-bottom:18px}
  th{background:#1a1a2e;color:#fff;padding:7px 10px;text-align:left;font-size:10px;letter-spacing:0.5px}
  th:not(:first-child){text-align:right}
  td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:11px}
  td:not(:first-child){text-align:right;font-family:monospace}
  tr:nth-child(even) td{background:#fafafa}
  .winner td{background:#fff8e8!important;font-weight:700;color:#c9a84c}
  .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
  .kpi{background:#f8f8f8;border:1px solid #e8e8e8;border-radius:7px;padding:12px}
  .kpi-label{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
  .kpi-value{font-size:16px;font-weight:800;color:#1a1a2e}
  .verdict-box{background:linear-gradient(135deg,#1a1a2e,#2a2a4e);color:#fff;border-radius:10px;padding:18px 22px;margin-bottom:18px}
  .verdict-title{font-size:10px;color:#c9a84c;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
  .verdict-winner{font-size:20px;font-weight:900;color:#c9a84c}
  .disclaimer{margin-top:36px;padding:12px;background:#fef9ee;border:1px solid #e8d5a0;border-radius:6px;font-size:10px;color:#888;line-height:1.6}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">Simu<span>Immo</span> <span style="font-size:12px;color:#888">v29</span></div>
      <div style="font-size:10px;color:#888;margin-top:3px">Simulateur fiscal immobilier</div>
      <div style="font-size:10px;color:#c9a84c;margin-top:3px">🌐 auditimmo-001.vercel.app</div>
    </div>
    <div class="meta">
      <div class="addr">${params.adresse || 'Simulation immobilière'}</div>
      <div>Rapport généré le ${date}</div>
      <div>Durée : ${params.anCession} ans · Prix achat : ${eur(params.prixAchat)}</div>
    </div>
  </div>

  <h2>🏆 Verdict — Régime optimal</h2>
  <div class="verdict-box">
    <div class="verdict-title">Régime recommandé — Richesse nette maximale</div>
    <div class="verdict-winner">${result.verdict}</div>
    <div style="margin-top:10px;font-size:11px;color:#aaa">Basé sur la richesse nette finale après impôts et revente à an ${params.anCession}</div>
  </div>

  <h2>📈 KPIs & Rendements</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Coût total</div><div class="kpi-value">${eur(result.coutTotal)}</div></div>
    <div class="kpi"><div class="kpi-label">Rendement brut</div><div class="kpi-value">${pct(result.rendBrut)}</div></div>
    <div class="kpi"><div class="kpi-label">Rendement net charges</div><div class="kpi-value">${pct(result.rendNet)}</div></div>
    <div class="kpi"><div class="kpi-label">Mensualité</div><div class="kpi-value">${eur(result.mensualite)}/mois</div></div>
    <div class="kpi"><div class="kpi-label">Loyer HC annuel</div><div class="kpi-value">${eur(result.loyerHCAnn)}</div></div>
    <div class="kpi"><div class="kpi-label">Emprunt</div><div class="kpi-value">${eur(result.empruntCalc)}</div></div>
  </div>

  <h2>📊 Rendements net-net par régime (an 1)</h2>
  <table>
    <thead><tr><th>Régime</th><th>Rendement brut</th><th>Rendement net charges</th><th>Rendement net-net (après impôts)</th></tr></thead>
    <tbody>
      <tr><td>SCI IS</td><td>${pct(result.rendBrut)}</td><td>${pct(result.rendNet)}</td><td>${rnnSCI}</td></tr>
      <tr><td>Location Nue</td><td>${pct(result.rendBrut)}</td><td>${pct(result.rendNet)}</td><td>${rnnLN}</td></tr>
      <tr><td>LMNP Réel</td><td>${pct(result.rendBrut)}</td><td>${pct(result.rendNet)}</td><td>${rnnLMNP}</td></tr>
    </tbody>
  </table>

  <h2>💰 Synthèse comparative</h2>
  <table>
    <thead><tr><th>Indicateur</th><th>SCI IS</th><th>Location Nue</th><th>LMNP Réel</th></tr></thead>
    <tbody>
      <tr><td>Trésorerie (CF) cumulée</td><td>${eur(result.tresoCumSCI)}</td><td>${eur(result.tresoCumLN)}</td><td>${eur(result.tresoCumLMNP)}</td></tr>
      <tr><td>Produit net de cession</td><td>${eur(result.prodNetSCI)}</td><td>${eur(result.prodNetLN)}</td><td>${eur(result.prodNetLMNP)}</td></tr>
      <tr><td>Richesse brute SCI (avant Flat Tax)</td><td>${eur(result.richBruteSCI)}</td><td>—</td><td>—</td></tr>
      <tr><td>Flat Tax SCI (${pct(params.pfu)})</td><td>${eur(result.flatTax)}</td><td>—</td><td>—</td></tr>
      <tr class="${result.verdict === 'SCI IS' ? 'winner' : ''}"><td><b>★ Richesse nette SCI IS</b></td><td><b>${eur(result.richNetteSCI)}</b></td><td>—</td><td>—</td></tr>
      <tr class="${result.verdict === 'Location Nue' ? 'winner' : ''}"><td><b>★ Richesse nette Location Nue</b></td><td>—</td><td><b>${eur(result.richLN)}</b></td><td>—</td></tr>
      <tr class="${result.verdict === 'LMNP Réel' ? 'winner' : ''}"><td><b>★ Richesse nette LMNP Réel</b></td><td>—</td><td>—</td><td><b>${eur(result.richLMNP)}</b></td></tr>
    </tbody>
  </table>

  <h2>⚡ TRI par régime</h2>
  <table>
    <thead><tr><th>Régime</th><th>TRI net</th><th>Base de calcul</th></tr></thead>
    <tbody>
      <tr><td>SCI IS (net après Flat Tax)</td><td>${pct(result.triSCI, 2)}</td><td>Apport → CF annuels → cession an ${params.anCession}</td></tr>
      <tr><td>Location Nue</td><td>${pct(result.triLN, 2)}</td><td>Apport → CF annuels → cession an ${params.anCession}</td></tr>
      <tr><td>LMNP Réel</td><td>${pct(result.triLMNP, 2)}</td><td>Apport → CF annuels → cession an ${params.anCession}</td></tr>
    </tbody>
  </table>

  <h2>🔭 Sortie Multi-Horizons</h2>
  <table>
    <thead><tr><th>Régime</th><th>An 10</th><th>An 15</th><th>An ${params.anCession}</th></tr></thead>
    <tbody>
      <tr><td>Prix de revente estimé</td><td>${eur(result.horizons.an10.prixVente)}</td><td>${eur(result.horizons.an15.prixVente)}</td><td>${eur(result.horizons.an20.prixVente)}</td></tr>
      <tr><td>SCI IS — Richesse nette</td><td>${eur(result.horizons.an10.sciNette)}</td><td>${eur(result.horizons.an15.sciNette)}</td><td>${eur(result.horizons.an20.sciNette)}</td></tr>
      <tr><td>Location Nue — Richesse nette</td><td>${eur(result.horizons.an10.lnNette)}</td><td>${eur(result.horizons.an15.lnNette)}</td><td>${eur(result.horizons.an20.lnNette)}</td></tr>
      <tr><td>LMNP Réel — Richesse nette</td><td>${eur(result.horizons.an10.lmnpNette)}</td><td>${eur(result.horizons.an15.lmnpNette)}</td><td>${eur(result.horizons.an20.lmnpNette)}</td></tr>
    </tbody>
  </table>

  <h2>📋 Simulation annuelle SCI IS</h2>
  <table>
    <thead><tr><th>Année</th><th>Loyer HC</th><th>IS dû</th><th>CF mensuel</th><th>Tréso cumulée</th></tr></thead>
    <tbody>
      ${result.years.map(y => `<tr><td>An ${y.year}</td><td>${eur(y.loyer)}</td><td>${eur(y.isSCI)}</td><td>${eur(y.cfSCI / 12)}/mois</td><td>${eur(y.sciCumul)}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>🏷️ Détail Revente — An ${params.anCession}</h2>
  <table>
    <thead><tr><th>Poste</th><th>SCI IS</th><th>Location Nue</th><th>LMNP Réel</th></tr></thead>
    <tbody>
      <tr><td>Prix de revente</td><td colspan="3" style="text-align:center">${eur(result.prixVente)}</td></tr>
      <tr><td>Frais d'agence (déduits)</td><td colspan="3" style="text-align:center">${eur(result.fraisAg)}</td></tr>
      <tr><td>CRD remboursé</td><td colspan="3" style="text-align:center">${eur(result.crd)}</td></tr>
      <tr><td>IRA</td><td colspan="3" style="text-align:center">${eur(result.ira)}</td></tr>
      <tr><td>Impôt sur plus-value</td><td>${eur(result.isSurPV)}</td><td>${eur(result.impPVLN)}</td><td>${eur(result.impPVLMNP)}</td></tr>
      <tr><td>Produit net de cession</td><td>${eur(result.prodNetSCI)}</td><td>${eur(result.prodNetLN)}</td><td>${eur(result.prodNetLMNP)}</td></tr>
    </tbody>
  </table>

  <div class="disclaimer">
    ⚠️ <strong>Avertissement :</strong> SimuImmo est un outil pédagogique — <strong>auditimmo-001.vercel.app</strong>. PFU ${pct(params.pfu)} (LFSS 2026) · LF 2025 art. 84 LMNP · IS 15%/25% · Abattements PV (CGI art. 150 VC). Consultez un CGP ou avocat fiscaliste avant toute décision.
  </div>
</div>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="SimuImmo_${(params.adresse || 'rapport').replace(/\s/g, '_')}_an${params.anCession}.html"`)
  return res.status(200).send(html)
}
