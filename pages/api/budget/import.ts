import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // On n'accepte que les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const supabase = createPagesServerClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { transactions } = req.body;

  const formattedData = transactions.map((row: any) => ({
    user_id: session.user.id,
    bank_transaction_id: `csv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    account_id: 'export_manuel',
    date: row['Date'], // Adaptez au titre exact de votre colonne CSV
    amount: parseFloat(row['Montant'].replace(',', '.')),
    raw_label: row['Libellé'],
    category: row['Catégorie'],
  }));

  const { error } = await supabase.from('transactions').insert(formattedData);

  if (error) {
    console.error('Erreur Supabase:', error);
    return res.status(500).json({ error: 'Échec de l\'insertion' });
  }

  return res.status(200).json({ success: true });
}
