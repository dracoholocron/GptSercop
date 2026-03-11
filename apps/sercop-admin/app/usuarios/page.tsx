'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

function exportUsersCsv(users: UserRow[]) {
  const headers = ['Email', 'Nombre', 'Estado', 'Entidad'];
  const rows = users.map((u) => [
    u.email,
    u.fullName,
    u.status,
    u.organization?.name ?? '',
  ].map((c) => (c.includes(',') || c.includes('"') ? `"${String(c).replace(/"/g, '""')}"` : c)).join(','));
  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  organizationId?: string | null;
  organization?: { name: string; code: string | null } | null;
};

export default function UsuariosPage() {
  const token = getToken();

  const { data, isLoading } = useQuery({
    queryKey: ['users', token],
    queryFn: async () => {
      if (!token) return { data: [] as UserRow[], total: 0 };
      setToken(token);
      return api.getUsers({ limit: 50, offset: 0 });
    },
    enabled: !!token,
  });

  const users = (data?.data as UserRow[]) ?? [];
  const total = data?.total ?? 0;

  return (
    <AdminShell activeId="usuarios">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Usuarios</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">
              Ir a login
            </Link>
          </Card>
        ) : (
          <>
            {isLoading ? (
              <p>Cargando…</p>
            ) : (
              <Card title={`Usuarios (${total} total)`}>
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportUsersCsv(users)}
                    disabled={users.length === 0}
                    aria-label="Exportar lista de usuarios en CSV"
                  >
                    Exportar CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Entidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                            No hay usuarios
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="border-b border-gray-100">
                            <td className="px-4 py-2">{u.email}</td>
                            <td className="px-4 py-2">{u.fullName}</td>
                            <td className="px-4 py-2">{u.status}</td>
                            <td className="px-4 py-2">{u.organization?.name ?? '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
