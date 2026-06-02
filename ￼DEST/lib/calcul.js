/**
 * MOTEUR DE CALCUL AuditImmo v6 - CORRIGÉ ET COMPLET
 */

function buildLoan(principal, annRate, years, insRate) {
  if (principal <= 0 || years <= 0) return { schedule: [], monthly: 0 }
  const r = annRate / 12
  const n = years * 12
  const pmt = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n))
  const monthlyIns = (principal * insRate) / 12
  let bal = principal
  const schedule = []
  for (let y = 1; y <= Math.max(years, 30); y++) { // Étendu à 30 ans pour assurer le bloc horizons
    let intAnn = 0, capAnn = 0, assAnn = 0
    for (let m = 0; m < 12; m++) {
      const intM = bal * r
      const capM = bal > 0 ? pmt - intM : 0
      intAnn += intM; capAnn += capM; assAnn += monthlyIns
      bal = Math.max(0, bal - capM)
    }
    schedule.push({
      year: y,
      interest: intAnn,
      capital: capAnn,
      insurance: assAnn,
      balance: Math.max(0, bal),
      total: bal > 0 || capAnn > 0 ? (pmt + monthlyIns) * 12 : 0
    })
  }
  return { schedule, monthly: pmt + monthlyIns }
}

function irr(flows) {
  let r = 0.1
  for (let i = 0; i < 100; i++) {
    let npv = 0, dnpv = 0
    for (let t = 0; t < flows.length; t++) {
      npv += flows[t] / Math.pow(1 + r, t)
      if (t > 0) dnpv -= t * flows[t] / Math.pow(1 + r, t + 1)
    }
    if (Math.abs(npv) < 1e-6) return r
    if (dnpv === 0) break
    r = r - npv / dnpv
  }
  return r
}

