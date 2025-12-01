'use client';

import Link from 'next/link';
import { ShirtIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Ultimo aggiornamento: 1 Dicembre 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Titolare del Trattamento</h2>
            <p className="text-gray-700 leading-relaxed">
              Il Titolare del trattamento dei dati personali è <strong>JUST LEGIT LLC</strong>, con sede legale in:
            </p>
            <address className="not-italic text-gray-700 ml-4">
              Shams Business Center, Shared Desk<br />
              0000, Sharjah Media City Free Zone, Al Messaned<br />
              Sharjah, United Arab Emirates
            </address>
            <p className="text-gray-700 mt-4">
              Email: <a href="mailto:assistenza@customizzaora.it" className="text-orange-600 hover:underline">assistenza@customizzaora.it</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Dati Raccolti</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Durante l'utilizzo del nostro sito e per l'elaborazione degli ordini, raccogliamo le seguenti categorie di dati personali:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Dati di contatto:</strong> nome, cognome, indirizzo email, numero di telefono</li>
              <li><strong>Dati di spedizione:</strong> indirizzo di consegna completo</li>
              <li><strong>Dati di pagamento:</strong> informazioni necessarie per processare il pagamento (gestite tramite provider sicuri)</li>
              <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate, cookie</li>
              <li><strong>Contenuti personalizzati:</strong> immagini, testi e file caricati per la personalizzazione dei prodotti</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalità del Trattamento</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              I tuoi dati personali vengono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Elaborazione e gestione degli ordini di prodotti personalizzati</li>
              <li>Spedizione dei prodotti ordinati tramite corriere espresso</li>
              <li>Comunicazioni relative all'ordine (conferme, tracking, assistenza)</li>
              <li>Gestione dei pagamenti e fatturazione</li>
              <li>Adempimento di obblighi legali e contabili</li>
              <li>Miglioramento del servizio e assistenza clienti</li>
              <li>Marketing (solo con il tuo consenso esplicito)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base Giuridica</h2>
            <p className="text-gray-700 leading-relaxed">
              Il trattamento dei dati è basato su:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-3">
              <li><strong>Esecuzione del contratto:</strong> necessario per completare il tuo ordine e fornire il servizio</li>
              <li><strong>Obblighi legali:</strong> conservazione dati fiscali e contabili secondo le normative vigenti</li>
              <li><strong>Consenso:</strong> per attività di marketing e comunicazioni promozionali</li>
              <li><strong>Legittimo interesse:</strong> per migliorare il servizio e prevenire frodi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Condivisione dei Dati</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              I tuoi dati possono essere condivisi con:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Corrieri espressi:</strong> per la gestione delle spedizioni in tutta Europa</li>
              <li><strong>Provider di pagamento:</strong> per processare le transazioni in modo sicuro</li>
              <li><strong>Fornitori di servizi IT:</strong> per hosting, manutenzione e sicurezza del sito</li>
              <li><strong>Consulenti fiscali/legali:</strong> per adempimenti normativi</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Tutti i soggetti terzi sono obbligati contrattualmente a trattare i dati in conformità al GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Tempi di Conservazione</h2>
            <p className="text-gray-700 leading-relaxed">
              I dati personali vengono conservati per il tempo necessario alle finalità per cui sono stati raccolti:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-3">
              <li><strong>Dati ordini:</strong> 10 anni per obblighi fiscali e contabili</li>
              <li><strong>Dati di navigazione:</strong> massimo 24 mesi</li>
              <li><strong>Dati marketing:</strong> fino a revoca del consenso</li>
              <li><strong>File caricati:</strong> conservati per la durata necessaria alla produzione e spedizione, poi eliminati</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. I Tuoi Diritti</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In conformità al GDPR, hai il diritto di:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Accesso:</strong> ottenere conferma e copia dei dati trattati</li>
              <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
              <li><strong>Cancellazione:</strong> richiedere la cancellazione dei dati (diritto all'oblio)</li>
              <li><strong>Limitazione:</strong> limitare il trattamento in determinate circostanze</li>
              <li><strong>Portabilità:</strong> ricevere i dati in formato strutturato</li>
              <li><strong>Opposizione:</strong> opporti al trattamento per finalità di marketing</li>
              <li><strong>Revoca consenso:</strong> revocare il consenso in qualsiasi momento</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Per esercitare i tuoi diritti, contattaci all'indirizzo: <a href="mailto:assistenza@customizzaora.it" className="text-orange-600 hover:underline">assistenza@customizzaora.it</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Sicurezza dei Dati</h2>
            <p className="text-gray-700 leading-relaxed">
              Implementiamo misure tecniche e organizzative appropriate per proteggere i tuoi dati personali da accessi non autorizzati, 
              perdita, distruzione o alterazione. Utilizziamo protocolli di crittografia SSL/TLS per tutte le comunicazioni sensibili.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookie</h2>
            <p className="text-gray-700 leading-relaxed">
              Il nostro sito utilizza cookie tecnici e, previo consenso, cookie di profilazione. Per maggiori informazioni, 
              consulta la nostra <Link href="/cookie-policy" className="text-orange-600 hover:underline font-semibold">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifiche alla Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              Ci riserviamo il diritto di modificare questa Privacy Policy in qualsiasi momento. Le modifiche saranno pubblicate 
              su questa pagina con l'indicazione della data di ultimo aggiornamento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contatti</h2>
            <p className="text-gray-700 leading-relaxed">
              Per qualsiasi domanda o richiesta relativa alla privacy, puoi contattarci a:
            </p>
            <p className="text-gray-700 mt-2">
              Email: <a href="mailto:assistenza@customizzaora.it" className="text-orange-600 hover:underline font-semibold">assistenza@customizzaora.it</a>
            </p>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2025 PrintShop by JUST LEGIT LLC. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
