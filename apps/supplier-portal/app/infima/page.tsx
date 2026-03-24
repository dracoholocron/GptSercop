"use client";

import { useState } from 'react';

export default function SubmitProforma() {
  const [tenderId, setTenderId] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting Proforma...');
    try {
      const res = await fetch(`http://localhost:3080/api/v1/tenders/${tenderId}/proformas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer STUB_SUPPLIER_TOKEN' },
        body: JSON.stringify({ providerId: 'STUB_PROVIDER_123' })
      });
      if (res.ok) setStatus('Proforma received successfully by the Entity.');
      else setStatus('Error: Invalid Infima UUID or Process Status.');
    } catch(err) {
      setStatus('Network Request Failed.');
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto font-sans">
      <h1 className="text-3xl font-extrabold mb-2 text-slate-800">Enviar Proforma (Ínfima Cuantía)</h1>
      <p className="text-slate-600 mb-6">Sube tu factura proforma directamente para postular en compras menores.</p>
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <p className="text-amber-800 text-sm font-medium">Nota Legal: Al ser un procedimiento de ínfima cuantía, este envío omite la validación estricta de Pliegos firmados electrónicamente mediante el token p12.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-sm rounded-lg border border-slate-200">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">UUID del Proceso Requerido (Ínfima)</label>
            <input required type="text" className="w-full border-slate-300 border p-3 rounded-md focus:ring focus:ring-emerald-200 outline-none" value={tenderId} onChange={e => setTenderId(e.target.value)} placeholder="ej. 550e8400-e29b-41d4-a716-446655440000" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Documento de Proforma (PDF / XML Factura)</label>
            <input required type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-semibold px-4 py-3 rounded-md shadow-md hover:bg-emerald-700 transition">
            Enviar Oferta Simplificada
          </button>
          {status && <div className="p-3 mt-4 bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded">{status}</div>}
        </div>
      </form>
    </div>
  );
}
