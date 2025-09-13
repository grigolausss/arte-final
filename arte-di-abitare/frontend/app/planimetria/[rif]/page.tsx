"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Link from 'next/link';

export default function PlanimetryPage() {
  const params = useParams();
  const router = useRouter();
  const rif = params.rif as string;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rif) return;

    let objectUrl: string;

    const fetchWatermarkedImage = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Autenticazione richiesta. Per favore, torna alla homepage e riverifica la tua email.');

        const response = await fetch(`/api/properties/${rif}/planimetria`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Errore nel caricamento della planimetria`);
        }

        const imageBlob = await response.blob();
        objectUrl = URL.createObjectURL(imageBlob);
        setImageUrl(objectUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWatermarkedImage();

    // Cleanup function to prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [rif]);

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-xl">Caricamento planimetria con watermark...</p></div>;
  if (error) return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-red-600 text-xl text-center p-4">{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Planimetria</h1>
        <p className="text-md text-gray-500 mb-6">RIF: {rif ? rif.toUpperCase() : ''}</p>

        <p className="text-sm text-gray-600 mb-4">Usa il mouse o il tocco per ingrandire e spostare l'immagine. Il download e lo screenshot sono disabilitati.</p>

        <div
          className="w-full h-[60vh] bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300"
          onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
        >
          {imageUrl ? (
            <TransformWrapper>
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
                <img
                  src={imageUrl}
                  alt={`Planimetria per RIF ${rif}`}
                  className="w-full h-full object-contain"
                />
              </TransformComponent>
            </TransformWrapper>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><p>Nessuna immagine da visualizzare.</p></div>
          )}
        </div>

        <Link href={`/questionario2/${rif}`} className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors text-lg">
          Prosegui
        </Link>
      </div>
    </div>
  );
}
