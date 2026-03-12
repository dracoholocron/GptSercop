'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken, getEntityId } from '../lib/auth';
import Link from 'next/link';
import { EntityShell } from '../components/EntityShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function RendicionCuentasPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const entityId = getEntityId();

  useEffect(() => {
    if (token) setToken(token);
    if (entityId) {
      api.getAudit({ contractingEntityId: entityId, limit: 50 }).then((r) => {
        setLogs((r.data as Array<Record<string, unknown>>) ?? []);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else setLoading(false);
  }, [token, entityId]);

  return (
    <EntityShell activeId="rendicion-cuentas">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Rendición de cuentas</h1>
        {!token || !entityId ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-primary hover:underline">Ir a login</Link>
          </Card>
        ) : loading ? (
          <p className="text-text-secondary">Cargando…</p>
        ) : (
          <Card title="Auditoría de acciones (entidad)">
            <p className="mb-4 text-sm text-text-secondary">Acciones recientes asociadas a su entidad.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-text-primary">Fecha</th>
                    <th className="px-4 py-2 text-left font-medium text-text-primary">Acción</th>
                    <th className="px-4 py-2 text-left font-medium text-text-primary">Tipo</th>
                    <th className="px-4 py-2 text-left font-medium text-text-primary">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-4 text-text-secondary">Sin registros para esta entidad</td></tr>
                  )}
                  {logs.map((l) => (
                    <tr key={String(l.id)} className="border-b border-neutral-100">
                      <td className="px-4 py-2 text-text-secondary">{l.occurredAt ? new Date(String(l.occurredAt)).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2">{String(l.action)}</td>
                      <td className="px-4 py-2">{String(l.entityType)}</td>
                      <td className="px-4 py-2">{String(l.entityId ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </EntityShell>
  );
}
