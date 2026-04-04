'use client';

import { useEffect, useState } from 'react';
import { Card } from '@sercop/design-system';
import { api, setBaseUrl } from '@sercop/api-client';
import { PublicShell } from '../components/PublicShell';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

type NetworkNode = {
  id: string;
  name: string;
  contractCount: number;
  totalAmount: number;
};

type NetworkEdge = {
  providerAId: string;
  providerBId: string;
  sharedTenders: number;
};

export default function RedesProveedoresPage() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [neighbors, setNeighbors] = useState<NetworkNode[]>([]);
  const [minShared, setMinShared] = useState(2);
  const [loading, setLoading] = useState(true);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getProviderNetwork({ minShared })
      .then((r) => { setNodes(r.nodes); setEdges(r.edges); setLoading(false); })
      .catch(() => setLoading(false));
  }, [minShared]);

  const handleNodeClick = async (node: NetworkNode) => {
    setSelectedNode(node);
    setLoadingNeighbors(true);
    try {
      const r = await api.getProviderNeighbors(node.id);
      setNeighbors(r.data);
    } finally {
      setLoadingNeighbors(false);
    }
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  // Prepare scatter chart data: position nodes by contractCount (x) vs totalAmount (y)
  const scatterData = nodes.map((n, i) => ({
    ...n,
    x: n.contractCount,
    y: n.totalAmount,
    fill: `hsl(${(i * 47) % 360}, 65%, 50%)`,
  }));

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Red de Proveedores</h1>
            <p className="text-sm text-text-secondary">
              Relaciones entre proveedores que participan en procesos comunes. Útil para detectar patrones de colusión potencial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Mínimo de procesos compartidos:</label>
            <select
              value={minShared}
              onChange={(e) => setMinShared(parseInt(e.target.value))}
              className="rounded border border-neutral-200 px-3 py-1.5 text-sm"
            >
              {[2, 3, 5, 10].map((v) => <option key={v} value={v}>{v}+</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-text-secondary">Proveedores en red</p>
                <p className="mt-1 text-2xl font-bold">{nodes.length}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-text-secondary">Relaciones detectadas</p>
                <p className="mt-1 text-2xl font-bold">{edges.length}</p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm text-orange-700">Máx. procesos compartidos</p>
                <p className="mt-1 text-2xl font-bold text-orange-700">
                  {edges.length > 0 ? Math.max(...edges.map((e) => e.sharedTenders)) : 0}
                </p>
              </div>
            </div>

            {nodes.length === 0 ? (
              <Card title="Sin datos">
                <p className="py-4 text-center text-text-secondary">
                  No se encontraron relaciones con {minShared}+ procesos compartidos. Pruebe reducir el mínimo.
                </p>
              </Card>
            ) : (
              <>
                <Card title="Mapa de proveedores (contratos vs monto total)">
                  <p className="mb-2 text-xs text-text-secondary">
                    Cada punto representa un proveedor. Eje X: número de contratos. Eje Y: monto total contratado.
                    Los proveedores con más conexiones en la red aparecen en tamaño relativo.
                  </p>
                  <ResponsiveContainer width="100%" height={350}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="x"
                        name="Contratos"
                        type="number"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Cantidad de contratos', position: 'bottom', fontSize: 12 }}
                      />
                      <YAxis
                        dataKey="y"
                        name="Monto"
                        type="number"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const d = payload[0]?.payload as typeof scatterData[0];
                          return (
                            <div className="rounded border border-neutral-200 bg-white p-3 text-xs shadow">
                              <p className="font-semibold">{d.name}</p>
                              <p>Contratos: {d.contractCount}</p>
                              <p>Monto: {fmtCurrency(d.totalAmount)}</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        data={scatterData}
                        onClick={(d) => handleNodeClick(d as unknown as NetworkNode)}
                      >
                        {scatterData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} cursor="pointer" />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card title="Pares con más procesos en común">
                    <div className="divide-y divide-neutral-100">
                      {edges.slice(0, 10).map((e, i) => {
                        const a = nodes.find((n) => n.id === e.providerAId);
                        const b = nodes.find((n) => n.id === e.providerBId);
                        return (
                          <div key={i} className="flex items-center justify-between py-2 text-sm">
                            <div>
                              <span className="font-medium">{a?.name?.slice(0, 22) ?? e.providerAId.slice(0, 8)}</span>
                              <span className="mx-2 text-text-secondary">↔</span>
                              <span className="font-medium">{b?.name?.slice(0, 22) ?? e.providerBId.slice(0, 8)}</span>
                            </div>
                            <span className="ml-4 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                              {e.sharedTenders} procesos
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title={selectedNode ? `Conexiones de: ${selectedNode.name.slice(0, 30)}` : 'Seleccione un proveedor'}>
                    {!selectedNode ? (
                      <p className="py-4 text-center text-sm text-text-secondary">
                        Haga click en un punto del gráfico o en un proveedor de la lista para ver sus conexiones.
                      </p>
                    ) : loadingNeighbors ? (
                      <div className="h-24 animate-pulse rounded bg-neutral-100" />
                    ) : neighbors.length === 0 ? (
                      <p className="py-4 text-center text-sm text-text-secondary">Sin conexiones con el filtro actual.</p>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {neighbors.map((n) => (
                          <div key={n.id} className="flex items-center justify-between py-2 text-sm">
                            <span>{n.name.slice(0, 30)}</span>
                            <span className="text-text-secondary">{fmtCurrency(n.totalAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
