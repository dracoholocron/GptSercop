'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, Select, Modal } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { getToken } from '../lib/auth';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type RagChunkRow = {
  id: string;
  title: string;
  content: string;
  source: string;
  documentType: string;
  url?: string | null;
  createdAt?: string;
};

const SOURCE_OPTIONS = [
  { value: 'normativa', label: 'Normativa' },
  { value: 'manuales', label: 'Manuales' },
  { value: 'resoluciones', label: 'Resoluciones' },
  { value: 'guias', label: 'Guías' },
  { value: 'faq', label: 'FAQ' },
];

const DOC_TYPE_OPTIONS = [
  { value: 'ley', label: 'Ley' },
  { value: 'reglamento', label: 'Reglamento' },
  { value: 'manual', label: 'Manual' },
  { value: 'resolucion', label: 'Resolución' },
  { value: 'guia', label: 'Guía' },
];

const emptyForm = {
  title: '',
  content: '',
  source: 'normativa',
  documentType: 'ley',
  url: '',
};

export default function NormativaAdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const token = getToken();
  const queryClient = useQueryClient();

  const { data: chunksData, isLoading: loading } = useQuery({
    queryKey: ['rag-chunks', token],
    queryFn: async () => {
      if (!token) return { data: [] as RagChunkRow[], total: 0 };
      setToken(token);
      return api.rag.getChunks({ limit: 50, offset: 0 });
    },
    enabled: !!token,
  });

  const chunks = (chunksData?.data as RagChunkRow[]) ?? [];
  const total = chunksData?.total ?? 0;

  const createOrUpdateMutation = useMutation({
    mutationFn: async (payload: { id?: string; title: string; content: string; source: string; documentType: string; url?: string }) => {
      setToken(token!);
      if (payload.id) return api.rag.updateChunk(payload.id, payload);
      return api.rag.createChunk(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-chunks'] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setToken(token!);
      await api.rag.deleteChunk(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-chunks'] });
      setDeleteConfirm(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Error al eliminar'),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (c: RagChunkRow) => {
    setForm({
      title: c.title,
      content: c.content,
      source: c.source,
      documentType: c.documentType,
      url: c.url || '',
    });
    setEditingId(c.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.source.trim() || !form.documentType.trim()) {
      setError('Título, contenido, fuente y tipo son obligatorios');
      return;
    }
    setError('');
    createOrUpdateMutation.mutate({
      ...(editingId ? { id: editingId } : {}),
      title: form.title.trim(),
      content: form.content.trim(),
      source: form.source.trim(),
      documentType: form.documentType.trim(),
      url: form.url.trim() || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm !== id) return;
    deleteMutation.mutate(id);
  };

  return (
    <AdminShell activeId="normativa">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold">Normativa (gestión RAG)</h1>
        {!token ? (
          <Card title="Inicie sesión">
            <Link href="/login" className="text-blue-600 hover:underline">
              Ir a login
            </Link>
          </Card>
        ) : (
          <>
            <div className="mb-4">
              <Button onClick={openCreate}>Nuevo chunk</Button>
            </div>
            {loading ? (
              <p>Cargando…</p>
            ) : (
              <Card title={`Chunks de normativa (${total} total)`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Título</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fuente</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">URL</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                            No hay chunks. Use &quot;Nuevo chunk&quot; para añadir.
                          </td>
                        </tr>
                      ) : (
                        chunks.map((c) => (
                          <tr key={c.id} className="border-b border-gray-100">
                            <td className="max-w-[200px] truncate px-4 py-2" title={c.title}>
                              {c.title}
                            </td>
                            <td className="px-4 py-2">{c.source}</td>
                            <td className="px-4 py-2">{c.documentType}</td>
                            <td className="max-w-[120px] truncate px-4 py-2" title={c.url || ''}>
                              {c.url || '—'}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => openEdit(c)}
                                className="mr-2 text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              {deleteConfirm === c.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(c.id)}
                                    disabled={deleteMutation.isPending}
                                    className="mr-2 text-red-600 hover:underline disabled:opacity-50"
                                  >
                                    Confirmar eliminar
                                  </button>
                                  <button type="button" onClick={() => setDeleteConfirm(null)} className="text-gray-600 hover:underline">
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm(c.id)}
                                  className="text-red-600 hover:underline"
                                >
                                  Eliminar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <Modal
              open={showForm}
              onClose={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
                setError('');
              }}
              title={editingId ? 'Editar chunk' : 'Nuevo chunk'}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Título"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
                <label className="block text-sm font-medium text-gray-700">
                  Contenido
                  <textarea
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    rows={4}
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    required
                  />
                </label>
                <Select
                  label="Fuente"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  options={SOURCE_OPTIONS}
                />
                <Select
                  label="Tipo de documento"
                  value={form.documentType}
                  onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
                  options={DOC_TYPE_OPTIONS}
                />
                <Input
                  label="URL (opcional)"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createOrUpdateMutation.isPending}>
                    {editingId ? 'Guardar' : 'Crear'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Modal>
          </>
        )}
      </div>
    </AdminShell>
  );
}
