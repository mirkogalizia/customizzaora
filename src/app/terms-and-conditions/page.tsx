'use client';

import Link from 'next/link';
import { ShirtIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ShirtIcon className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">Print<span className="text-orange-600">Shop</span></span>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-gray-600 mb-8">Ultimo aggiornamento: 1 Dicembre 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Cosa Sono i Cookie</h2>
            <p className="text-gray-700 leading-relaxed">
              I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo (computer, tablet, smartphone) 
              quando visiti un sito web. I cookie permettono al sito di riconoscere il tuo dispositivo e memorizzare alcune 
              informazioni sulle tue preferenze o azioni passate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Come Utilizziamo i Cookie</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              PrintShop utilizza cookie per diversi scopi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Garantire il corretto funzionamento del sito</li>
              <li>Ricordare le tue preferenze e impostazioni</li>
              <li>Mantenere i prodotti nel carrello durante la navigazione</li>
              <li>Analizzare come i visitatori utilizzano il sito</li>
              <li>Migliorare l'esperienza utente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Tipologie di Cookie Utilizzati</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 Cookie Tecnici (Necessari)</h3>
            <p className="text-gray-700 leading-relaxed">
              Questi cookie sono essenziali per il funzionamento del sito e non possono essere disattivati. Includono:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li><strong>Cookie di sessione:</strong> mantengono attiva la tua sessione durante la navigazione</li>
              <li><strong>Cookie carrello:</strong> memorizzano i prodotti aggiunti al carrello</li>
              <li><strong>Cookie di sicurezza:</strong> proteggono da accessi non autorizzati</li>
              <li><strong>Cookie preferenze:</strong> ricordano le tue scelte (lingua, valuta)</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Durata:</strong> Durata della sessione o fino a 12 mesi<br />
              <strong>Base giuridica:</strong> Necessari per l'erogazione del servizio richiesto
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Cookie Analitici</h3>
            <p className="text-gray-700 leading-relaxed">
              Ci aiutano a capire come i visitatori interagiscono con il sito, raccogliendo informazioni anonime su:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Numero di visitatori</li>
              <li>Pagine più visitate</li>
              <li>Tempo di permanenza sul sito</li>
              <li>Sorgente del traffico</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Esempi:</strong> Google Analytics<br />
              <strong>Durata:</strong> Fino a 24 mesi<br />
              <strong>Base giuridica:</strong> Consenso dell'utente
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Cookie di Marketing</h3>
            <p className="text-gray-700 leading-relaxed">
              Utilizzati per tracciare i visitatori attraverso i siti web e mostrare annunci rilevanti. Questi cookie:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Tracciano la tua attività di navigazione</li>
              <li>Creano profili dei tuoi interessi</li>
              <li>Personalizzano gli annunci pubblicitari</li>
              <li>Misurano l'efficacia delle campagne</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Esempi:</strong> Facebook Pixel, Google Ads<br />
              <strong>Durata:</strong> Fino a 24 mesi<br />
              <strong>Base giuridica:</strong> Consenso dell'utente
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.4 Cookie di Terze Parti</h3>
            <p className="text-gray-700 leading-relaxed">
              Alcuni cookie sono installati da servizi di terze parti che appaiono sulle nostre pagine:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li><strong>Payment providers:</strong> per elaborare i pagamenti in modo sicuro</li>
              <li><strong>Social media:</strong> per integrare funzionalità social</li>
              <li><strong>Servizi di tracking:</strong> per monitorare le spedizioni</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookie Utilizzati nel Dettaglio</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 mt-4">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Nome Cookie</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Tipo</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Durata</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Scopo</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">session_id</td>
                    <td className="border border-gray-300 px-4 py-2">Tecnico</td>
                    <td className="border border-gray-300 px-4 py-2">Sessione</td>
                    <td className="border border-gray-300 px-4 py-2">Mantiene la sessione utente</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">cart_items</td>
                    <td className="border border-gray-300 px-4 py-2">Tecnico</td>
                    <td className="border border-gray-300 px-4 py-2">7 giorni</td>
                    <td className="border border-gray-300 px-4 py-2">Memorizza prodotti nel carrello</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">cookie_consent</td>
                    <td className="border border-gray-300 px-4 py-2">Tecnico</td>
                    <td className="border border-gray-300 px-4 py-2">12 mesi</td>
                    <td className="border border-gray-300 px-4 py-2">Memorizza preferenze cookie</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">_ga</td>
                    <td className="border border-gray-300 px-4 py-2">Analitico</td>
                    <td className="border border-gray-300 px-4 py-2">24 mesi</td>
                    <td className="border border-gray-300 px-4 py-2">Google Analytics - distingue utenti</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">_fbp</td>
                    <td className="border border-gray-300 px-4 py-2">Marketing</td>
                    <td className="border border-gray-300 px-4 py-2">90 giorni</td>
                    <td className="border border-gray-300 px-4 py-2">Facebook Pixel - tracking</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Gestione dei Cookie</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Banner Cookie</h3>
            <p className="text-gray-700 leading-relaxed">
              Al primo accesso al sito, ti verrà mostrato un banner che ti permette di:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Accettare tutti i cookie</li>
              <li>Rifiutare i cookie non necessari</li>
              <li>Personalizzare le tue preferenze per categoria</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Modificare le Preferenze</h3>
            <p className="text-gray-700 leading-relaxed">
              Puoi modificare o revocare il consenso in qualsiasi momento:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Cliccando sul link "Gestisci Cookie" nel footer del sito</li>
              <li>Cancellando i cookie dal tuo browser</li>
              <li>Modificando le impostazioni del browser</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.3 Impostazioni Browser</h3>
            <p className="text-gray-700 leading-relaxed">
              Puoi controllare i cookie attraverso le impostazioni del tuo browser:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li><strong>Chrome:</strong> Impostazioni → Privacy e sicurezza → Cookie</li>
              <li><strong>Firefox:</strong> Opzioni → Privacy e sicurezza → Cookie e dati dei siti</li>
              <li><strong>Safari:</strong> Preferenze → Privacy → Cookie e dati dei siti web</li>
              <li><strong>Edge:</strong> Impostazioni → Cookie e autorizzazioni sito</li>
            </ul>
            <p className="text-gray-700 mt-4">
              <strong>Nota:</strong> Disabilitare i cookie tecnici potrebbe compromettere il funzionamento del sito e impedirti 
              di utilizzare alcune funzionalità, come completare un ordine.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookie e Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              I dati raccolti tramite cookie sono trattati in conformità con la nostra{' '}
              <Link href="/privacy-policy" className="text-orange-600 hover:underline font-semibold">Privacy Policy</Link> 
              {' '}e con il GDPR. I cookie analitici e di marketing sono installati solo dopo aver ottenuto il tuo consenso esplicito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Trasferimento Dati</h2>
            <p className="text-gray-700 leading-relaxed">
              Alcuni cookie di terze parti (es. Google Analytics, Facebook) potrebbero trasferire dati verso paesi extra-UE. 
              Questi trasferimenti sono regolati da clausole contrattuali standard approvate dalla Commissione Europea e da 
              meccanismi di protezione adeguati.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Aggiornamenti</h2>
            <p className="text-gray-700 leading-relaxed">
              Questa Cookie Policy può essere aggiornata periodicamente per riflettere cambiamenti nelle nostre pratiche o 
              per conformarci a nuove normative. Ti invitiamo a consultare regolarmente questa pagina per essere informato 
              sulle nostre pratiche relative ai cookie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contatti</h2>
            <p className="text-gray-700 leading-relaxed">
              Per domande sulla nostra Cookie Policy, contattaci a:
            </p>
            <p className="text-gray-700 mt-2">
              Email: <a href="mailto:assistenza@customizzaora.it" className="text-orange-600 hover:underline font-semibold">assistenza@customizzaora.it</a>
            </p>
          </section>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2025 PrintShop by JUST LEGIT LLC. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
