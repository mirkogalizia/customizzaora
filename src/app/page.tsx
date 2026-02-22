'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
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
  Award,
  ShoppingCart,
} from 'lucide-react';

export default function HomePage() {
  const { totalQuantity } = useCart();

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
              <Link href="/admin">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {totalQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {totalQuantity}
                    </span>
                  )}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50">
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
                <Link href="/products">
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
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">+1.200 clienti felici</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100 aspect-[6/7] flex items-center justify-center">
                <ShirtIcon className="w-32 h-32 text-gray-300" />
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
            {[
              { icon: Clock, label: '24 Ore', sub: 'Consegna rapida' },
              { icon: Euro, label: 'Prezzo Chiaro', sub: 'Tutto incluso' },
              { icon: Palette, label: '4 Colori', sub: 'Fronte + Retro' },
              { icon: Award, label: 'Qualità Top', sub: '100% cotone' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center justify-center gap-3">
                <Icon className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="font-bold text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600">{sub}</div>
                </div>
              </div>
            ))}
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
            {[
              {
                step: '1', color: 'orange',
                title: 'Scegli il Prodotto',
                desc: 'T-shirt, felpa o girocollo. Il prezzo che vedi include già fronte, retro e 4 colori di stampa. Zero sorprese.',
              },
              {
                step: '2', color: 'blue',
                title: 'Personalizza',
                desc: 'Scrivi il tuo testo o carica una foto. Ti guidiamo passo dopo passo, è facilissimo anche se non sei esperto.',
              },
              {
                step: '3', color: 'green',
                title: 'Ricevi in 24h',
                desc: 'Stampiamo e spediamo subito. Domani la tua maglietta è già a casa tua. Tracciamento incluso.',
              },
            ].map(({ step, color, title, desc }) => (
              <Card key={step} className="p-8 text-center hover:shadow-xl transition-shadow border-2 hover:border-orange-200">
                <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <span className={`text-3xl font-bold text-${color}-600`}>{step}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </Card>
            ))}
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
                {[
                  'Fronte e Retro inclusi',
                  'Fino a 4 colori di stampa',
                  'Spedizione gratuita sopra €50',
                  'Consegna in 24 ore',
                  'Qualità premium garantita',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-gray-700">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/products" className="block">
                <Button size="lg" className="w-full h-14 text-lg font-semibold mt-4">
                  Inizia Subito
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
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
            {[
              { icon: Zap, title: 'Velocità Garantita', desc: 'Ordina oggi, indossa domani. La nostra promessa di consegna in 24 ore è garantita al 100%.' },
              { icon: Shield, title: 'Qualità Certificata', desc: 'Tessuti 100% cotone premium e stampa professionale DTG. Garanzia soddisfatti o rimborsati.' },
              { icon: MessageCircle, title: 'Assistenza Sempre', desc: 'Il nostro team risponde su WhatsApp in pochi minuti. Siamo qui per te.' },
              { icon: Euro, title: 'Prezzo Onesto', desc: 'Nessun sovrapprezzo nascosto. Il prezzo include tutto: fronte, retro e tutti i colori che vuoi.' },
              { icon: Palette, title: 'Libertà Creativa', desc: '4 colori, fronte e retro, foto e testo. Crea esattamente ciò che hai in mente, senza limiti.' },
              { icon: Truck, title: 'Spedizione Tracciata', desc: 'Traccia il tuo ordine in tempo reale. Saprai sempre dove si trova la tua maglietta.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-8 hover:shadow-xl transition-shadow">
                <Icon className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </Card>
            ))}
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
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
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
                Magliette personalizzate di qualità, consegnate in 24-48 ore.
              </p>
              <p className="text-sm text-gray-400 mt-4">by JUST LEGIT LLC</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Prodotti</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products?category=tshirt" className="hover:text-orange-600 transition-colors">T-Shirt</Link></li>
                <li><Link href="/products?category=hoodie" className="hover:text-orange-600 transition-colors">Felpe</Link></li>
                <li><Link href="/products?category=sweatshirt" className="hover:text-orange-600 transition-colors">Sweatshirt</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Supporto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-orange-600 transition-colors">Catalogo</Link></li>
                <li><Link href="/cart" className="hover:text-orange-600 transition-colors">Carrello</Link></li>
                <li><a href="mailto:assistenza@customizzaora.it" className="hover:text-orange-600 transition-colors">Contatti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legale</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-and-conditions" className="hover:text-orange-600 transition-colors">Termini e Condizioni</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-orange-600 transition-colors">Cookie Policy</Link></li>
              </ul>
              <h4 className="font-bold text-white mb-4 mt-6">Contatti</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 <a href="mailto:assistenza@customizzaora.it" className="hover:text-orange-600 transition-colors">assistenza@customizzaora.it</a></li>
                <li>🕐 Lun-Ven 9:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center text-gray-400">
            <p className="mb-3">© 2025 PrintShop by JUST LEGIT LLC. Tutti i diritti riservati.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy</Link>
              <span>|</span>
              <Link href="/terms-and-conditions" className="hover:text-orange-600 transition-colors">Termini</Link>
              <span>|</span>
              <Link href="/cookie-policy" className="hover:text-orange-600 transition-colors">Cookie</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}