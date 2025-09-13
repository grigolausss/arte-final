"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RifSearchPage() {
    const router = useRouter();
    const [rif, setRif] = useState('');

    useEffect(() => {
        // This is a protected route, check for token
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/');
        }
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rif) {
            // Redirect to the dynamic property page
            router.push(`/immobile/${rif.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-blue-900 mb-2 text-center">Inserisci il RIF dell’immobile.</h1>
                <p className="text-center text-gray-500 mb-6">Esempi: R806, R530-D, G210.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="rif" className="sr-only">Codice RIF immobile</label>
                        <input
                            type="text"
                            id="rif"
                            value={rif}
                            onChange={(e) => setRif(e.target.value)}
                            required
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-center text-xl"
                            placeholder="Codice RIF"
                        />
                    </div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        Cerca Immobile
                    </button>
                </form>
            </div>
        </div>
    );
}
