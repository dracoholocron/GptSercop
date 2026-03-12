import type { Metadata } from 'next';
import './globals.css';
import { AuthInit } from './components/AuthInit';
import { QueryProvider } from './components/QueryProvider';

export const metadata: Metadata = {
  title: 'SERCOP – Admin',
  description: 'Panel de administración',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <AuthInit />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
