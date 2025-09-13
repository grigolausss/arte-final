"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AlternativeProperty {
  _id: string;
  rif: string;
  title: string;
}

export default function AlternativesPage() {
    const params = useParams();
    const router = useRouter();
    const rif = params.rif as string;

    const [alternatives, setAlternatives] = useState<AlternativeProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!rif) return;
        const fetchAlternatives = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) { router.push('/'); return; }

                // This is a new, dedicated endpoint for fetching alternatives
                const response = await fetch(`/api/properties/${rif}/alternatives`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Errore nel caricamento delle alternative.');
                }
                const data = await response.json();
                setAlternatives(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAlternatives();
    }, [rif, router]);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold text-gray-800">Grazie per il feedback</h1>
                <p className="text-lg text-gray-600 mt-2">In base alle tue risposte, potrebbero interessarti queste soluzioni.</p>

                {loading && <p className="mt-8 text-xl">Caricamento alternative...</p>}
                {error && <p className="mt-8 text-red-600 text-xl">{error}</p>}

                {!loading && !error && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {alternatives.map(alt => (
                            <div key={alt._id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between text-left">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{alt.title}</h2>
                                    <p className="text-gray-500 mt-1">RIF: {alt.rif}</p>
                                </div>
                                <Link href={`/immobile/${alt.rif}`} className="mt-4 w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    Vedi informazioni
                                </Link>
                            </div>
                        ))}
                        {alternatives.length === 0 && <p className="col-span-full text-gray-500 mt-8">Nessuna alternativa trovata al momento.</p>}
                    </div>
                )}

                <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-700">Nessuna di queste alternative ti convince?</h2>
                    <p className="text-gray-600 my-2">Parla con un nostro consulente per una ricerca personalizzata.</p>
                    <Link href={`/ringraziamento/${rif}?source=alternatives-no`} className="inline-block mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors">
                        Parla con un consulente
                    </Link>
                </div>
            </div>
        </div>
    );
}
