"use client";

import { useState, useEffect } from 'react';

export default function CatalogStore() {
  const [items, setItems] = useState<any[]>([]);

  // Productos de catálogo institucional mapeados (Stub)
  useEffect(() => {
    setItems([
      { id: 'cat-item-1', name: 'Laptop DELL Vostro 3000 i7 16GB', cpcCode: '45220.00.1', referencePrice: 850.00, supplier: 'DELL ECUADOR' },
      { id: 'cat-item-2', name: 'Escritorio de Madera Roble - Mod. Gerencial', cpcCode: '38111.02.1', referencePrice: 120.50, supplier: 'MUEBLES S.A.' },
      { id: 'cat-item-3', name: 'Resmas de Papel A4 x500 hojas', cpcCode: '32129.00.2', referencePrice: 4.50, supplier: 'PAPELERA NACIONAL' },
    ]);
  }, []);

  const handleAddToCart = async (itemId: string) => {
    try {
      const res = await fetch('http://localhost:3080/api/v1/catalogs/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: 'STUB_ENTITY_ID', catalogItemId: itemId, quantity: 1 })
      });
      if (res.ok) alert('✅ Producto añadido al carrito Institucional');
      else alert('Error: Asegúrate de tener la base de datos poblada con estos items (UUIDs) para las foreign keys, o ignora si es demostración UI.');
    } catch(err) {
      alert('Error de red al añadir al carrito.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Catálogo Electrónico Institucional</h1>
          <p className="text-slate-600 mt-2">Adquiere bienes y servicios estandarizados de Convenio Marco de forma directa y ágil.</p>
        </div>
        <a href="/cart" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition flex items-center gap-2">
          🛒 Ir al Carrito
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map(it => (
          <div key={it.id} className="bg-white border text-center border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full mb-4 flex items-center justify-center text-4xl shadow-inner">📦</div>
            <h3 className="text-lg font-bold text-slate-700 leading-tight mb-1">{it.name}</h3>
            <p className="text-sm text-slate-400 mb-2 font-mono">CPC: {it.cpcCode}</p>
            <p className="text-xs text-indigo-600 font-bold mb-4 bg-indigo-50 px-3 py-1 rounded-full">{it.supplier}</p>
            <div className="text-3xl font-black text-slate-800 mb-6">${it.referencePrice.toFixed(2)}</div>
            <button onClick={() => handleAddToCart(it.id)} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 shadow-md transition">
              Añadir al Carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
