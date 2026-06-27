import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Utilisation de la fonction validée par le compilateur
  const supabase = createServerClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { transactions } = req.body;

  try {
    const formattedData = transactions.map((row: any) => {
      const rawAmount = row['Montant'] ? row['Montant'].replace(/\s/g, '').replace(',', '.') : '0';
      const parsedAmount = parseFloat(rawAmount);

      return {
        user_id: session.user.id,
        bank_transaction_id: `csv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        account_name: row['Nom du compte'] || 'Compte Inconnu',
        date: row['Date'], 
        amount: isNaN(parsedAmount) ? 0 : parsedAmount,
        raw_label: row['Libellé'] || '',
        category: row['Catégorie'] || 'Inconnue',
      };
    });

    const { error } = await supabase.from('transactions').insert(formattedData);

    if (error) throw error;

    return res.status(200).json({ success: true, count: formattedData.length });
  } catch (error) {
    console.error('Erreur lors de l\'importation :', error);
    return res.status(500).json({ error: 'Échec de l\'insertion des données' });
  }
}