export function compute(p) {
  const N = p.anCession || 20
  const maxYears = Math.max(N, 20) // Pour assurer que les années 10, 15 et 20 existent toujours

  // ── EMPRUNT ──────────────────────────────────────────────────────────────
  const notaireCalc = p.notaireManuel ? p.notaire : Math.round(p.prixAchat * 0.08)
  const chasseurTTC = p.chasseurTTC || 0
  const fraisAgenceAcq = p.agenceIncluse ? 0 : (p.agenceAcq || 0)
  const coutTotal = p.prixAchat + notaireCalc + chasseurTTC + fraisAgenceAcq + (p.travaux || 0)
  const empruntCalc = p.empruntManuel ? p.emprunt : Math.max(0, coutTotal - (p.apport || 0))

  const { schedule: loan, monthly: mensualite } = buildLoan(
    empruntCalc, p.taux, p.duree, p.assurance
  )

  // ── REVENUS ───────────────────────────────────────────────────────────────
  const loyerCCAnn = p.loyerCC * 12
  const loyerHCAnn = (p.loyerCC - (p.charges || 0)) * 12
  const loyerCCPondere = loyerCCAnn * (1 - (p.vacance || 0))
  const loyerHCPondere = loyerHCAnn * (1 - (p.vacance || 0))

  // ── CHARGES ───────────────────────────────────────────────────────────────
  const coproRec = p.coproRec || 0
  const coproNonRec = p.coproNonRec || 0
  const teom = p.teom || 0
  const fonciereDed = (p.fonciere || 0) - teom 

  const chargesCommunes = (p.gli || 0) + fonciereDed + coproNonRec
    + (p.pno || 0) + (p.gestion || 0) + (p.entretien || 0)

  // Amortissements
  const prorataBati = 1 - (p.terrain || 0.20)
  const baseAmortBien = p.prixAchat * prorataBati
  const amortBienAn = p.dAmortBien > 0 ? baseAmortBien / p.dAmortBien : 0
  const amortTravauxAn = p.dAmortTravaux > 0 ? (p.travaux || 0) / p.dAmortTravaux : 0
  const amortMobilierAn = p.dAmortMobilier > 0 ? (p.mobilier || 0) / p.dAmortMobilier : 0
  const amortNotaireAn = p.dAmortNotaire > 0 ? notaireCalc / p.dAmortNotaire : 0
  const amortChasseurAn = p.dAmortChasseur > 0 ? chasseurTTC / p.dAmortChasseur : 0

  // ── SIMULATION ANNUELLE ───────────────────────────────────────────────────
  const years = []
  let sciCumul = 0, lnCumul = 0, lmnpCumul = 0
  let sciCumulBI = 0, lnCumulBI = 0, lmnpCumulBI = 0
  let lnDeficit = 0, lmnpDiffere = 0
  let deficitReportIS = notaireCalc + chasseurTTC + fraisAgenceAcq

  for (let i = 1; i <= maxYears; i++) {
    const L = loan[i - 1] ?? { interest: 0, capital: 0, insurance: 0, balance: 0, total: 0 }
    const loyer = loyerCCPondere * Math.pow(1 + (p.revaloLoyer || 0), i - 1)
    const loyerHC = loyerHCPondere * Math.pow(1 + (p.revaloLoyer || 0), i - 1)
    const tmiEff = (p.anneeRetraite || 99) <= 99 && i >= (p.anneeRetraite || 99)
      ? (p.tmiRetraite || p.tmi) : p.tmi

    // SCI IS
    const chargesExplSCI = chargesCommunes + L.insurance + (p.cfe || 0) + (p.comptable || 0)
    const cfBISCI = loyer - chargesExplSCI - L.total

    const amortSCIAn = amortBienAn + (i <= (p.dAmortTravaux || 0) ? amortTravauxAn : 0)
    let rNetComptSCI = loyerHC - chargesExplSCI - L.interest - amortSCIAn

    if (deficitReportIS > 0) {
      if (rNetComptSCI > 0) {
        const imp = Math.min(rNetComptSCI, deficitReportIS)
        rNetComptSCI -= imp
        deficitReportIS -= imp
      } else {
        deficitReportIS += Math.abs(rNetComptSCI)
        rNetComptSCI = 0
      }
    } else if (rNetComptSCI < 0) {
      deficitReportIS += Math.abs(rNetComptSCI)
      rNetComptSCI = 0
    }
    const baseIS = Math.max(0, rNetComptSCI)
    const isSCI = baseIS > 0
      ? Math.min(baseIS, p.seuilIS) * p.isReduit + Math.max(0, baseIS - p.seuilIS) * p.isPlein : 0

    const cfSCI = cfBISCI - isSCI
    sciCumul += cfSCI
    sciCumulBI += cfBISCI

    // LOCATION NUE
    const chargesExplLN = chargesCommunes + L.insurance
    const cfBILN = loyer - chargesExplLN - L.total

    const rFoncier = loyerHC - chargesExplLN - L.interest
    let baseIRLN = rFoncier
    if (lnDeficit > 0 && baseIRLN > 0) {
      const imp = Math.min(baseIRLN, lnDeficit)
      baseIRLN -= imp; lnDeficit -= imp
    } else if (rFoncier < 0) {
      lnDeficit += Math.abs(rFoncier); baseIRLN = 0
    }
    const impotLN = baseIRLN > 0 ? baseIRLN * (tmiEff + p.ps) : 0
    const cfLN = cfBILN - impotLN
    lnCumul += cfLN
    lnCumulBI += cfBILN

    // LMNP RÉEL
    const chargesExplLMNP = chargesCommunes + L.insurance + (p.cfe || 0) + (p.comptable || 0)
    const cfBILMNP = loyer - chargesExplLMNP - L.total

    const totalAmortLMNP = amortBienAn
      + (i <= (p.dAmortTravaux || 0) ? amortTravauxAn : 0)
      + amortMobilierAn
      + (i <= (p.dAmortNotaire || 0) ? amortNotaireAn : 0)
      + (i <= (p.dAmortChasseur || 0) ? amortChasseurAn : 0)

    const rBicLMNP = loyerHC - chargesExplLMNP - L.interest - totalAmortLMNP
    let resNetLMNP = 0
    if (rBicLMNP > 0) {
      const util = Math.min(lmnpDiffere, rBicLMNP)
      lmnpDiffere -= util; resNetLMNP = rBicLMNP - util
    } else {
      lmnpDiffere += Math.abs(rBicLMNP)
    }
    const impotLMNP = resNetLMNP > 0 ? resNetLMNP * (tmiEff + p.ps) : 0
    const cfLMNP = cfBILMNP - impotLMNP
    lmnpCumul += cfLMNP
    lmnpCumulBI += cfBILMNP

    years.push({
      year: i, loyer, loyerHC,
      cfBISCI, cfSCI, sciCumul, sciCumulBI,
      cfBILN, cfLN, lnCumul, lnCumulBI,
      cfBILMNP, cfLMNP, lmnpCumul, lmnpCumulBI,
      isSCI, impotLN, impotLMNP,
      loanInt: L.interest, loanCap: L.capital,
      loanIns: L.insurance, loanBal: L.balance, loanTotal: L.total
    })
  }

  // ── FONCTION REVENTE MULTI-HORIZONS ──────────────────────────────────────
  const calcRevente = (targetYear) => {
    const pxVente = p.prixReventeManuel && p.prixRevente > 0 && targetYear === p.anCession
      ? p.prixRevente : p.prixAchat * Math.pow(1 + (p.revaloValeur || 0), targetYear)
    const fAg = p.fraisAgReventeManuel && p.fraisAgRevente > 0 && targetYear === p.anCession
      ? p.fraisAgRevente : pxVente * 0.05
    const pNet = pxVente - fAg
    const c_crd = targetYear <= p.duree ? (loan[targetYear - 1]?.balance ?? 0) : 0
    const c_ira = Math.min(c_crd * 0.03, 6 * (c_crd * p.taux / 12))
    const pDispo = pNet - c_ira

    const aIR = targetYear >= 22 ? 1 : targetYear >= 6 ? Math.min(1, (targetYear - 5) * 0.06) : 0
    const aPS = targetYear >= 30 ? 1 : targetYear >= 6 ? Math.min(1, (targetYear - 5) * 0.0165) : 0

    // SCI IS
    const vSCI = Math.max(0, baseAmortBien - amortBienAn * targetYear)
    const pSCI = pNet - vSCI
    const isPV = pSCI > 0 ? Math.min(pSCI, p.seuilIS) * p.isReduit + Math.max(0, pSCI - p.seuilIS) * p.isPlein : 0
    const prNetSCI = pDispo - isPV - c_crd
    const tCumSCI = years[targetYear - 1]?.sciCumul ?? 0
    const bSCI = tCumSCI + prNetSCI
    const fTax = bSCI > 0 ? bSCI * (p.pfu || 0.314) : 0
    const rSCI = bSCI - fTax

    // LN
    const prixRevientLN = p.prixAchat + notaireCalc + fraisAgenceAcq
    const pv_LN = pNet - prixRevientLN
    const imp_LN = pv_LN > 0 ? pv_LN * (1 - aIR) * 0.19 + pv_LN * (1 - aPS) * p.ps : 0
    const prNetLN = pDispo - imp_LN - c_crd
    const tCumLN = years[targetYear - 1]?.lnCumul ?? 0
    const rLN = tCumLN + prNetLN

    // LMNP
    const amReal = Math.min(targetYear, p.dAmortBien) * amortBienAn + Math.min(targetYear, p.dAmortTravaux || 0) * amortTravauxAn
    const pv_LMNP = pNet - p.prixAchat + amReal
    const imp_LMNP = pv_LMNP > 0 ? pv_LMNP * (1 - aIR) * 0.19 + pv_LMNP * (1 - aPS) * p.ps : 0
    const prNetLMNP = pDispo - imp_LMNP - c_crd
    const tCumLMNP = years[targetYear - 1]?.lmnpCumul ?? 0
    const rLMNP = tCumLMNP + prNetLMNP

    return {
      prixVente: pxVente, fraisAg: fAg, prixNet: pNet, crd: c_crd, ira: c_ira, prixDispo: pDispo,
      vncSCI: vSCI, pvSCI: pSCI, isSurPV: isPV, prodNetSCI: prNetSCI, tresoCumSCI: tCumSCI, boniSCI: bSCI, flatTax: fTax, richNetteSCI: rSCI,
      prixRevientLN, pvLN: pv_LN, impPVLN: imp_LN, prodNetLN: prNetLN, tresoCumLN: tCumLN, richLN: rLN,
      amortRealisesLMNP: amReal, pvLMNP: pv_LMNP, impPVLMNP: imp_LMNP, prodNetLMNP: prNetLMNP, tresoCumLMNP: tCumLMNP, richLMNP: rLMNP
    }
  }

  // Calcul Revente Principale (Annee N)
  const revN = calcRevente(N)

  // Horizons
  const horizons = {
    an10: calcRevente(10),
    an15: calcRevente(15),
    an20: revN
  }

  // ── TRI ───────────────────────────────────────────────────────────────────
  const inv = -((p.apport || 0) > 0 ? (p.apport || 0) : coutTotal)
  const fluxSCI = [inv, ...years.slice(0, N - 1).map(y => y.cfSCI),
    (years[N - 1]?.cfSCI ?? 0) + revN.prodNetSCI - revN.flatTax]
  const fluxLN = [inv, ...years.slice(0, N - 1).map(y => y.cfLN),
    (years[N - 1]?.cfLN ?? 0) + revN.prodNetLN]
  const fluxLMNP = [inv, ...years.slice(0, N - 1).map(y => y.cfLMNP),
    (years[N - 1]?.cfLMNP ?? 0) + revN.prodNetLMNP]

  // ── RENDEMENTS ───────────────────────────────────────────────────────────
  const rendBrut = loyerHCAnn / coutTotal
  const rendNet = (loyerHCAnn - chargesCommunes - (p.cfe || 0) - (p.comptable || 0)) / coutTotal
  
  const rendNetNetSCI = (years[0]?.cfSCI ?? 0) / coutTotal
  const rendNetNetLN = (years[0]?.cfLN ?? 0) / coutTotal
  const rendNetNetLMNP = (years[0]?.cfLMNP ?? 0) / coutTotal

  const verdict = revN.richNetteSCI >= revN.richLN && revN.richNetteSCI >= revN.richLMNP ? 'SCI IS'
    : revN.richLMNP >= revN.richLN ? 'LMNP Réel' : 'Location Nue'

  return {
    coutTotal, notaireCalc, empruntCalc, mensualite,
    loyerHCAnn, loyerCCAnn, loyerHCPondere, loyerCCPondere,
    chargesCommunes, fonciereDed, teom, coproRec, coproNonRec,
    coproTotale: coproRec + coproNonRec,
    loan, years,
    
    // Variables renvoyées au frontend pour l'année de cession
    prixVente: revN.prixVente, fraisAg: revN.fraisAg, prixNet: revN.prixNet, 
    crd: revN.crd, ira: revN.ira, prixDispo: revN.prixDispo,
    vncSCI: revN.vncSCI, pvSCI: revN.pvSCI, isSurPV: revN.isSurPV,
    prodNetSCI: revN.prodNetSCI, tresoCumSCI: revN.tresoCumSCI, boniSCI: revN.boniSCI, flatTax: revN.flatTax, richNetteSCI: revN.richNetteSCI,
    prixRevientLN: revN.prixRevientLN, pvLN: revN.pvLN, impPVLN: revN.impPVLN, prodNetLN: revN.prodNetLN, tresoCumLN: revN.tresoCumLN, richLN: revN.richLN,
    amortRealisesLMNP: revN.amortRealisesLMNP, pvLMNP: revN.pvLMNP, impPVLMNP: revN.impPVLMNP, prodNetLMNP: revN.prodNetLMNP, tresoCumLMNP: revN.tresoCumLMNP, richLMNP: revN.richLMNP,

    horizons,
    triSCI: irr(fluxSCI), triLN: irr(fluxLN), triLMNP: irr(fluxLMNP),
    rendBrut, rendNet, rendNetNetSCI, rendNetNetLN, rendNetNetLMNP,
    verdict,
  }
}
