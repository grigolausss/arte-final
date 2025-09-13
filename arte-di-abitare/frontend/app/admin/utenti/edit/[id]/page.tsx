"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EmployeeForm from '@/components/admin/EmployeeForm';
import type { EmployeeData } from '@/components/admin/EmployeeForm';
import Link from 'next/link';

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [employee, setEmployee] = useState<Partial<EmployeeData> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchEmployee = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('employeeAuthToken');
                if (!token) { router.push('/admin/login'); return; }
                const res = await fetch(`/api/employees/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Utente non trovato.');
                const data = await res.json();
                setEmployee(data);
            } catch (err: any) { setError(err.message); }
            finally { setIsLoading(false); }
        };
        fetchEmployee();
    }, [id, router]);

    const handleSubmit = async (data: EmployeeData) => {
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }

            // Don't send an empty password field if it's not being changed
            const { password, ...updateData } = data;
            const payload = password ? data : updateData;

            const res = await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Errore nell\'aggiornamento dell\'utente.');
            }
            router.push('/admin/utenti');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <p className="text-center">Caricamento utente...</p>;
    if (error && !employee) return <p className="text-center text-red-600">Errore: {error}</p>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                 <Link href="/admin/utenti" className="text-blue-600 hover:underline">
                    &larr; Torna alla lista
                </Link>
                <h1 className="text-3xl font-bold">Modifica Utente <span className="text-gray-500">{employee?.email}</span></h1>
            </div>
            <EmployeeForm initialData={employee || {}} onSubmit={handleSubmit} isSaving={isSaving} error={error} isEditing={true} />
        </div>
    );
}
