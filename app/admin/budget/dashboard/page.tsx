"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { DonutChart, Legend, Card, Metric, Text, Grid } from '@tremor/react';

export default function Dashboard() {
  const [dataComptes, setDataComptes] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [dataCategories, setDataCategories] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any>({ total_recettes: 0, total_depenses: 0, total_incompressibles: 0 });
  const [fraisPeriodiques, setFraisPeriodiques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [resComptes, resEng, resCats, resKpi, resFrais] = await Promise.all([
          supabase.from('stats_par_compte').select('*'),
          supabase.from('engagements_futurs').select('*').order('date_echeance', { ascending: true }),
          supabase.from('stats_par_categorie').select('*'),
          supabase.from('kpi_globaux').select('*').single(),
          supabase.from('frais_periodiques').select('*')
        ]);

        if (resComptes.data) setDataComptes(resComptes.data.map((row: any) => ({ ...row, total_decaisse_positif: Math.abs(row.total_decaisse) })));
        if (resEng.data) setEngagements(resEng.data);
        if (resCats.data) setDataCategories(resCats.data);
        if (resKpi.data) setKpi(resKpi.data);
        if (resFrais.data) setFraisPeriodiques(resFrais.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [supabase]);

  const valueFormatter = (number: number) =>
    Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(number);

  const chartColors = ["blue", "cyan", "indigo", "violet", "fuchsia", "emerald", "amber", "rose", "gray"];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">Chargement de l'architecture Audit Immo...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Tableau de bord - Audit Immo</h1>
      
      {/* KPI HAUT DE PAGE */}
      <Grid numItemsSm={2} numItemsLg={3} className="gap-6 mb-8">
        <Card decoration="top" decorationColor="emerald">
          <Text>Recettes Totales</Text>
          <Metric>{valueFormatter(kpi.total_recettes)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="rose">
          <Text>Dépenses Totales</Text>
          <Metric>{valueFormatter(kpi.total_depenses)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Incompressibles (Point Mort)</Text>
          <Metric>{valueFormatter(kpi.total_incompressibles)}</Metric>
          <Text className="mt-2 text-xs text-gray-500">
            {kpi.total_recettes > 0 ? Math.round((kpi.total_incompressibles / kpi.total_recettes) * 100) : 0}% de vos recettes
          </Text>
        </Card>
      </Grid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* CAMEMBERT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Répartition des Dépenses</h2>
          <div className="flex flex-col items-center justify-center">
            <DonutChart className="h-64 mb-4" data={dataCategories} category="total_depense" index="categorie" valueFormatter={valueFormatter} colors={chartColors} />
            <Legend categories={dataCategories.map((c) => c.categorie).slice(0, 6)} colors={chartColors} />
          </div>
        </div>

        {/* FRAIS PÉRIODIQUES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Frais Périodiques & Charges</h2>
          <p className="text-gray-500 mb-4 text-sm">Détection automatique des récurrences</p>
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-bold">Libellé Brut</th>
                  <th className="px-4 py-3 font-bold text-center">Occurrences</th>
                  <th className="px-4 py-3 font-bold text-right">Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {fraisPeriodiques.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 truncate max-w-[200px]">{row.libelle}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{row.frequence}x</td>
                    <td className="px-4 py-3 text-right text-rose-600 font-bold">{valueFormatter(row.montant_moyen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COMPTES ET ENGAGEMENTS (Conservés) */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Soldes par compte bancaire</h2>
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-bold">Compte</th>
                <th className="px-6 py-4 font-bold text-right">Encaissé</th>
                <th className="px-6 py-4 font-bold text-right">Décaissé</th>
              </tr>
            </thead>
            <tbody>
              {dataComptes.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{row.account_name}</td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-bold">{valueFormatter(row.total_encaisse)}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-bold">{valueFormatter(row.total_decaisse_positif)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
