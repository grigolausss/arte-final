"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Employee {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UserListPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('employeeAuthToken');
      if (!token) { router.push('/admin/login'); return; }
      const res = await fetch(`${API_URL}/api/employees`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Errore nel caricamento degli utenti.');
      const data = await res.json();
      setEmployees(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente? L\'azione è irreversibile.')) {
      try {
        const token = localStorage.getItem('employeeAuthToken');
        if (!token) { router.push('/admin/login'); return; }
        const res = await fetch(`${API_URL}/api/employees/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Errore durante l\'eliminazione.');
        }
        fetchEmployees();
      } catch (err: any) {
        alert(`Errore: ${err.message}`);
      }
    }
  };

  if (loading) return <p className="text-center">Caricamento utenti...</p>;
  if (error) return <p className="text-center text-red-600">Errore: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestione Utenti Dipendenti</h1>
        <Link href="/admin/utenti/new" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Aggiungi Nuovo Utente
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-4">Email</th>
              <th className="p-4">Ruolo</th>
              <th className="p-4">Data Creazione</th>
              <th className="p-4">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp._id} className="border-b hover:bg-gray-50">
                <td className="p-4">{emp.email}</td>
                <td className="p-4">{emp.role}</td>
                <td className="p-4">{new Date(emp.createdAt).toLocaleDateString('it-IT')}</td>
                <td className="p-4">
                  <Link href={`/admin/utenti/edit/${emp._id}`} className="text-blue-600 hover:underline font-semibold">
                    Modifica
                  </Link>
                  <button onClick={() => handleDelete(emp._id)} className="ml-4 text-red-600 hover:underline font-semibold">
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && <p className="text-center py-8">Nessun utente trovato.</p>}
      </div>
    </div>
  );
}
