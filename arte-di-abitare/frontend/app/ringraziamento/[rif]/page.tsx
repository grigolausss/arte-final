"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ThankYouPage() {
    const router = useRouter();
    const params = useParams();
    const rif = params.rif as string;

    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState('collectPhone'); // 'collectPhone' | 'finalThanks'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Autenticazione richiesta.');

            // New endpoint to save the user's phone number
            const response = await fetch(`${API_URL}/api/users/update-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ phone, rif }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Errore durante il salvataggio del numero.');
            }

            setStep('finalThanks');
            setTimeout(() => {
                window.location.href = 'https://www.artediabitare.it'; // Redirect to external site
            }, 5000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'finalThanks') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <h1 className="text-4xl font-bold text-green-600">Grazie!</h1>
                    <p className="text-lg text-gray-700 mt-4">Grazie per il tuo tempo. Un nostro consulente potrebbe contattarti.</p>
                    <p className="text-gray-500 mt-2">Verrai ora reindirizzato al nostro sito principale tra 5 secondi.</p>
                    <div className="mt-4 animate-pulse text-gray-400">...</div>
                    <p className="mt-6 text-sm text-gray-500">
                        Se non vieni reindirizzato, <a href="https://www.artediabitare.it" className="text-blue-600 underline">clicca qui</a>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800">Grazie</h1>
                <p className="text-gray-600 mt-2">Per essere richiamato da un consulente inserisci il tuo numero di telefono.</p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full p-3 border rounded-md text-center text-lg"
                        placeholder="Il tuo numero di telefono"
                    />
                    <p className="text-xs text-gray-500">Useremo questo numero solo per ricontattarti riguardo l'immobile.</p>
                    {error && <p className="text-red-500">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors disabled:bg-gray-400">
                        {isSubmitting ? 'Invio...' : 'Invia e continua'}
                    </button>
                </form>
            </div>
        </div>
    );
}
