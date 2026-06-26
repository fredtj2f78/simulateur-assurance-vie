import { useState } from 'react';
import Papa from 'papaparse';

export default function ImportCSV() {
  const [status, setStatus] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Lecture du fichier...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setStatus('Envoi vers la base de données...');
        
        try {
          const response = await fetch('/api/budget/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: results.data }),
          });

          if (response.ok) {
            setStatus('Import réussi ! Les données sont dans Supabase.');
          } else {
            setStatus('Erreur lors de l\'import.');
          }
        } catch (error) {
          setStatus('Erreur de connexion serveur.');
        }
      },
    });
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow-sm border mt-10">
      <h2 className="text-xl font-bold mb-4">Importer un export Linxo (CSV)</h2>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500 mb-4"
      />
      {status && <p className="text-sm font-medium text-gray-700">{status}</p>}
    </div>
  );
}
