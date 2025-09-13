"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Updated interfaces to match the new backend model
interface Questionnaire1 {
    sellToBuy: string;
    maxBudget: string;
    needsMortgage: string;
    mortgagePercentage?: number;
    mortgagePreApproval: string;
    purchaseTimeline: string;
}

interface Questionnaire2 {
    searchZone: string;
    minBedrooms: number;
    mustHaveFeatures: string;
    searchDuration: string;
}

interface LeadDetails {
  _id: string;
  user: { name: string; surname: string; email: string; phone?: string; };
  property: { _id: string; title: string; rif: string; };
  status: string;
  createdAt: string;
  questionnaire1?: Questionnaire1;
  questionnaire2?: Questionnaire2;
  decisionPropertyInterest?: string; // new
  decisionZoneInterest?: string;     // new
  isContacted: boolean;
  calledBy?: { email: string; };
  callDate?: string;
  needsCallback: boolean;
  callbackDate?: string;
  notes: { text: string; employee: { email: string }; date: string; _id: string; }[];
}

// State for the call manager form
interface CallManagerData {
    isContacted: boolean;
    calledByEmail: string;
    callDate: string;
    noteText: string;
    needsCallback: boolean;
    callbackDate: string;
}

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [lead, setLead] = useState<LeadDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [callManager, setCallManager] = useState<CallManagerData>({
        isContacted: false,
        calledByEmail: '',
        callDate: '',
        noteText: '',
        needsCallback: false,
        callbackDate: '',
    });

    const [currentUserEmail, setCurrentUserEmail] = useState('');

    useEffect(() => {
        const storedEmail = localStorage.getItem('employeeEmail');
        if(storedEmail) setCurrentUserEmail(storedEmail);

        if (!id) return;
        const fetchLead = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('employeeAuthToken');
                if (!token) { router.push('/admin/login'); return; }
                const res = await fetch(`/api/leads/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Lead non trovato.');
                const data: LeadDetails = await res.json();
                setLead(data);
                setCallManager({
                    isContacted: data.isContacted || false,
                    calledByEmail: data.calledBy?.email || (data.isContacted ? '' : storedEmail || ''),
                    callDate: data.callDate ? new Date(data.callDate).toISOString().slice(0, 16) : '',
                    noteText: '',
                    needsCallback: data.needsCallback || false,
                    callbackDate: data.callbackDate ? new Date(data.callbackDate).toISOString().slice(0, 16) : '',
                });
            } catch (err: any) { setError(err.message); }
            finally { setLoading(false); }
        };
        fetchLead();
    }, [id, router]);

    const handleCallManagerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const { checked } = e.target as HTMLInputElement;
        setCallManager(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleUpdateCallDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setError(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }
            const res = await fetch(`/api/leads/${id}/call-details`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(callManager),
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Errore.');
            const updatedLead = await res.json();
            setLead(updatedLead);
            setCallManager(prev => ({...prev, noteText: ''}));
        } catch (err: any) { setError(err.message); }
        finally { setIsUpdating(false); }
    };

    if (loading) return <p className="text-center mt-8">Caricamento dettagli lead...</p>;
    if (error) return <p className="text-center text-red-600 mt-8">Errore: {error}</p>;
    if (!lead) return <p className="text-center mt-8">Nessun lead trovato.</p>;

    const renderQuestion = (label: string, value: any) => (
        value !== undefined && value !== null && value !== '' &&
        <li className="py-2"><span className="font-semibold">{label}:</span> {String(value)}</li>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-4">{lead.user.name} {lead.user.surname}</h1>
                <div className="space-y-1 text-gray-700 mb-6">
                    <p><strong>Email:</strong> {lead.user.email}</p>
                    <p><strong>Telefono:</strong> {lead.user.phone || 'Non fornito'}</p>
                    <p><strong>Immobile di interesse:</strong> {lead.property.title} (<Link href={`/admin/immobili/edit/${lead.property._id}`} className="text-blue-600 hover:underline">{lead.property.rif}</Link>)</p>
                    <p><strong>Stato attuale:</strong> <span className="font-semibold px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">{lead.status}</span></p>
                    <p><strong>Data Creazione Lead:</strong> {new Date(lead.createdAt).toLocaleString('it-IT')}</p>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h2 className="text-2xl font-bold mb-2">Decisioni Cliente</h2>
                    <ul className="divide-y divide-gray-200">
                        {renderQuestion('Interesse per l\'immobile', lead.decisionPropertyInterest)}
                        {renderQuestion('Feedback sulla zona', lead.decisionZoneInterest)}
                    </ul>
                </div>

                {lead.questionnaire1 && (
                    <div className="mt-6 border-t pt-4">
                        <h2 className="text-2xl font-bold mb-2">Questionario 1</h2>
                        <ul className="divide-y divide-gray-200">
                            {renderQuestion('Deve vendere per acquistare', lead.questionnaire1.sellToBuy)}
                            {renderQuestion('Budget massimo', lead.questionnaire1.maxBudget)}
                            {renderQuestion('Necessita mutuo', lead.questionnaire1.needsMortgage)}
                            {renderQuestion('Percentuale mutuo richiesta', lead.questionnaire1.mortgagePercentage ? `${lead.questionnaire1.mortgagePercentage}%` : undefined)}
                            {renderQuestion('Pre-approvazione mutuo', lead.questionnaire1.mortgagePreApproval)}
                            {renderQuestion('Tempistica di acquisto', lead.questionnaire1.purchaseTimeline)}
                        </ul>
                    </div>
                )}
                {lead.questionnaire2 && (
                     <div className="mt-6 border-t pt-4">
                        <h2 className="text-2xl font-bold mb-2">Questionario 2</h2>
                        <ul className="divide-y divide-gray-200">
                            {renderQuestion('Zona di ricerca', lead.questionnaire2.searchZone)}
                            {renderQuestion('Numero minimo di camere', lead.questionnaire2.minBedrooms)}
                            {renderQuestion('Cosa non può mancare', lead.questionnaire2.mustHaveFeatures)}
                            {renderQuestion('Da quanto tempo cerca', lead.questionnaire2.searchDuration)}
                        </ul>
                    </div>
                )}
            </div>

            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
                <form onSubmit={handleUpdateCallDetails} className="space-y-4">
                    <h2 className="text-2xl font-bold">Gestore Chiamate</h2>
                    <div className="flex items-center gap-2"><input type="checkbox" id="isContacted" name="isContacted" checked={callManager.isContacted} onChange={handleCallManagerChange} className="h-5 w-5" /><label htmlFor="isContacted">Lead già contattato</label></div>
                    {callManager.isContacted && (
                        <div className="pl-4 border-l-2 space-y-4">
                            <div><label htmlFor="calledByEmail" className="block font-semibold text-sm">Chiamato da</label><input type="email" id="calledByEmail" name="calledByEmail" value={callManager.calledByEmail} onChange={handleCallManagerChange} className="w-full p-2 border rounded-md mt-1" /></div>
                            <div><label htmlFor="callDate" className="block font-semibold text-sm">Data chiamata</label><input type="datetime-local" id="callDate" name="callDate" value={callManager.callDate} onChange={handleCallManagerChange} className="w-full p-2 border rounded-md mt-1" /></div>
                            <div><label htmlFor="noteText" className="block font-semibold text-sm">Note</label><textarea id="noteText" name="noteText" value={callManager.noteText} onChange={handleCallManagerChange} className="w-full p-2 border rounded-md mt-1" rows={4} placeholder="Inserisci qui le note della chiamata..."></textarea></div>
                        </div>
                    )}
                    <div className="flex items-center gap-2 pt-2"><input type="checkbox" id="needsCallback" name="needsCallback" checked={callManager.needsCallback} onChange={handleCallManagerChange} className="h-5 w-5" /><label htmlFor="needsCallback">Da richiamare</label></div>
                    {callManager.needsCallback && (
                        <div className="pl-4 border-l-2">
                             <div><label htmlFor="callbackDate" className="block font-semibold text-sm">Promemoria richiamo</label><input type="datetime-local" id="callbackDate" name="callbackDate" value={callManager.callbackDate} onChange={handleCallManagerChange} required className="w-full p-2 border rounded-md mt-1" /></div>
                        </div>
                    )}
                    <button type="submit" disabled={isUpdating} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">{isUpdating ? 'Salvataggio...' : 'Salva'}</button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </form>

                <div className="mt-6 border-t pt-4">
                    <h2 className="text-xl font-bold mb-2">Cronologia Note</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {lead.notes.slice().reverse().map((note) => (
                            <div key={note._id} className="bg-gray-100 p-3 rounded-md text-sm">
                                <p className="whitespace-pre-wrap">{note.text}</p>
                                <p className="text-xs text-gray-500 mt-1">Da: {note.employee?.email || 'N/A'} - {new Date(note.date).toLocaleString('it-IT')}</p>
                            </div>
                        ))}
                        {lead.notes.length === 0 && <p className="text-gray-500 text-sm">Nessuna nota presente.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
