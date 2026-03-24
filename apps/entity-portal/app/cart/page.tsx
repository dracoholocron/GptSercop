"use client";

import { useState, useEffect } from 'react';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await fetch('http://localhost:3080/api/v1/catalogs/cart?entityId=STUB_ENTITY_ID');
      if (res.ok) setCart(await res.json());
    } catch(e) { }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const handleCheckout = async () => {
    try {
      const res = await fetch('http://localhost:3080/api/v1/catalogs/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: 'STUB_ENTITY_ID' })
      });
      if (res.ok) {
        const po = await res.json();
        alert(`¡Orden de Compra Generada Exitosamente!\nFolio Contractual: ${po.orderNo}`);
        fetchCart();
      } else {
        alert('Error: Asegúrate que los CatalogItems existan en BD (Mock Database Integrity).');
      }
    } catch(e) {}
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">🛒 Mi Carrito Automático</h1>
        <a href="/catalog" className="text-indigo-600 font-bold hover:underline transition">← Volver al Catálogo</a>
      </div>

      {loading ? <p className="text-slate-500 animate-pulse font-medium">Cargando ítems...</p> : !cart || !cart.items || cart.items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 p-16 text-center rounded-2xl text-slate-500 shadow-sm">
          <p className="text-2xl font-bold mb-4 text-slate-400">Tu carrito institucional está vacío.</p>
          <a href="/catalog" className="inline-block bg-slate-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-900 shadow-md transition">Ir al Catálogo de Productos</a>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-fit">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <tr>
                  <th className="p-5 font-bold">Producto Seleccionado</th>
                  <th className="p-5 font-bold text-center">Cant.</th>
                  <th className="p-5 font-bold text-right">Precio Un.</th>
                  <th className="p-5 font-bold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((it: any) => (
                  <tr key={it.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="p-5 font-bold text-slate-800">{it.catalogItem?.name || 'Ítem Externo (ID: ' + it.catalogItemId.substring(0,8) + ')'}</td>
                    <td className="p-5 text-center font-semibold text-indigo-600 bg-indigo-50 rounded-md m-2 inline-block w-12">{it.quantity}</td>
                    <td className="p-5 text-right font-medium text-slate-500">${Number(it.unitPrice).toFixed(2)}</td>
                    <td className="p-5 text-right font-black text-slate-800">${Number(it.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="w-full lg:w-96">
            <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl sticky top-8">
              <h2 className="text-xl font-bold mb-6 text-indigo-200 border-b border-slate-700 pb-4">Resumen de Contratación</h2>
              <div className="flex justify-between mb-3 text-slate-300 font-medium">
                <span>Subtotal (Sin IVA)</span>
                <span>${Number(cart.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-6 text-slate-400 font-medium tracking-wide">
                <span>IVA (15%)</span>
                <span>${(Number(cart.totalAmount) * 0.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-black text-3xl border-t border-slate-600 pt-6 mb-8 text-white">
                <span className="text-lg">TOTAL</span>
                <span>${(Number(cart.totalAmount) * 1.15).toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black py-4 px-2 rounded-xl shadow-lg transition transform hover:-translate-y-1 active:translate-y-0">
                ✔️ GENERAR ORDEN (P.O.)
              </button>
              <p className="text-xs text-slate-400 mt-4 text-center leading-relaxed">
                Al generar la orden de compra, los fondos serán reservados de la partida presupuestaria vinculada automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
