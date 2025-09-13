"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 for password, 2 for OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/employees/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Errore durante il login.');
      setStep(2); // Move to OTP step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/employees/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Errore durante la verifica OTP.');

      localStorage.setItem('employeeAuthToken', data.token);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">Login Area Riservata</h1>
        {step === 1 ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="text-sm text-right">
              <Link href="/admin/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Password dimenticata?
              </Link>
            </div>
            {error && <p className="text-red-600 text-center">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 transition-colors">
              {isLoading ? 'Verifico...' : 'Accedi'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <p className="text-center text-gray-700">Ti abbiamo inviato una mail a <strong>{email}</strong>. Inserisci il codice OTP a 6 cifre.</p>
            <div>
                <label htmlFor="otp" className="sr-only">Codice OTP</label>
                <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest focus:ring-blue-500 focus:border-blue-500" placeholder="------"/>
            </div>
            {error && <p className="text-red-600 text-center">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 transition-colors">
              {isLoading ? 'Verifico...' : 'Verifica e Entra'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
