"use client";

import { useState } from 'react';

export default function PublishInfima() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Validating and Publishing...');
    try {
      const res = await fetch('http://localhost:3080/api/v1/tenders/infima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer STUB_ADMIN_TOKEN' }, // Stub for valid backend mapping
        body: JSON.stringify({ title, estimatedAmount: Number(amount) })
      });
      if (res.ok) setStatus('Published successfully to Public Portal!');
      else setStatus('Error parsing validation constraints.');
    } catch(err) {
      setStatus('Network / Fastify instance error.');
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto font-sans">
      <h1 className="text-3xl font-extrabold mb-2 text-slate-800">Publicación Rápida: Ínfima Cuantía</h1>
      <p className="text-slate-600 mb-6">Módulo simplificado para la adquisición de bienes o servicios de cuantía menor, exento de uso complejo de pliegos.</p>
      
      <form onSubmit={handlePublish} className="bg-white p-6 shadow-sm rounded-lg border border-slate-200">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Objeto de Contratación (Concepto Factura)</label>
            <input required type="text" className="w-full border-slate-300 border p-3 rounded-md focus:ring focus:ring-blue-200 outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Adquisición de teclados para laboratorio" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Monto Estimado (USD, sin IVA)</label>
            <input required type="number" step="0.01" className="w-full border-slate-300 border p-3 rounded-md focus:ring focus:ring-blue-200 outline-none" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ej. 1200.50" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Archivo Adjunto (TDR u Oficio)</label>
            <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-semibold px-4 py-3 rounded-md shadow-md hover:bg-blue-700 transition">
            Publicar Proceso de Compra
          </button>
          {status && <div className="p-3 mt-4 bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded">{status}</div>}
        </div>
      </form>
    </div>
  );
}
