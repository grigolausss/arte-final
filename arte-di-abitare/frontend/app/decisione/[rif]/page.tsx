"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DecisionPage() {
    const params = useParams();
    const router = useRouter();
    const rif = params.rif as string;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDecision = async (choice: 'interessato' | 'non interessato') => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Autenticazione richiesta.');

            await fetch(`/api/leads/${rif}/decision-property`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ choice }),
            });

            if (choice === 'interessato') {
                router.push(`/zona/${rif}`);
            } else {
                router.push(`/alternative/${rif}`);
            }
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800">Cosa ne pensi?</h1>
                <p className="text-lg text-gray-600 mt-2">Grazie per aver completato il questionario. Ora hai due opzioni.</p>
                {error && <p className="text-red-500 mt-4">{error}</p>}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="border-2 border-green-500 rounded-lg p-6 flex flex-col items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-700">Sono interessato.</h2>
                        <p className="my-4 text-gray-600">Vorrei scoprire la zona esatta dell’immobile per valutare la posizione.</p>
                        <button onClick={() => handleDecision('interessato')} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:bg-gray-400">
                            {isLoading ? 'Salvataggio...' : 'Scopri la zona'}
                        </button>
                    </div>
                    <div className="border-2 border-red-500 rounded-lg p-6 flex flex-col items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-700">Non fa per me.</h2>
                        <p className="my-4 text-gray-600">L'immobile non mi convince. Vorrei spiegare il perché e vedere delle alternative.</p>
                        <button onClick={() => handleDecision('non interessato')} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:bg-gray-400">
                            {isLoading ? 'Salvataggio...' : 'Non sono interessato'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
