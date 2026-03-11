'use client';

import { Card } from '@sercop/design-system';
import { PublicShell } from '../components/PublicShell';

const SERVICES = [
  { title: 'Capacitación y Certificación', desc: 'Capacitación en contratación pública.' },
  { title: 'Herramientas de la Contratación Pública', desc: 'Herramientas y sistemas de apoyo.' },
  { title: 'Sistema de Gestión de Denuncias', desc: 'Canal para denuncias en procesos.' },
  { title: 'Atención al Usuario', desc: 'Soporte y consultas.' },
  { title: 'Documentos de incorporación proveedores', desc: 'Catálogo y requisitos.' },
  { title: 'Compras Públicas Sostenibles', desc: 'Criterios de sostenibilidad.' },
  { title: 'Estrategia Nacional de Integridad', desc: 'Integridad en la contratación.' },
  { title: 'Acuerdos Comerciales', desc: 'Tratados y acuerdos aplicables.' },
  { title: 'Sistema de Gestión Integrado (antisoborno)', desc: 'Normas antisoborno.' },
];

export default function ServiciosPage() {
  return (
    <PublicShell activeId="servicios">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Servicios</h1>
        <p className="mb-8 text-gray-600">Servicios disponibles del Servicio Nacional de Contratación Pública.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {SERVICES.map((s) => (
            <Card key={s.title} title={s.title}>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
