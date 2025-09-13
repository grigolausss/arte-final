"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeForm from '@/components/admin/EmployeeForm';
import type { EmployeeData } from '@/components/admin/EmployeeForm';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NewUserPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (data: EmployeeData) => {
        setIsSaving(true);
        setError(null);
        setMessage(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }
            const res = await fetch(`${API_URL}/api/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            const responseData = await res.json();
            if (!res.ok) {
                throw new Error(responseData.message || 'Errore nella creazione dell\'utente.');
            }
            setMessage('Utente creato con successo! Verrai reindirizzato...');
            setTimeout(() => {
                router.push('/admin/utenti');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
            setIsSaving(false); // Stop loading on error
        }
        // No finally block needed here, as we only stop loading on error or navigate away on success
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/utenti" className="text-blue-600 hover:underline">
                    &larr; Torna alla lista
                </Link>
                <h1 className="text-3xl font-bold">Aggiungi Nuovo Utente</h1>
            </div>
            {message && <p className="text-center text-green-600 bg-green-100 p-3 rounded-md mb-4">{message}</p>}
            <EmployeeForm onSubmit={handleSubmit} isSaving={isSaving} error={error} isEditing={false} />
        </div>
    );
}
