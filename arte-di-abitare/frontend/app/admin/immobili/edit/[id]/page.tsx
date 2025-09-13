"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PropertyForm from '@/components/admin/PropertyForm';
import Link from 'next/link';

// The PropertyData interface from the form is not directly used here anymore
// since handleSubmit receives FormData.

export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    // The state can be simplified as initialData for the form will be fetched
    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchProperty = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('employeeAuthToken');
                if (!token) { router.push('/admin/login'); return; }

                const res = await fetch(`/api/properties/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Immobile non trovato o errore nel fetch.');

                const data = await res.json();
                setInitialData(data);

            } catch (err: any) {
                setError(err.message);
                console.error("Failed to fetch property:", err);
            }
            finally { setIsLoading(false); }
        };
        fetchProperty();
    }, [id, router]);

    const handleSubmit = async (data: FormData) => {
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }

            // When sending FormData, the browser sets the Content-Type header automatically.
            const res = await fetch(`/api/properties/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data, // Pass FormData directly
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Errore nell\'aggiornamento dell\'immobile.');
            }
            router.push('/admin/immobili');
        } catch (err: any) {
            setError(err.message);
            console.error("Failed to update property:", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <p className="text-center mt-8">Caricamento dati immobile...</p>;
    if (error && !initialData) return <p className="text-center text-red-600 mt-8">Errore: {error}</p>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                 <Link href="/admin/immobili" className="text-blue-600 hover:underline">
                    &larr; Torna alla lista
                </Link>
                <h1 className="text-3xl font-bold">Modifica Immobile <span className="text-gray-500 font-mono">{initialData?.rif}</span></h1>
            </div>
            {initialData && (
                <PropertyForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isSaving={isSaving}
                    error={error}
                />
            )}
        </div>
    );
}
