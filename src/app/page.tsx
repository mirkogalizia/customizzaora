'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  Euro, 
  Truck, 
  Shield, 
  Star, 
  Check, 
  Sparkles,
  Clock,
  Palette,
  ShirtIcon,
  ArrowRight,
  MessageCircle,
  Award
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShirtIcon className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">Print<span className="text-orange-600">Shop</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/products" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Prodotti
              </Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Come Funziona
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">
                Contatti
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Consegna in 24 ore
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                La Tua Maglietta.
                <br />
                <span className="text-orange-600">Personalizzata.</span>
                <br />
                <span className="text-blue-600">Domani a Casa.</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Il prezzo che vedi è <strong>tutto incluso</strong>: fronte, retro e 4 colori di stampa. 
                Nessun costo nascosto. Nessuna sorpresa.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/quick-order">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold w-full sm:w-auto group">
                    Inizia Ora
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold w-full sm:w-auto">
                    Sfoglia Prodotti
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <p className="text-sm text-gray-600">+1.200 clienti felici</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/api/placeholder/600/700" 
                  alt="Maglietta personalizzata" 
                  className="w-full"
                />
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <Clock className="w-5 h-5" />
                    24h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <div className="font-bold text-gray-900">24 Ore</div>
                <div className="text-sm text-gray-600">Consegna rapida</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Euro className="w-8 h-8 text-orange-600" />
              <div>
                <div className="font-bold text-gray-900">Prezzo Chiaro</div>
                <div className="text-sm text-gray-600">Tutto incluso</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Palette className="w-8 h-8 text-orange-600" />
              <div>
                <div className="font-bold text-gray-900">4 Colori</div>
                <div className="text-sm text-gray-600">Fronte + Retro</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Award className="w-8 h-8 text-orange-600" />
              <div>
                <div className="font-bold text-gray-900">Qualità Top</div>
                <div className="text-sm text-gray-600">100% cotone</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Semplice Come 1-2-3
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nessuna esperienza necessaria. Ti guidiamo passo dopo passo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 hover:border-orange-200">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Scegli il Prodotto</h3>
              <p className="text-gray-600 leading-relaxed">
                T-shirt, felpa o cappello. Il <strong>prezzo che vedi include già fronte, retro e 4 colori</strong> di stampa. Zero sorprese.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 hover:border-orange-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Personalizza</h3>
              <p className="text-gray-600 leading-relaxed">
                Scrivi il tuo testo o carica una foto. <strong>Ti guidiamo passo dopo passo</strong>, è facilissimo anche se non sei esperto.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 hover:border-orange-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ricevi in 24h</h3>
              <p className="text-gray-600 leading-relaxed">
                Stampiamo e spediamo subito. <strong>Domani la tua maglietta è già a casa tua</strong>. Tracciamento incluso.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* PREZZO CHIARO */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Prezzo Chiaro. Nessun Trucco.
          </h2>
          <p className="text-2xl text-gray-600 mb-12">
            Il prezzo che vedi è <strong className="text-orange-600">TUTTO INCLUSO</strong>
          </p>

          <Card className="p-10 max-w-2xl mx-auto border-4 border-orange-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-lg">T-Shirt Personalizzata</span>
                <span className="text-3xl font-bold text-orange-600">€24.90</span>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-gray-700">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span><strong>Fronte e Retro</strong> inclusi</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span><strong>Fino a 4 colori</strong> di stampa</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span><strong>Spedizione gratuita</strong> sopra €50</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span><strong>Consegna in 24 ore</strong></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span><strong>Qualità premium</strong> garantita</span>
                </div>
              </div>

              <Button size="lg" className="w-full h-14 text-lg font-semibold mt-8">
                Inizia Subito
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>

          <p className="text-sm text-gray-500 mt-6">
            * Prezzi IVA inclusa. Nessun costo aggiuntivo alla cassa.
          </p>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Perché Scegliere Noi?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <Zap className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Velocità Garantita</h3>
              <p className="text-gray-600">
                Ordina oggi, indossa domani. La nostra promessa di consegna in 24 ore è garantita al 100%.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <Shield className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Qualità Certificata</h3>
              <p className="text-gray-600">
                Tessuti 100% cotone premium e stampa professionale DTG. Garanzia soddisfatti o rimborsati.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <MessageCircle className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Assistenza Sempre</h3>
              <p className="text-gray-600">
                Hai bisogno di aiuto? Il nostro team risponde su WhatsApp in pochi minuti. Siamo qui per te.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <Euro className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Prezzo Onesto</h3>
              <p className="text-gray-600">
                Nessun sovrapprezzo nascosto. Il prezzo include tutto: fronte, retro e tutti i colori che vuoi.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <Palette className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Libertà Creativa</h3>
              <p className="text-gray-600">
                4 colori, fronte e retro, foto e testo. Crea esattamente ciò che hai in mente, senza limiti.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <Truck className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Spedizione Tracciata</h3>
              <p className="text-gray-600">
                Traccia il tuo ordine in tempo reale. Saprai sempre dove si trova la tua maglietta.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-orange-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Pronto a Creare la Tua Maglietta?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Servizio veloce, prezzo chiaro, qualità garantita. 
            <br />
            Cosa stai aspettando?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quick-order">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold w-full sm:w-auto">
                Inizia Ora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold w-full sm:w-auto border-white text-white hover:bg-white hover:text-orange-600">
                Sfoglia Prodotti
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShirtIcon className="w-6 h-6 text-orange-600" />
                <span className="text-xl font-bold text-white">PrintShop</span>
              </div>
              <p className="text-sm text-gray-400">
                Magliette personalizzate di qualità, consegnate in 24 ore.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Prodotti</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products?category=tshirt" className="hover:text-orange-600">T-Shirt</Link></li>
                <li><Link href="/products?category=hoodie" className="hover:text-orange-600">Felpe</Link></li>
                <li><Link href="/products?category=sweatshirt" className="hover:text-orange-600">Sweatshirt</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Supporto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works" className="hover:text-orange-600">Come Funziona</Link></li>
                <li><Link href="/faq" className="hover:text-orange-600">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-orange-600">Contatti</Link></li>
                <li><Link href="/shipping" className="hover:text-orange-600">Spedizioni</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contatti</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 info@printshop.it</li>
                <li>📱 WhatsApp: +39 333 1234567</li>
                <li>🕐 Lun-Ven 9:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center text-gray-400">
            <p>© 2025 PrintShop. Tutti i diritti riservati. P.IVA 12345678901</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

