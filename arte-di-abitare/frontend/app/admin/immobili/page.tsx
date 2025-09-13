"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Property {
  _id: string;
  rif: string;
  title: string;
  zone: string;
  surface: number;
  price: number;
  status: string;
}

export default function PropertyListPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employeeAuthToken');
      if (!token) { router.push('/admin/login'); return; }
      const res = await fetch(`${API_URL}/api/properties`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Errore nel caricamento degli immobili.');
      const data = await res.json();
      setProperties(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo immobile? L\'azione è irreversibile.')) {
      try {
        const token = localStorage.getItem('employeeAuthToken');
        if (!token) { router.push('/admin/login'); return; }
        const res = await fetch(`${API_URL}/api/properties/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Errore durante l\'eliminazione.');
        }
        // Refresh the list after deleting
        fetchProperties();
      } catch (err: any) {
        alert(`Errore: ${err.message}`);
      }
    }
  };

  if (loading) return <p className="text-center">Caricamento immobili...</p>;
  if (error) return <p className="text-center text-red-600">Errore: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestione Immobili</h1>
        <Link href="/admin/immobili/new" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Aggiungi Nuovo Immobile
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-4">RIF</th>
              <th className="p-4">Titolo</th>
              <th className="p-4">Zona</th>
              <th className="p-4">Prezzo</th>
              <th className="p-4">Stato</th>
              <th className="p-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(prop => (
              <tr key={prop._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono">{prop.rif}</td>
                <td className="p-4">{prop.title}</td>
                <td className="p-4">{prop.zone}</td>
                <td className="p-4">€{prop.price.toLocaleString('it-IT')}</td>
                <td className="p-4">{prop.status}</td>
                <td className="p-4">
                  <Link href={`/admin/immobili/edit/${prop._id}`} className="text-blue-600 hover:underline font-semibold">
                    Modifica
                  </Link>
                  <button onClick={() => handleDelete(prop._id)} className="ml-4 text-red-600 hover:underline font-semibold">
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {properties.length === 0 && <p className="text-center py-8">Nessun immobile trovato.</p>}
      </div>
    </div>
  );
}
