"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, surname, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Errore durante la richiesta del codice OTP.');
      }
      // Redirect to the OTP verification page, passing the email as a query param
      router.push(`/verifica-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 text-gray-800 flex flex-col">
      <header className="flex justify-end p-4">
        <Link href="/admin/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
          Area Dipendenti
        </Link>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">
            Accedi ai dettagli dell’immobile. Verifica la tua e-mail per continuare.
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700">Cognome</label>
              <input type="text" id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div className="flex items-center">
              <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
              <label htmlFor="consent" className="ml-2 block text-sm text-gray-900">
                Acconsento al <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">trattamento dei dati personali</Link>
              </label>
            </div>
            {error && <p className="text-red-600 text-center text-sm">{error}</p>}
            <button type="submit" disabled={!consent || isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
              {isLoading ? 'Invio...' : 'Ricevi codice OTP'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
