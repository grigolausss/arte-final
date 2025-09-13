"use client";

import { useState, useEffect } from 'react';

// The data interface remains the same
export interface PropertyData {
  _id?: string;
  rif: string;
  title: string;
  zone: string;
  price: number;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  dossierImage: File | string;
  planimetryImage: File | string;
  zoneImage: File | string;
  isActive: boolean;
}

// The props interface is simplified. The form will now manage its own state.
interface PropertyFormProps {
  initialData?: Partial<PropertyData>;
  onSubmit: (data: FormData) => void;
  isSaving: boolean;
  error?: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PropertyForm({ initialData, onSubmit, isSaving, error }: PropertyFormProps) {
  // The form now manages its own state.
  const [property, setProperty] = useState<Partial<PropertyData>>(initialData || {
    rif: '',
    title: '',
    zone: '',
    price: 0,
    surface: 0,
    bedrooms: 0,
    bathrooms: 0,
    isActive: true,
  });

  const [previews, setPreviews] = useState({
      dossierImage: '',
      planimetryImage: '',
      zoneImage: '',
  });

  // Effect to set initial data and previews when editing
  useEffect(() => {
    if (initialData) {
        setProperty(initialData);
        setPreviews({
            dossierImage: typeof initialData.dossierImage === 'string' ? `${API_BASE_URL}/uploads/${initialData.dossierImage}` : '',
            planimetryImage: typeof initialData.planimetryImage === 'string' ? `${API_BASE_URL}/uploads/${initialData.planimetryImage}` : '',
            zoneImage: typeof initialData.zoneImage === 'string' ? `${API_BASE_URL}/uploads/${initialData.zoneImage}` : '',
        });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProperty(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setProperty(prev => ({ ...prev, [name]: file }));
      setPreviews(prev => ({...prev, [name]: URL.createObjectURL(file)}));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(property).forEach(key => {
      const value = property[key as keyof typeof property];
      if (value !== undefined && value !== null) {
          // For file objects, the file itself is the value.
          // For string paths (on edit), we don't re-upload unless a new file is chosen.
          // The backend should handle the logic of not updating the image if the field is not present.
          if (value instanceof File) {
            formData.append(key, value);
          } else if (typeof value !== 'object') { // Append other form data
            formData.append(key, String(value));
          }
      }
    });
     // Make sure to append the ID if it exists, so the backend knows which record to update
    if (property._id) {
        formData.append('_id', property._id);
    }
    onSubmit(formData);
  };

  const renderPreview = (src: string | undefined) => {
      if (!src) return null;
      return <img src={src} alt="Preview" className="mt-2 h-32 w-auto object-contain rounded-md border" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-8">
        <div><label className="block font-medium">RIF (univoco)</label><input name="rif" value={property.rif || ''} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
        <div><label className="block font-medium">Titolo</label><input name="title" value={property.title || ''} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
      </div>
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 border-b pb-8">
          <div><label className="block font-medium">Zona</label><input name="zone" value={property.zone || ''} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">Prezzo (€)</label><input name="price" type="number" value={property.price || 0} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">Superficie (mq)</label><input name="surface" type="number" value={property.surface || 0} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">N. Camere</label><input name="bedrooms" type="number" value={property.bedrooms || 0} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">N. Bagni</label><input name="bathrooms" type="number" value={property.bathrooms || 0} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-8">
          <div><label className="block font-medium">1. Foto Dossier (A4)</label><input name="dossierImage" type="file" onChange={handleFileChange} className="w-full text-sm"/>{renderPreview(previews.dossierImage)}</div>
          <div><label className="block font-medium">2. Foto Planimetria</label><input name="planimetryImage" type="file" onChange={handleFileChange} className="w-full text-sm"/>{renderPreview(previews.planimetryImage)}</div>
          <div><label className="block font-medium">3. Foto Zona</label><input name="zoneImage" type="file" onChange={handleFileChange} className="w-full text-sm"/>{renderPreview(previews.zoneImage)}</div>
      </div>
      <div className="flex items-center gap-2 pt-4"><input name="isActive" type="checkbox" checked={property.isActive} onChange={handleChange} className="h-5 w-5" /><label>Immobile Attivo</label></div>
      {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
      <button type="submit" disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-400">
        {isSaving ? 'Salvataggio...' : 'Salva Immobile'}
      </button>
    </form>
  );
}
