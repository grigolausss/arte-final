"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// State for the second questionnaire
interface Answers {
  searchZone: string;
  minBedrooms: 1 | 2 | 3 | '';
  mustHaveFeatures: string;
  searchDuration: 'meno di 1 mese' | '1-3 mesi' | '3-6 mesi' | 'più di 6 mesi' | '';
}

// Reusable button for selecting options
const ChoiceButton = ({ text, onClick, isSelected }: { text: string; onClick: () => void; isSelected: boolean; }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 rounded-lg border-2 w-full text-center transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-500 hover:bg-blue-100'}`}>
        {text}
    </button>
);

export default function Questionnaire2Page() {
    const params = useParams();
    const router = useRouter();
    const rif = params.rif as string;

    const [answers, setAnswers] = useState<Answers>({
        searchZone: '',
        minBedrooms: '',
        mustHaveFeatures: '',
        searchDuration: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnswerChange = <K extends keyof Answers>(key: K, value: Answers[K]) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    const isFormComplete = () => {
        return Object.values(answers).every(answer => answer !== '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormComplete()) {
            setError("Per favore, rispondi a tutte le domande.");
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Autenticazione richiesta.');

            const response = await fetch(`${API_URL}/api/leads/questionnaire2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ propertyRif: rif, answers }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Si è verificato un errore.');
            }
            // Redirect to the new "decision" page
            router.push(`/decisione/${rif}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 text-center">Questionario Post Visualizzazione</h1>
                    <p className="text-center text-gray-600 mt-2">Per favore, rispondi a queste domande per aiutarci a capire meglio le tue esigenze.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Q1 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">In quale zona stai cercando? scrivi di seguito</legend>
                        <input type="text" value={answers.searchZone} onChange={(e) => handleAnswerChange('searchZone', e.target.value)} className="w-full p-2 border rounded-md" placeholder="Es. Milano Centro, Roma Nord..."/>
                    </fieldset>
                    {/* Q2 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Di quante camere minimo necessiti? (indica solo le camere necessarie)</legend>
                        <div className="grid grid-cols-3 gap-4">
                            <ChoiceButton text="1" onClick={() => handleAnswerChange('minBedrooms', 1)} isSelected={answers.minBedrooms === 1} />
                            <ChoiceButton text="2" onClick={() => handleAnswerChange('minBedrooms', 2)} isSelected={answers.minBedrooms === 2} />
                            <ChoiceButton text="3" onClick={() => handleAnswerChange('minBedrooms', 3)} isSelected={answers.minBedrooms === 3} />
                        </div>
                    </fieldset>
                    {/* Q3 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Cosa non può mancare nella tua nuova casa? Scrivi dettagliatamente</legend>
                        <textarea value={answers.mustHaveFeatures} onChange={(e) => handleAnswerChange('mustHaveFeatures', e.target.value)} className="w-full p-2 border rounded-md" rows={4} placeholder="Es. Giardino privato, terrazzo, due bagni..."></textarea>
                    </fieldset>
                    {/* Q4 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Da quanto tempo stai cercando?</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ChoiceButton text="Meno di 1 mese" onClick={() => handleAnswerChange('searchDuration', 'meno di 1 mese')} isSelected={answers.searchDuration === 'meno di 1 mese'} />
                            <ChoiceButton text="1-3 mesi" onClick={() => handleAnswerChange('searchDuration', '1-3 mesi')} isSelected={answers.searchDuration === '1-3 mesi'} />
                            <ChoiceButton text="3-6 mesi" onClick={() => handleAnswerChange('searchDuration', '3-6 mesi')} isSelected={answers.searchDuration === '3-6 mesi'} />
                            <ChoiceButton text="Più di 6 mesi" onClick={() => handleAnswerChange('searchDuration', 'più di 6 mesi')} isSelected={answers.searchDuration === 'più di 6 mesi'} />
                        </div>
                    </fieldset>

                    {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
                    <button type="submit" disabled={isSubmitting || !isFormComplete()} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-transform text-xl disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Invio...' : 'Invia e prosegui'}
                    </button>
                </form>
            </div>
        </div>
    );
}
