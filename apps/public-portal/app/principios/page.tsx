'use client';

import Link from 'next/link';
import { Card } from '@sercop/design-system';
import { PublicShell } from '../components/PublicShell';

const PRINCIPLES = [
  { name: 'Legalidad', description: 'Pilar fundamental del estado de derecho. Todas las atribuciones de las entidades contratantes y sus funcionarios deben estar estrictamente fundamentadas en la ley. Los actos administrativos del proceso deben ajustarse a la Constitución, la LOSNCP, el reglamento general y el Código Orgánico Administrativo.' },
  { name: 'Trato justo', description: 'Garantiza que todos los participantes tengan las mismas oportunidades sin discriminación ni favoritismos. Incluye igualdad de condiciones, prohibición de privilegios, transparencia en la evaluación y derechos de participación.' },
  { name: 'Participación nacional', description: 'Fomenta la participación de proveedores nacionales y el Valor Agregado Ecuatoriano (BAE) en los procesos de contratación pública, conforme a la normativa vigente.' },
  { name: 'Seguridad jurídica', description: 'Estabilidad y previsibilidad de las normas y procedimientos para que los participantes conozcan las reglas y los plazos aplicables.' },
  { name: 'Concurrencia', description: 'Promueve la competencia entre oferentes para obtener mejor valor por el dinero y condiciones favorables para la entidad.' },
  { name: 'Igualdad', description: 'Todos los oferentes deben recibir el mismo trato; no se permite direccionar procesos a favor de ciertos proveedores.' },
  { name: 'Sostenibilidad', description: 'Consideración de criterios ambientales, sociales y económicos en la contratación (eficiencia energética, materiales reciclados, inclusión, etc.).' },
  { name: 'Simplicidad', description: 'Procedimientos claros y ágiles que faciliten la participación y reduzcan cargas innecesarias.' },
  { name: 'Transparencia', description: 'Información accesible sobre pliegos, criterios, evaluaciones y resultados para garantizar el control social y la rendición de cuentas.' },
  { name: 'Integridad', description: 'Actuación ética y libre de conflictos de interés, colusión o tráfico de influencias en los procesos.' },
  { name: 'Resultado', description: 'Orientación a que lo contratado cumpla el objeto y satisfaga las necesidades de la entidad, con seguimiento y verificación de resultados.' },
  { name: 'Mejor valor por dinero', description: 'No solo el precio más bajo: se consideran vida útil, eficiencia, impacto social y criterios de mejor valor en la evaluación.' },
];

export default function PrincipiosPage() {
  return (
    <PublicShell activeId="principios">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">Los 12 principios del Sistema Nacional de Contratación Pública</h1>
        <p className="mb-6 text-text-secondary">
          Los principios son los fundamentos directrices que guían los procesos de contratación de bienes, servicios y obras.
          Están establecidos en el artículo 3 de la Ley Orgánica del Sistema Nacional de Contratación Pública (LOSNCP).
          No hay excepción para dejar de aplicarlos en ningún proceso.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          Para plazos y requisitos específicos de procesos de licitación (tiempos mínimos, existencia legal, convalidación, adjudicatario fallido), consulte{' '}
          <Link href="/licitacion-plazos" className="text-primary underline hover:no-underline">Plazos y requisitos – Licitación</Link>.
        </p>
        <div className="space-y-4">
          {PRINCIPLES.map((p, i) => (
            <Card key={p.name} variant="outline">
              <h2 className="mb-2 text-lg font-medium text-text-primary">{i + 1}. {p.name}</h2>
              <p className="text-sm text-text-secondary">{p.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
