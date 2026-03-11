'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (token) setToken(token);
    api.getAudit({ limit: 50 }).then((r) => { setLogs(r.data as Array<Record<string, unknown>>); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  return (
    <AdminShell activeId="auditoria">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Auditoría</h1>
        {!token ? (
          <Card title="Inicie sesión"><Link href="/login" className="text-blue-600 hover:underline">Ir a login</Link></Card>
        ) : loading ? (
          <p>Cargando…</p>
        ) : (
          <Card title="Log de acciones">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead><tr><th className="px-4 py-2 text-left font-medium">Fecha</th><th className="px-4 py-2 text-left font-medium">Acción</th><th className="px-4 py-2 text-left font-medium">Tipo</th><th className="px-4 py-2 text-left font-medium">ID</th></tr></thead>
                <tbody>
                  {logs.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-gray-500">Sin registros</td></tr>}
                  {logs.map((l) => (
                    <tr key={String(l.id)} className="border-b">
                      <td className="px-4 py-2">{l.occurredAt ? new Date(String(l.occurredAt)).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2">{String(l.action)}</td>
                      <td className="px-4 py-2">{String(l.entityType)}</td>
                      <td className="px-4 py-2">{String(l.entityId || '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
