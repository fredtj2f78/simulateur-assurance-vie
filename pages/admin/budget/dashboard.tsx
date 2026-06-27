import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Card, Title, BarChart, Subtitle } from '@tremor/react';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorDiagnostic, setErrorDiagnostic] = useState<string | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: stats, error } = await supabase
          .from('stats_par_compte')
          .select('*');

        if (error) {
          // Si Supabase renvoie une erreur officielle
          setErrorDiagnostic(`Erreur Supabase : ${error.message} (Code: ${error.code})`);
        } else if (stats) {
          if (stats.length === 0) {
            // Si la connexion fonctionne mais qu'aucune ligne ne ressort
            setErrorDiagnostic("La vue a renvoyé 0 ligne. Problème probable de session ou de sécurité RLS.");
          } else {
            const formattedStats = stats.map((row: any) => ({
              ...row,
              total_decaisse_positif: Math.abs(row.total_decaisse)
            }));
            setData(formattedStats);
          }
        }
      } catch (err: any) {
        setErrorDiagnostic(`Erreur de code : ${err.message}`);
      } finally {
        setLoading(false);
      }
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
        ) : errorDiagnostic ? (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 font-mono text-sm">
            <p className="font-bold mb-1">⚠️ Diagnostic du problème :</p>
            <p className="whitespace-pre-wrap">{errorDiagnostic}</p>
            <p className="text-xs text-gray-500 mt-4">Pistes : Vérifiez que vous êtes bien connecté sur l'application ou que la Vue SQL a été créée.</p>
          </div>
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

