import type { Metadata } from 'next';
import './globals.css';
import { AuthInit } from './components/AuthInit';

export const metadata: Metadata = { title: 'SERCOP – Portal proveedores', description: 'Registro y ofertas' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthInit />
        {children}
      </body>
    </html>
  );
}
