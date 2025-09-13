import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">Informativa sul Trattamento dei Dati Personali</h1>
        <p className="mb-4">
          Ai sensi dell'art. 13 del Regolamento (UE) 2016/679 (GDPR), La informiamo che i Suoi dati personali,
          da Lei liberamente conferiti, saranno trattati da [Nome Azienda] in qualità di Titolare del trattamento,
          al fine di fornirLe le informazioni da Lei richieste e per la gestione della Sua richiesta di accesso
          ai dettagli dell'immobile.
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-2">Finalità del Trattamento</h2>
        <p className="mb-4">
          I dati raccolti saranno utilizzati esclusivamente per le seguenti finalità:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li>Verificare la Sua identità tramite l'invio di un codice OTP.</li>
          <li>Creare un Suo profilo utente per la gestione del processo di qualificazione.</li>
          <li>ContattarLa in merito all'immobile di Suo interesse.</li>
          <li>ProporLe soluzioni alternative in base alle Sue esigenze.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-6 mb-2">Base Giuridica</h2>
        <p className="mb-4">
          La base giuridica del trattamento è il Suo consenso esplicito, fornito tramite la spunta
          dell'apposita casella, e l'esecuzione di misure precontrattuali da Lei richieste.
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-2">Periodo di Conservazione</h2>
        <p className="mb-4">
          I Suoi dati saranno conservati per il tempo strettamente necessario a conseguire gli scopi
          per cui sono stati raccolti e, in ogni caso, non oltre [Numero] anni dalla loro raccolta,
          salvo diversa richiesta di cancellazione da parte Sua.
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-2">Diritti dell'Interessato</h2>
        <p className="mb-4">
          In ogni momento, Lei potrà esercitare i Suoi diritti nei confronti del Titolare del trattamento,
          ai sensi degli artt. 15-22 del GDPR.
        </p>
        <div className="mt-8 text-center">
            <Link href="/" className="text-blue-600 hover:underline">
                &larr; Torna alla pagina principale
            </Link>
        </div>
      </div>
    </div>
  );
}
