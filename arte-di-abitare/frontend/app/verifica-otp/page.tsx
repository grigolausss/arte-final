"use client";
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function VerifyOtpComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for the resend functionality
    const [countdown, setCountdown] = useState(60);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [resendMessage, setResendMessage] = useState('');

    // Timer effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    useEffect(() => {
        if (!email) {
            router.push('/');
        }
    }, [email, router]);

    const handleResendOtp = useCallback(async () => {
        if (!email) return;

        setResendDisabled(true);
        setResendMessage('Invio di un nuovo codice...');

        // We need name and surname for the request-otp endpoint.
        // Since we don't have them here, we'll pass placeholder values.
        // The backend logic will find the existing user by email and ignore these.
        const res = await fetch(`${API_URL}/api/users/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Utente', surname: 'Esistente', email }),
        });

        const data = await res.json();
        if (!res.ok) {
            setResendMessage(data.message || 'Errore durante l\'invio.');
            setResendDisabled(false); // Allow another try
        } else {
            setResendMessage('Un nuovo codice è stato inviato alla tua email.');
            setCountdown(60); // Restart the timer
        }
    }, [email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/users/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Errore durante la verifica del codice OTP.');
            }
            localStorage.setItem('authToken', data.token);
            router.push('/cerca-rif');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-blue-900 mb-4 text-center">Verifica il tuo indirizzo Email</h1>
                <p className="text-center text-gray-700 mb-6">Ti abbiamo inviato una mail a <strong>{email}</strong>. Inserisci il codice a 6 cifre che hai ricevuto.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="otp" className="sr-only">Codice OTP</label>
                        <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest" placeholder="------"/>
                    </div>
                    <p className="text-xs text-gray-500 text-center">Controlla anche la cartella spam. Il codice scade tra pochi minuti.</p>
                    {error && <p className="text-red-600 text-center text-sm">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                        {isLoading ? 'Verifico...' : 'Verifica e Continua'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t pt-4">
                    <button onClick={handleResendOtp} disabled={resendDisabled} className="text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed text-sm">
                        {resendDisabled ? `Rinvia codice tra ${countdown}s` : 'Rinvia codice'}
                    </button>
                    {resendMessage && <p className="text-sm text-gray-600 mt-2">{resendMessage}</p>}
                </div>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div>Caricamento...</div>}>
            <VerifyOtpComponent />
        </Suspense>
    );
}
