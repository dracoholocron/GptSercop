'use client';

import { Card } from '@sercop/design-system';
import { PublicShell } from '../components/PublicShell';
import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Tiempos mínimos del cronograma',
    content: 'Según el Reglamento a la LOSNCP (arts. 91 y 96), los procesos de licitación deben respetar plazos mínimos entre las etapas: días mínimos para preguntas y aclaraciones, para la entrega de ofertas, para la convalidación de errores y para la adjudicación. La resolución de adjudicación no puede ser anterior a 3 días desde el fin del acto que pone término a la calificación.',
  },
  {
    title: 'Existencia legal y patrimonio',
    content: 'Para procesos con presupuesto referencial superior a $500.000, las personas jurídicas deben acreditar al menos 3 años de existencia legal desde la fecha de constitución. El proveedor debe tener registrada su fecha de constitución y, cuando aplique, el patrimonio en el Registro Único de Proveedores (RUP).',
  },
  {
    title: 'Convalidación de errores subsanables',
    content: 'Cuando una oferta presenta errores subsanables (formales o de documentación), el proveedor puede solicitar convalidación a la entidad. El plazo para solicitar convalidación es de 2 a 5 días desde la apertura de ofertas, según lo establezca el cronograma del proceso. La entidad no puede exigir en la convalidación documentación o requisitos no referenciados en el pliego.',
  },
  {
    title: 'Prohibición de retiro de oferta',
    content: 'Una vez presentada la oferta, el proveedor no puede retirarla. La presentación implica el compromiso de cumplir con lo ofertado en caso de ser adjudicado.',
  },
  {
    title: 'Adjudicatario fallido y sanción',
    content: 'Si el adjudicatario no firma el contrato en el plazo establecido o incumple condiciones esenciales para la formalización, la entidad puede declararlo adjudicatario fallido. Esta declaración conlleva una sanción de 3 años durante los cuales el proveedor no podrá participar en procesos de contratación pública, conforme a la normativa vigente.',
  },
  {
    title: 'Procesos en régimen de emergencia',
    content: 'En procesos de emergencia se recomienda contar con plan de contingencia y, cuando la premura lo permita, considerar criterios de mejor valor por dinero.',
  },
];

export default function LicitacionPlazosPage() {
  return (
    <PublicShell activeId="licitacion-plazos">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Plazos y requisitos – Licitación en bienes y servicios</h1>
        <p className="mb-6 text-text-secondary">
          Información de referencia sobre tiempos mínimos, existencia legal, convalidación de ofertas y consecuencias por adjudicatario fallido en procesos de licitación. Consulte la normativa vigente y los pliegos de cada proceso para los plazos exactos.
        </p>
        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <Card key={s.title} variant="outline">
              <h2 className="mb-2 text-lg font-medium text-text-primary">{s.title}</h2>
              <p className="text-sm text-text-secondary">{s.content}</p>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-sm text-text-secondary">
          <Link href="/principios" className="text-primary underline hover:no-underline">Ver los 12 principios del Sistema Nacional de Contratación Pública</Link>.
        </p>
      </div>
    </PublicShell>
  );
}
