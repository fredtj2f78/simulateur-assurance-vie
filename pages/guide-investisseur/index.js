import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Head from 'next/head';
import Link from 'next/link';

export default function GuideInvestisseur({ articles }) {
  return (
    <>
      <Head>
        <title>Guide Investisseur | Analyses & Stratégies - Audit Immo</title>
        <meta name="description" content="Découvrez nos analyses détaillées et nos comparatifs fiscaux pour maximiser la rentabilité de vos projets immobiliers." />
      </Head>

      <main style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '2rem', borderBottom: '2px solid #eaeaea', paddingBottom: '10px' }}>
          Guide Investisseur : Analyses & Stratégies
        </h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>
          Retrouvez ici nos dossiers experts pour décrypter la fiscalité, optimiser vos cash-flows nets et structurer votre patrimoine avec précision.
        </p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* La boucle magique qui crée une carte pour chaque fichier .md */}
          {articles.map((article) => (
            <article key={article.slug} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h2 style={{ marginTop: '0', fontSize: '1.5rem' }}>
                <Link href={`/guide-investisseur/${article.slug}`} style={{ textDecoration: 'none', color: '#0070f3' }}>
                  {article.title}
                </Link>
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px', fontStyle: 'italic' }}>
                Publié le {article.date}
              </p>
              <p style={{ color: '#444' }}>
                {article.description}
              </p>
              <Link href={`/guide-investisseur/${article.slug}`} style={{ fontWeight: 'bold', color: '#0070f3' }}>
                Lire l'analyse complète →
              </Link>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

// Cette fonction s'exécute côté serveur pour lire tes fichiers .md
export async function getStaticProps() {
  const articlesDirectory = path.join(process.cwd(), 'articles');
  
  // On vérifie si le dossier existe pour éviter une erreur
  if (!fs.existsSync(articlesDirectory)) {
    return { props: { articles: [] } };
  }

  const filenames = fs.readdirSync(articlesDirectory);

  const articles = filenames.map((filename) => {
    // On enlève le ".md" pour créer l'URL (le slug)
    const slug = filename.replace(/\.md$/, '');

    // On lit le contenu du fichier
    const fullPath = path.join(articlesDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // On extrait le titre, la date et la description du haut du fichier
    const matterResult = matter(fileContents);

    return {
      ...matterResult.data,
      slug,
    };
  });

  // On trie les articles du plus récent au plus ancien
  const sortedArticles = articles.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    props: {
      articles: sortedArticles,
    },
  };
}

