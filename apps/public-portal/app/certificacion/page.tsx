'use client';

import { Card } from '@sercop/design-system';
import { PublicShell } from '../components/PublicShell';

export default function CertificacionPage() {
  return (
    <PublicShell activeId="certificacion">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Certificación por roles y fundamentos</h1>
        <p className="mb-6 text-text-secondary">
          La certificación de fundamentos en contratación pública permite a los funcionarios y proveedores acreditar
          el conocimiento de los principios y normativa del Sistema Nacional de Contratación Pública.
        </p>
        <Card variant="outline" className="mb-6">
          <h2 className="mb-2 text-lg font-medium text-text-primary">Frecuencia y registro</h2>
          <p className="text-text-secondary">
            La certificación de fundamentos se realiza <strong>todos los sábados</strong> durante el año.
            El registro para participar está disponible de <strong>sábado a martes</strong> de cada semana.
          </p>
        </Card>
        <Card variant="outline" className="mb-6">
          <h2 className="mb-2 text-lg font-medium text-text-primary">Certificación por roles</h2>
          <p className="text-text-secondary">
            La certificación por roles se publicará en el portal cuando estén definidas las fases. La certificación de fundamentos se realiza todos los sábados; puede registrarse de sábado a martes.
          </p>
        </Card>
        <Card variant="outline">
          <h2 className="mb-2 text-lg font-medium text-text-primary">Cronograma</h2>
          <p className="text-text-secondary">
            El cronograma detallado y los enlaces de inscripción se publicarán en esta sección cuando estén disponibles.
            Para más información, consulte el portal oficial de Compras Públicas o las notificaciones y comunicados.
          </p>
          <a
            href="/notificaciones"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Ver notificaciones y comunicados
          </a>
        </Card>
      </div>
    </PublicShell>
  );
}
