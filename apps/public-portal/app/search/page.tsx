"use client";

import { useState } from 'react';

export default function AdvancedSearchPage() {
  const [filters, setFilters] = useState({
    q: '',
    ragQuery: '',
    minAmount: '',
    maxAmount: '',
    processTypes: [] as string[],
    statuses: [] as string[]
  });
  
  const [results, setResults] = useState<any[]>([]);
  const [ragSummary, setRagSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ totalCount: 0, limit: 50, skip: 0 });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // Transform arrays if needed
    const payload = {
      ...filters,
      minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined
    };

    try {
      const res = await fetch('http://localhost:3080/api/v1/tenders/advanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResults(data.data || []);
      setRagSummary(data.ragSummary || '');
      if (data.pagination) setPagination(data.pagination);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayFilter = (field: 'processTypes' | 'statuses', val: string) => {
    setFilters(prev => {
      const arr = prev[field];
      if (arr.includes(val)) return { ...prev, [field]: arr.filter(x => x !== val) };
      return { ...prev, [field]: [...arr, val] };
    });
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      {/* Sidebar Filtros */}
      <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shadow-sm z-10 hidden md:flex">
        <h2 className="text-lg font-bold text-slate-800">Filtros Avanzados</h2>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Palabra Clave (Título)</label>
          <input type="text" className="border border-slate-300 rounded p-2 text-sm focus:ring focus:ring-indigo-200 outline-none" placeholder="Construcción, Laptops..." value={filters.q} onChange={e => setFilters({...filters, q: e.target.value})} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Rango de Monto (USD)</label>
          <div className="flex items-center gap-2">
            <input type="number" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Min" value={filters.minAmount} onChange={e => setFilters({...filters, minAmount: e.target.value})} />
            <span className="text-slate-400">-</span>
            <input type="number" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Max" value={filters.maxAmount} onChange={e => setFilters({...filters, maxAmount: e.target.value})} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Tipo de Procedimiento</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" onChange={() => toggleArrayFilter('processTypes', 'LICITACION')} /> Licitación</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" onChange={() => toggleArrayFilter('processTypes', 'INFIMA_CUANTIA')} /> Ínfima Cuantía</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" onChange={() => toggleArrayFilter('processTypes', 'SUBASTA_INVERSA')} /> Subasta Inversa</label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Estado del Proceso</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" onChange={() => toggleArrayFilter('statuses', 'published')} /> Publicado</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" onChange={() => toggleArrayFilter('statuses', 'awarded')} /> Adjudicado</label>
        </div>

        <button onClick={() => handleSearch()} className="mt-auto bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-semibold py-2 rounded-md shadow-sm transition">Aplicar Filtros</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto w-full">
        
        {/* RAG Search Bar */}
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-3">
          <h1 className="text-2xl font-extrabold text-indigo-950 flex items-center gap-2">
            ✨ Búsqueda Semántica Asistida (RAG)
          </h1>
          <p className="text-slate-500 text-sm">Escribe en lenguaje natural lo que buscas. Nuestro bot analizará pliegos, resoluciones y CPCs vinculados.</p>
          <form className="flex gap-4 flex-col md:flex-row" onSubmit={handleSearch}>
            <input type="text" className="flex-1 border-2 border-indigo-200 rounded-lg p-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-slate-700" placeholder="Ej: Quiero ver licitaciones de mantenimiento de aires acondicionados en Guayas del último mes..." value={filters.ragQuery} onChange={e => setFilters({...filters, ragQuery: e.target.value})} />
            <button type="submit" className="bg-indigo-600 text-white font-bold px-8 py-3 md:py-0 rounded-lg hover:bg-indigo-700 shadow-md">Consultar</button>
          </form>
        </div>

        {/* Results Metadata */}
        <div className="flex justify-between items-end">
          <div className="text-slate-600 font-medium">
            Se encontraron <span className="text-indigo-600 font-bold">{pagination.totalCount}</span> procesos {loading && <span className="animate-pulse ml-2 text-indigo-400">Buscando...</span>}
          </div>
        </div>

        {/* RAG Summary Box */}
        {ragSummary && (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-lg text-emerald-800 text-sm leading-relaxed shadow-inner">
            <strong className="block mb-2 text-emerald-900">💡 Análisis de IA (GPT-Sercop):</strong>
            {ragSummary}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-4">
          {results.map(r => (
            <div key={r.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition group cursor-pointer flex flex-col md:flex-row justify-between gap-4 md:items-center">
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">{r.processType || 'LICITACION'}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${r.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{r.status?.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition">{r.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{r.description || 'Sin descripción detallada.'}</p>
                <div className="text-xs font-medium text-slate-400 mt-3 flex items-center gap-3">
                  <span>🏢 {r.procurementPlan?.entity?.name || 'ENTIDAD STUB'}</span>
                  <span>📅 {new Date(r.publishedAt || r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-slate-500 font-semibold mb-1">Monto Estimado</div>
                <div className="text-2xl font-black text-slate-700">${Number(r.estimatedAmount || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="text-center py-16 text-slate-400 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
              <span className="text-4xl block mb-2">🔍</span>
              No se encontraron resultados para tu búsqueda.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
