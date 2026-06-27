import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Card, Title, BarChart, Subtitle } from '@tremor/react';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Utilisation du nom de fonction exact réclamé par le compilateur
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);




  useEffect(() => {
    async function fetchStats() {
      const { data: stats, error } = await supabase
        .from('stats_par_compte')
        .select('*');

      if (!error && stats) {
        // Transformation des décaissements (négatifs) en positifs pour l'affichage Tremor
        const formattedStats = stats.map((row: any) => ({
          ...row,
          total_decaisse_positif: Math.abs(row.total_decaisse)
        }));
        setData(formattedStats);
      }
      setLoading(false);
    }

    fetchStats();
  }, [supabase]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Tableau de bord - Audit Immo</h1>
      
      <Card>
        <Title>Flux financiers par compte</Title>
        <Subtitle>Comparaison des encaissements et décaissements sur toute la période</Subtitle>
        
        {loading ? (
          <div className="h-72 flex items-center justify-center text-gray-500">Chargement des données...</div>
        ) : (
          <BarChart
            className="mt-6 h-72"
            data={data}
            index="account_name"
            categories={["total_encaisse", "total_decaisse_positif"]}
            colors={["emerald", "red"]}
            valueFormatter={(number: number) => 
              Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(number)
            }
          />
        )}
      </Card>
    </div>
  );
}
