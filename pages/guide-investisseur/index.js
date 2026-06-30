import React, { useState, useMemo } from 'react';


const ARTICLES = [
  {
    ref: '10',
    title: "Frais d'agence vs Chasseur immobilier : Quel impact fiscal sur votre Cash-flow ?",
    category: 'Fiscalité',
    date: '2026-06-28',
    excerpt: "Honoraires d'agence ou de chasse immobilière : comment le traitement comptable de ces frais d'acquisition influence directement votre imposition et votre cash-flow net.",
    slug: '/guide-investisseur/frais-agence-chasseur-fiscalite',
  },
  {
    ref: '09',
    title: "La Règle des 70 % en Immobilier : Mythe ou Réalité pour l'Autofinancement ?",
    category: 'Indicateurs & calculs',
    date: '2026-06-26',
    excerpt: "Analyse critique de la règle des 70 %. Pourquoi cette méthode empirique peut fausser vos calculs de cash-flow sans intégration rigoureuse des charges et de la fiscalité.",
    slug: '/guide-investisseur/regle-des-70-autofinancement',
  },
  {
    ref: '08',
    title: 'Montage SCI IS + holding : avantages, synergies et pièges à éviter',
    category: 'Stratégie patrimoniale',
    date: '2025-06-05',
    excerpt: 'Le montage SCI IS détenue par une holding offre des avantages fiscaux puissants. Régime mère-fille, transmission, centralisation de trésorerie — et les pièges à connaître.',
    slug: '/guide-investisseur/08-sci-is-holding-montage',
  },
  {
    ref: '07',
    title: 'TRI vs rendement brut : quel indicateur pour comparer vos investissements ?',
    category: 'Indicateurs & calculs',
    date: '2025-05-14',
    excerpt: "Rendement brut ou TRI ? Comprendre la différence entre ces deux indicateurs et savoir lequel utiliser pour prendre de meilleures décisions d'investissement.",
    slug: '/guide-investisseur/07-tri-vs-rendement-brut',
  },
  {
    ref: '06',
    title: 'Prix maximum d\u2019acquisition : comment le calculer pour un cash-flow équilibré',
    category: 'Indicateurs & calculs',
    date: '2025-04-22',
    excerpt: "Comment calculer le prix maximum d'un bien pour que votre investissement s'autofinance ? Méthode, exemple chiffré et utilisation dans la négociation.",
    slug: '/guide-investisseur/06-prix-maximum-acquisition-cash-flow',
  },
  {
    ref: '05',
    title: "SCI à l'IS : faut-il distribuer les bénéfices ou capitaliser dans la société ?",
    category: 'Stratégie patrimoniale',
    date: '2025-04-03',
    excerpt: "Distribuer ou capitaliser les bénéfices d'une SCI à l'IS ? Impact fiscal, boni de liquidation et stratégies selon votre profil d'investisseur.",
    slug: '/guide-investisseur/05-sci-is-distribution-capitalisation',
  },
  {
    ref: '04',
    title: 'Amortissements LMNP : nouvelles règles LF 2025 et impact sur votre stratégie',
    category: 'Fiscalité',
    date: '2025-03-10',
    excerpt: "La LF 2025 réintègre les amortissements LMNP dans le calcul de la plus-value de cession. Comprendre l'article 84 et adapter sa stratégie.",
    slug: '/guide-investisseur/04-amortissements-lmnp-lf2025',
  },
  {
    ref: '03',
    title: 'Déficit foncier : comment optimiser sa fiscalité en Location Nue',
    category: 'Fiscalité',
    date: '2025-02-20',
    excerpt: "Le déficit foncier permet d'imputer jusqu'à 10 700 € sur votre revenu global. Règles, limites, stratégies de travaux.",
    slug: '/guide-investisseur/03-deficit-foncier-location-nue',
  },
  {
    ref: '02',
    title: 'Rendement net net : les vraies charges à déduire pour ne pas se tromper',
    category: 'Indicateurs & calculs',
    date: '2025-02-05',
    excerpt: 'Le rendement brut est trompeur. Comment calculer le rendement net net en intégrant toutes les charges réelles et la fiscalité selon votre régime.',
    slug: '/guide-investisseur/02-rendement-net-net',
  },
  {
    ref: '01',
    title: "SCI à l'IS vs LMNP Réel : quel régime choisir pour votre investissement locatif ?",
    category: 'Fiscalité',
    date: '2025-01-15',
    excerpt: 'SCI à l\u2019IS ou LMNP Réel ? Comparatif complet : amortissement, cash-flow, fiscalité de sortie et transmission patrimoniale.',
    slug: '/guide-investisseur/01-sci-is-vs-lmnp-reel',
  },
];

