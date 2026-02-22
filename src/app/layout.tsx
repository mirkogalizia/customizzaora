import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Print Shop — T-shirt personalizzate',
  description: 'Personalizza la tua t-shirt, felpa o girocollo. Spedizione in 24 ore.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <CartProvider>
          {children}
          <CartDrawer />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </body>
    </html>
  );
}