import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Head from 'next/head';
import CommentForm from '../../components/CommentForm';
// À décommenter quand tu auras créé le composant !

export default function ArticleAuto({ articleData }) {
  return (
    <>
      <Head>
        <title>{articleData.title} | Audit Immo</title>
        <meta name="description" content={articleData.description} />
      </Head>

      <main style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{articleData.title}</h1>
        <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '30px' }}>
          Publié le {articleData.date}
        </p>

        {/* C'est ici que la magie opère : le texte Markdown converti est injecté */}
        <div 
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: articleData.contentHtml }}
        />
         <CommentForm articleSlug={articleData.slug} />
      </main>
    </>
  );
}

// 1. Lister tous les fichiers .md pour que Next.js sache quelles URLs créer
export async function getStaticPaths() {
  const articlesDirectory = path.join(process.cwd(), 'articles');
  const filenames = fs.readdirSync(articlesDirectory);
  
  const paths = filenames.map((filename) => ({
    params: { slug: filename.replace(/\.md$/, '') },
  }));

  return { paths, fallback: false };
}

// 2. Extraire le texte du fichier .md et le transformer en HTML
export async function getStaticProps({ params }) {
  const fullPath = path.join(process.cwd(), 'articles', `${params.slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);
  const processedContent = await remark().use(html).process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      articleData: {
        slug: params.slug,
        contentHtml,
        ...matterResult.data,
      },
    },
  };
}
