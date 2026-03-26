import type { Metadata } from 'next';
import './globals.css';
import { AuthInit } from './components/AuthInit';

export const metadata: Metadata = {
  title: 'Compras Públicas – Portal proveedores',
  description: 'Registro y ofertas',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="antialiased">
      <body className="min-h-screen bg-neutral-50 text-text-primary">
        <AuthInit />
        {children}
      </body>
    </html>
  );
}
