"use client";

import { useState, useEffect } from 'react';

// Simplified data structure without the 'role'
export interface EmployeeData {
  email: string;
  password?: string;
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeData>;
  onSubmit: (data: EmployeeData) => void;
  isSaving: boolean;
  error?: string | null;
  isEditing: boolean;
}

export default function EmployeeForm({ initialData = {}, onSubmit, isSaving, error, isEditing }: EmployeeFormProps) {
  const [employee, setEmployee] = useState<Partial<EmployeeData>>({
    email: '',
    password: '',
    ...initialData,
  });

  // Safely update state when initialData is available for editing
  useEffect(() => {
    if (initialData && initialData.email) {
      setEmployee(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData?.email]); // Depend on a stable primitive

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(employee as EmployeeData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div>
        <label htmlFor="email" className="block font-semibold">Email</label>
        <input id="email" name="email" type="email" value={employee.email} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" />
      </div>

      <div>
        <label htmlFor="password" className="block font-semibold mt-1">{isEditing ? 'Nuova Password (lascia vuoto per non cambiare)' : 'Password'}</label>
        <input id="password" name="password" type="password" value={employee.password || ''} onChange={handleChange} required={!isEditing} className="w-full p-2 border rounded-md" />
      </div>

      {error && <p className="text-red-600 text-center font-semibold">{error}</p>}

      <button type="submit" disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-400">
        {isSaving ? 'Salvataggio...' : (isEditing ? 'Salva Modifiche' : 'Crea Utente')}
      </button>
    </form>
  );
}
