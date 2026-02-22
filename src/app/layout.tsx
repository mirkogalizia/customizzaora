/**
 * Aggiungi CartProvider e CartDrawer al tuo root layout
 * src/app/layout.tsx
 * 
 * PRIMA:
 *   export default function RootLayout({ children }) {
 *     return <html><body>{children}</body></html>
 *   }
 * 
 * DOPO: vedi sotto
 */

import { CartProvider } from '@/contexts/CartContext';
import { CartDrawer }   from '@/components/cart/CartDrawer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <CartProvider>
          {children}
          <CartDrawer />    {/* drawer disponibile su tutto il sito */}
        </CartProvider>
      </body>
    </html>
  );
}
