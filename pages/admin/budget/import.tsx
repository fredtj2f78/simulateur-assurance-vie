import { useState } from 'react';

export default function BudgetImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage('Veuillez sélectionner un fichier CSV.');
      return;
    }

    setLoading(true);
    setMessage('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setMessage('Le fichier semble vide ou invalide.');
        setLoading(false);
        return;
      }

      const firstLine = lines[0];
      let separator = ',';
      if (firstLine.includes('\t')) separator = '\t';
      else if (firstLine.includes(';')) separator = ';';

      const headers = firstLine.split(separator).map(h => h.trim());

      const transactions = lines.slice(1).map(line => {
        const values = line.split(separator).map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      try {
        const response = await fetch('/api/budget/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions }),
        });

        const result = await response.json();
        if (response.ok) {
          setMessage(`Succès ! ${result.count} transactions ont été importées.`);
          setFile(null);
        } else {
          setMessage(`Erreur lors de l'import : ${result.error}`);
        }
      } catch (err) {
        setMessage("Une erreur réseau est survenue lors de l'envoi.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto my-10 p-6 bg-white rounded-lg shadow-md" style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Importation Budget Linxo</h1>
      
      <div style={{ padding: '2rem', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center' }}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          style={{ marginBottom: '1.5rem', display: 'block', width: '100%' }} 
        />
        
        <button
          onClick={handleImport}
          disabled={loading || !file}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading ? '#ccc' : '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {loading ? 'Importation en cours...' : 'Lancer l\'importation'}
        </button>
      </div>

      {message && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px', fontWeight: '500' }}>
          {message}
        </div>
      )}
    </div>
  );
}
