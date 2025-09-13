"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// New state structure for the questionnaire answers
interface Answers {
  sellToBuy: 'sì' | 'no' | '';
  maxBudget: string;
  needsMortgage: 'sì' | 'no' | '';
  mortgagePercentage: number | '';
  mortgagePreApproval: 'sì' | 'no, ma ho già parlato con la mia banca...' | 'no, desidero una consulenza gratuita' | '';
  purchaseTimeline: 'entro 3 mesi' | 'entro 6 mesi' | 'entro 1 anno' | 'non ho fretta' | '';
}

// Reusable button for selecting options
const ChoiceButton = ({ text, onClick, isSelected }: { text: string; onClick: () => void; isSelected: boolean; }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 rounded-lg border-2 w-full text-center transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-500 hover:bg-blue-100'}`}>
        {text}
    </button>
);

export default function NewQuestionnairePage() {
    const params = useParams();
    const router = useRouter();
    const rif = params.rif as string;

    const [answers, setAnswers] = useState<Answers>({
        sellToBuy: '',
        maxBudget: '',
        needsMortgage: '',
        mortgagePercentage: '',
        mortgagePreApproval: '',
        purchaseTimeline: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnswerChange = <K extends keyof Answers>(key: K, value: Answers[K]) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    const isFormComplete = () => {
        if (!answers.sellToBuy || !answers.maxBudget || !answers.needsMortgage || !answers.mortgagePreApproval || !answers.purchaseTimeline) return false;
        if (answers.needsMortgage === 'sì' && answers.mortgagePercentage === '') return false;
        return true;
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

            // This will be a new endpoint
            const response = await fetch(`${API_URL}/api/leads/questionnaire1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ propertyRif: rif, answers }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Si è verificato un errore.');
            }

            router.push(`/planimetria/${rif}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center">Per favore, rispondi a queste domande per aiutarci a capire meglio le tue esigenze.</h1>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Q1 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Per l’acquisto della tua nuova casa, devi vendere la tua casa attuale o un immobile?</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <ChoiceButton text="Sì" onClick={() => handleAnswerChange('sellToBuy', 'sì')} isSelected={answers.sellToBuy === 'sì'} />
                            <ChoiceButton text="No" onClick={() => handleAnswerChange('sellToBuy', 'no')} isSelected={answers.sellToBuy === 'no'} />
                        </div>
                    </fieldset>
                    {/* Q2 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Qual è il tuo budget massimo?</legend>
                        <input type="text" value={answers.maxBudget} onChange={(e) => handleAnswerChange('maxBudget', e.target.value)} className="w-full p-2 border rounded-md" placeholder="Es. 300.000€"/>
                    </fieldset>
                    {/* Q3 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Devi fare un mutuo per l’acquisto?</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <ChoiceButton text="Sì" onClick={() => handleAnswerChange('needsMortgage', 'sì')} isSelected={answers.needsMortgage === 'sì'} />
                            <ChoiceButton text="No" onClick={() => handleAnswerChange('needsMortgage', 'no')} isSelected={answers.needsMortgage === 'no'} />
                        </div>
                        {answers.needsMortgage === 'sì' && (
                            <div className="mt-4"><label className="block font-semibold mb-2">Percentuale necessaria:</label><input type="number" min="0" max="100" value={answers.mortgagePercentage} onChange={(e) => handleAnswerChange('mortgagePercentage', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full p-2 border rounded-md" placeholder="Es. 80%"/></div>
                        )}
                    </fieldset>
                    {/* Q4 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Hai una pre-approvazione del mutuo?</legend>
                        <div className="space-y-3">
                            <ChoiceButton text="Sì" onClick={() => handleAnswerChange('mortgagePreApproval', 'sì')} isSelected={answers.mortgagePreApproval === 'sì'} />
                            <ChoiceButton text="No, ma ho già parlato con la mia banca e sono sicuro di ottenere il mutuo necessario" onClick={() => handleAnswerChange('mortgagePreApproval', 'no, ma ho già parlato con la mia banca...')} isSelected={answers.mortgagePreApproval === 'no, ma ho già parlato con la mia banca...'} />
                            <ChoiceButton text="No, desidero una consulenza gratuita" onClick={() => handleAnswerChange('mortgagePreApproval', 'no, desidero una consulenza gratuita')} isSelected={answers.mortgagePreApproval === 'no, desidero una consulenza gratuita'} />
                        </div>
                    </fieldset>
                    {/* Q5 */}
                    <fieldset><legend className="text-lg font-semibold mb-3">Quando prevedi di acquistare?</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ChoiceButton text="Entro 3 mesi" onClick={() => handleAnswerChange('purchaseTimeline', 'entro 3 mesi')} isSelected={answers.purchaseTimeline === 'entro 3 mesi'} />
                            <ChoiceButton text="Entro 6 mesi" onClick={() => handleAnswerChange('purchaseTimeline', 'entro 6 mesi')} isSelected={answers.purchaseTimeline === 'entro 6 mesi'} />
                            <ChoiceButton text="Entro 1 anno" onClick={() => handleAnswerChange('purchaseTimeline', 'entro 1 anno')} isSelected={answers.purchaseTimeline === 'entro 1 anno'} />
                            <ChoiceButton text="Non ho fretta" onClick={() => handleAnswerChange('purchaseTimeline', 'non ho fretta')} isSelected={answers.purchaseTimeline === 'non ho fretta'} />
                        </div>
                    </fieldset>

                    {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
                    <button type="submit" disabled={isSubmitting || !isFormComplete()} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-transform text-xl disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Invio...' : 'Continua'}
                    </button>
                </form>
            </div>
        </div>
    );
}
