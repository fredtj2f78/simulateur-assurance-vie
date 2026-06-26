import React from 'react';

export default function TableauComparatif({ data, prixMax }) {
  if (!data) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
  const formatPercent = (val) => (val !== undefined && val !== null) ? `${val.toFixed(2)} %` : '-';
  const formatPrix = (val) => val != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
    : '—';

  return (
    <div className="overflow-x-auto my-8">
      <h3 className="text-xl font-bold mb-4">Comparatif des Montages</h3>
      <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border text-left">Indicateur</th>
            <th className="px-4 py-2 border text-center">Location Nue</th>
            <th className="px-4 py-2 border text-center">LMNP</th>
            <th className="px-4 py-2 border text-center">SCI IS</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">EBE (Excédent Brut d'Exploitation)</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.nue?.ebe)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.lmnp?.ebe)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.sci?.ebe)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">Cash Flow (Après Impôt)</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.nue?.cashFlow)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.lmnp?.cashFlow)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatCurrency(data.sci?.cashFlow)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">Rendement Brut</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.nue?.rendBrut)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.lmnp?.rendBrut)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.sci?.rendBrut)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">Rendement Net</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.nue?.rendNet)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.lmnp?.rendNet)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.sci?.rendNet)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 border font-semibold">TRI (Taux de Rentabilité Interne)</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.nue?.tri)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.lmnp?.tri)}</td>
            <td className="px-4 py-2 border text-center text-gray-700">{formatPercent(data.sci?.tri)}</td>
          </tr>

          {/* ── PRIX MAX POUR CF = 0 ── */}
          {prixMax && (
            <tr className="bg-amber-50 border-t-2 border-amber-300">
              <td className="px-4 py-2 border font-semibold text-amber-800">
                Prix FAI max (CF an1 = 0)
                <span className="block text-xs font-normal text-amber-600">
                  Notaire 8% + emprunt recalculés
                </span>
              </td>
              <td className="px-4 py-2 border text-center font-bold text-amber-900">
                {formatPrix(prixMax.prixMaxLN)}
              </td>
              <td className="px-4 py-2 border text-center font-bold text-amber-900">
                {formatPrix(prixMax.prixMaxLMNP)}
              </td>
              <td className="px-4 py-2 border text-center font-bold text-amber-900">
                {formatPrix(prixMax.prixMaxSCI)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}