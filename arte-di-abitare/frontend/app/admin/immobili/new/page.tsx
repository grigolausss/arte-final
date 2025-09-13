"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/admin/PropertyForm';
import type { PropertyData } from '@/components/admin/PropertyForm';

import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NewPropertyPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (data: FormData) => {
        setIsSaving(true);
        setError(null);
        setMessage(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }
            const res = await fetch(`${API_URL}/api/properties`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data,
            });
            const responseData = await res.json();
            if (!res.ok) {
                throw new Error(responseData.message || 'Errore nella creazione dell\'immobile.');
            }
            setMessage('Immobile creato con successo! Verrai reindirizzato...');
            setTimeout(() => {
                router.push('/admin/immobili');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/immobili" className="text-blue-600 hover:underline">
                    &larr; Torna alla lista
                </Link>
                <h1 className="text-3xl font-bold">Aggiungi Nuovo Immobile</h1>
            </div>
            {message && <p className="text-center text-green-600 bg-green-100 p-3 rounded-md mb-4">{message}</p>}
            <PropertyForm
                onSubmit={handleSubmit}
                isSaving={isSaving}
                error={error}
            />
        </div>
    );
}
