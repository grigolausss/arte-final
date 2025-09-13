"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ZoneData {
  zoneImage: string; // just the filename
  title: string;
}

export default function ZonePage() {
    const params = useParams();
    const router = useRouter();
    const rif = params.rif as string;

    const [zoneData, setZoneData] = useState<ZoneData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!rif) return;
        const fetchZoneImage = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) { router.push('/'); return; }
                const response = await fetch(`/api/properties/${rif}/zone`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error((await response.json()).message || 'Dati della zona non trovati.');
                const data = await response.json();
                setZoneData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchZoneImage();
    }, [rif, router]);

    const handleDecision = async (choice: 'zona va bene' | 'zona non va bene') => {
        setIsSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Autenticazione richiesta.');
            await fetch(`/api/leads/${rif}/decision-zone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ choice }),
            });
            if (choice === 'zona va bene') {
                router.push(`/ringraziamento/${rif}?source=zona-ok`);
            } else {
                router.push(`/alternative/${rif}?source=zona-no`);
            }
        } catch (err: any) {
            setError(err.message);
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><p>Caricamento...</p></div>;
    if (error) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600">{error}</p></div>;
    if (!zoneData) return <div className="flex justify-center items-center min-h-screen"><p>Dati non trovati.</p></div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800">Zona</h1>
                <p className="text-lg text-gray-600 mt-2 mb-6">Ecco la zona dell'immobile: {zoneData.title}</p>
                <div className="mb-8 border rounded-lg">
                    <img
                        src={`${API_BASE_URL}/uploads/${zoneData.zoneImage}`}
                        alt={`Zona per ${zoneData.title}`}
                        className="rounded-lg w-full h-auto"
                    />
                </div>
                {error && <p className="text-red-500 my-4">{error}</p>}
                <div className="bg-blue-50 p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-blue-800 mb-4">Ora che conosci la zona esatta, cosa ne pensi?</h2>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <button onClick={() => handleDecision('zona va bene')} disabled={isSaving} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:bg-gray-400">
                            {isSaving ? '...' : 'La zona va bene'}
                        </button>
                        <button onClick={() => handleDecision('zona non va bene')} disabled={isSaving} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:bg-gray-400">
                             {isSaving ? '...' : 'La zona non va bene'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
