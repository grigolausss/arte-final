"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ArchivedLead {
  _id: string;
  user: { name: string; surname: string; email: string; phone?: string; };
  property: { title: string; rif: string; };
  status: string;
  updatedAt: string; // The date it was archived
}

export default function ArchivePage() {
  const router = useRouter();
  const [archivedLeads, setArchivedLeads] = useState<ArchivedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchArchivedLeads = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('employeeAuthToken');
        if (!token) { router.push('/admin/login'); return; }
        const res = await fetch(`${API_URL}/api/leads/archived`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Errore nel caricamento dell\'archivio.');
        const data = await res.json();
        setArchivedLeads(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArchivedLeads();
  }, [router]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return archivedLeads;
    return archivedLeads.filter(lead =>
      `${lead.user.name} ${lead.user.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.property.rif.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [archivedLeads, searchQuery]);

  if (loading) return <p className="text-center mt-8">Caricamento archivio...</p>;
  if (error) return <p className="text-center text-red-600 mt-8">Errore: {error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Archivio Lead Completati</h1>
      <p className="text-gray-600 mb-8">Questa pagina contiene tutti i lead il cui processo è stato completato e archiviato.</p>

      <div className="mb-4">
        <input
            type="text"
            placeholder="Cerca per nome, email, RIF..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full max-w-md p-2 border rounded-md"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold">Immobile (RIF)</th>
              <th className="p-4 font-semibold">Data Archiviazione</th>
              <th className="p-4 font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead._id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                    <div className="font-bold">{lead.user.name} {lead.user.surname}</div>
                    <div className="text-sm text-gray-500">{lead.user.email}</div>
                </td>
                <td className="p-4">
                    <div>{lead.property.title}</div>
                    <div className="text-sm text-gray-500">{lead.property.rif}</div>
                </td>
                <td className="p-4 text-sm text-gray-700">{new Date(lead.updatedAt).toLocaleDateString('it-IT')}</td>
                <td className="p-4">
                  <Link href={`/admin/leads/${lead._id}`} className="text-blue-600 hover:underline font-semibold">
                    Vedi Dettaglio
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && <p className="text-center py-8 text-gray-500">Nessun lead trovato nell'archivio.</p>}
      </div>
    </div>
  );
}
