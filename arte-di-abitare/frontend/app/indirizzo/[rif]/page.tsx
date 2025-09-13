"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AddressPage() {
  const params = useParams();
  const router = useRouter();
  const rif = params.rif as string;

  const [step, setStep] = useState('loading'); // loading, showingAddress, askingPhone, thankYou, error
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rif) return;

    const fetchAddress = async () => {
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Autenticazione richiesta.');

        const response = await fetch('/api/leads/final-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ propertyRif: rif, choice: 'discoverAddress' }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Errore nel recuperare l\'indirizzo.');

        setAddress(data.address);
        setStep('showingAddress');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    };

    fetchAddress();
  }, [rif]);

  const handleConfirmation = (isOkay: boolean) => {
    if (isOkay) {
        setStep('askingPhone');
    } else {
        router.push(`/alternative/${rif}`);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Autenticazione richiesta.');

        // This API call is just to save the phone number
        await fetch('/api/leads/final-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ propertyRif: rif, choice: 'discoverAddress', phone }),
        });

        setStep('thankYou');
        setTimeout(() => router.push('https://www.artediabitare.it'), 5000); // Redirect to main corporate site

    } catch (err: any) {
        setError(err.message);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return <p className="text-xl">Recupero l'indirizzo...</p>;
      case 'error':
        return <p className="text-red-600 text-xl">Errore: {error}</p>;
      case 'showingAddress':
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ecco l'indirizzo completo:</h2>
            <p className="text-3xl font-mono bg-gray-100 p-4 rounded-lg text-center my-4">{address}</p>
            <p className="text-xl text-gray-800 mt-8 mb-4">L'indirizzo va bene?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleConfirmation(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Sì</button>
              <button onClick={() => handleConfirmation(false)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">No, mostrami alternative</button>
            </div>
          </>
        );
      case 'askingPhone':
        return (
            <form onSubmit={handlePhoneSubmit}>
                <label htmlFor="phone" className="block text-xl font-semibold text-gray-800 mb-2">Ottimo! Lasciaci il tuo numero di telefono per essere ricontattato.</label>
                <input type="tel" name="phone" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md text-center text-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Il tuo numero di telefono" />
                {error && <p className="text-red-600 text-center mt-2">{error}</p>}
                <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Conferma e Invia</button>
            </form>
        );
      case 'thankYou':
        return (
            <>
                <h1 className="text-3xl font-bold text-green-600 mb-4">Grazie!</h1>
                <p className="text-lg text-gray-700">Un nostro consulente ti contatterà al più presto. Verrai reindirizzato al nostro sito principale tra 5 secondi.</p>
            </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
        {renderContent()}
      </div>
    </div>
  );
}