const CATEGORIES = ['Tous', 'Fiscalité', 'Indicateurs & calculs', 'Stratégie patrimoniale'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function GuideInvestisseur() {
  const [active, setActive] = useState('Tous');

  const filtered = useMemo(
    () => (active === 'Tous' ? ARTICLES : ARTICLES.filter((a) => a.category === active)),
    [active]
  );

  return (
    <div style={{ background: '#0B0D12', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: '#E7E5DF' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .ref-mono { font-family: 'JetBrains Mono', monospace; }
        .display { font-family: 'Fraunces', Georgia, serif; }
        .article-row { transition: background 0.25s ease, padding-left 0.25s ease; }
        .article-row:hover { background: rgba(201,168,76,0.04); padding-left: 8px; }
        .article-row:hover .arrow { transform: translateX(4px); opacity: 1; }
        .article-row:hover .ref-mono { color: #C9A84C; }
        .arrow { transition: transform 0.25s ease, opacity 0.25s ease; opacity: 0.5; }
        .chip { transition: all 0.2s ease; }
        ::selection { background: #C9A84C; color: #0B0D12; }
      `}</style>

      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '0 24px 96px' }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0', borderBottom: '1px solid #1C1F27' }}>
            <a href="/" className="text-blue-600 font-bold hover:underline">
← Retour à Audit Immo
          </a>
          <span className="ref-mono" style={{ fontSize: '11px', color: '#4A4E5A', letterSpacing: '0.1em' }}>J2F CONSEIL</span>
        </div>

        {/* Header */}
        <header style={{ padding: '64px 0 48px', borderBottom: '1px solid #1C1F27' }}>
          <div className="ref-mono" style={{ fontSize: '11px', color: '#C9A84C', letterSpacing: '0.15em', marginBottom: '20px' }}>
            GUIDE INVESTISSEUR
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500, lineHeight: 1.15, marginBottom: '20px', color: '#F4F2EC' }}>
            Décrypter la fiscalité,<br />structurer le patrimoine.
          </h1>
          <p style={{ fontSize: '17px', color: '#9A9DA8', maxWidth: '520px', lineHeight: 1.6 }}>
            {ARTICLES.length} dossiers experts pour optimiser vos cash-flows nets et choisir la bonne
            structure d'acquisition — sans approximation.
          </p>
        </header>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '32px 0' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className="chip"
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                border: active === cat ? '1px solid #C9A84C' : '1px solid #232732',
                background: active === cat ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: active === cat ? '#C9A84C' : '#8B8F99',
              }}
            >
              {cat}
              {cat !== 'Tous' && (
                <span style={{ marginLeft: '6px', opacity: 0.6 }}>
                  {ARTICLES.filter((a) => a.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Article list */}
        <section>
          {filtered.map((art) => (
            <a
              key={art.slug}
              href={art.slug}
              className="article-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr 20px',
                gap: '20px',
                alignItems: 'start',
                padding: '28px 8px',
                borderBottom: '1px solid #1C1F27',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span className="ref-mono" style={{ fontSize: '13px', color: '#4A4E5A', paddingTop: '4px' }}>
                {art.ref}
              </span>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span className="ref-mono" style={{ fontSize: '10.5px', color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {art.category}
                  </span>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#3A3E48' }} />
                  <span style={{ fontSize: '12px', color: '#6B6F7A' }}>{formatDate(art.date)}</span>
                </div>
                <h2 className="display" style={{ fontSize: '21px', fontWeight: 500, color: '#F4F2EC', lineHeight: 1.35, marginBottom: '8px' }}>
                  {art.title}
                </h2>
                <p style={{ fontSize: '14.5px', color: '#888C97', lineHeight: 1.6, maxWidth: '640px' }}>
                  {art.excerpt}
                </p>
              </div>

              <span className="arrow" style={{ color: '#C9A84C', fontSize: '16px', paddingTop: '6px' }}>→</span>
            </a>
          ))}
        </section>

        <footer style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #1C1F27', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#4A4E5A' }}>J2F Conseil · SimuImmo</p>
        </footer>
      </main>
    </div>
  );
}
