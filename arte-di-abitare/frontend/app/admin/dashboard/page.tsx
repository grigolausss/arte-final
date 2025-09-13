"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Lead interface for the dashboard cards
interface Lead {
  _id: string;
  user: { name: string; surname: string; email: string; phone?: string; };
  property: { title: string; rif: string; };
  status: string;
  createdAt: string;
  callbackDate?: string;
}

// Reusable Lead Card
const LeadCard = ({ lead }: { lead: Lead }) => (
    <div className="border p-4 rounded-md shadow-sm bg-white hover:shadow-md transition-shadow">
        <p className="font-bold text-lg">{lead.user.name} {lead.user.surname}</p>
        <p className="text-gray-600 text-sm">{lead.user.email}</p>
        <p className="text-gray-600 text-sm">{lead.user.phone || 'Nessun telefono'}</p>
        <p className="text-xs text-gray-500 mt-2">Immobile: {lead.property.rif}</p>
        <p className="text-xs text-gray-500">Data Lead: {new Date(lead.createdAt).toLocaleDateString('it-IT')}</p>
        {lead.callbackDate && <p className="text-xs font-semibold text-red-600">Richiamo: {new Date(lead.callbackDate).toLocaleString('it-IT')}</p>}
        <Link href={`/admin/leads/${lead._id}`} className="text-blue-600 hover:underline mt-2 inline-block font-semibold text-sm">
            Vedi dettaglio
        </Link>
    </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [hotLeads, setHotLeads] = useState<Lead[]>([]);
  const [warmLeads, setWarmLeads] = useState<Lead[]>([]);
  const [incompleteLeads, setIncompleteLeads] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const token = localStorage.getItem('employeeAuthToken');
        if (!token) { router.push('/admin/login'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch all lead categories in parallel
        const [hotRes, warmRes, incompleteRes, remindersRes] = await Promise.all([
            fetch(`${API_URL}/api/leads/hot`, { headers }),
            fetch(`${API_URL}/api/leads/warm`, { headers }),
            fetch(`${API_URL}/api/leads/incomplete`, { headers }),
            fetch(`${API_URL}/api/leads/reminders/today`, { headers })
        ]);

        if (!hotRes.ok || !warmRes.ok || !incompleteRes.ok || !remindersRes.ok) {
            throw new Error('Errore nel caricamento dei dati della dashboard.');
        }

        setHotLeads(await hotRes.json());
        setWarmLeads(await warmRes.json());
        setIncompleteLeads(await incompleteRes.json());
        setReminders(await remindersRes.json());

    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p className="text-center">Caricamento dashboard...</p>;
  if (error) return <p className="text-center text-red-600">Errore: {error}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Lead</h1>

      {/* Search is a complex feature to add on top of this structure, will be implemented later if needed */}

      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Promemoria di Oggi</h2>
          <div className="space-y-2">
            {reminders.length > 0 ? reminders.map(lead => (
                <div key={lead._id} className="flex justify-between items-center">
                    <span>Devi richiamare <strong>{lead.user.name} {lead.user.surname}</strong></span>
                    <Link href={`/admin/leads/${lead._id}`} className="text-blue-600 hover:underline font-semibold">Vai al lead</Link>
                </div>
            )) : <p>Nessun promemoria per oggi.</p>}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Da Richiamare Subito</h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 bg-gray-100 rounded-md">
                  {hotLeads.length > 0 ? hotLeads.map(lead => <LeadCard key={lead._id} lead={lead}/>) : <p className="text-gray-500 p-4">Nessun lead da richiamare subito.</p>}
              </div>
          </div>
          <div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Da Richiamare</h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 bg-gray-100 rounded-md">
                  {warmLeads.length > 0 ? warmLeads.map(lead => <LeadCard key={lead._id} lead={lead}/>) : <p className="text-gray-500 p-4">Nessun lead da richiamare.</p>}
              </div>
          </div>
          <div>
              <h2 className="text-2xl font-bold text-gray-600 mb-4">Lead non Completati</h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 bg-gray-100 rounded-md">
                  {incompleteLeads.length > 0 ? incompleteLeads.map(lead => <LeadCard key={lead._id} lead={lead}/>) : <p className="text-gray-500 p-4">Nessun lead incompleto.</p>}
              </div>
          </div>
      </div>
    </div>
  );
}
