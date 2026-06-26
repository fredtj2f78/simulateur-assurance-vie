import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function CommentForm({ articleSlug }) {
  const [email, setEmail] = useState('');
  const [contenu, setContenu] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus("L'adresse e-mail est obligatoire.");
      return;
    }
    setStatus('Envoi en cours...');

    const { error } = await supabase
      .from('commentaires_blog')
      .insert([{ article_slug: articleSlug, email: email, contenido: contenu }]);

    if (error) {
      setStatus('Une erreur est survenue.');
    } else {
      setStatus('Merci ! Votre commentaire a bien été envoyé.');
      setEmail('');
      setContenu('');
    }
  };

  return (
    <div style={{ marginTop: '50px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
      <h3 style={{ color: '#fff', marginTop: '0' }}>Laisser un commentaire</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Votre adresse e-mail (Obligatoire - ne sera pas publiée)" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required // Bloque la validation HTML si vide
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#000', color: '#fff' }}
        />
        <textarea 
          placeholder="Votre commentaire ou question..." 
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          required
          rows="4"
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#000', color: '#fff' }}
        />
        <button 
          type="submit" 
          style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Envoyer
        </button>
      </form>
      {status && <p style={{ marginTop: '10px', color: status.includes('Merci') ? '#00ff00' : '#ff0000' }}>{status}</p>}
    </div>
  );
}
