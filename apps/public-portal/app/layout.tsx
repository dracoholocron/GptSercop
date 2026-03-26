import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import './globals.css';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Compras Públicas – Portal ciudadano',
  description: 'Búsqueda de procesos de contratación pública',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={sourceSans.variable}>
      <body className="min-h-screen bg-neutral-100 font-sans text-text-primary antialiased">{children}</body>
    </html>
  );
}
