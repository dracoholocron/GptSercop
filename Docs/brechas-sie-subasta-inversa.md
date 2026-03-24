# Brechas SIE (Subasta Inversa Electrónica)

Resumen de lo implementado vs. pendiente según el transcript "Subasta Inversa Electrónica" y el plan de brechas.

## Implementado

- **Presupuesto mínimo:** Validación en POST y PUT tenders: si `processType === 'sie'`, el presupuesto referencial (o estimado) debe ser mayor o igual a $10.000.
- **Negociación 5%:** En `POST /api/v1/sie/:tenderId/negotiation/final` se exige que la oferta sea al menos 5% inferior al presupuesto referencial del tender.
- **Documentación en código:** Comentario de bloque en el módulo SIE (index.ts) con reglas normativas: estandarizados, cumple/no cumple, oferta inicial = BAE, puja 15–60 min y reprogramación, negociación 5%, RUP en apertura/adjudicación/suscripción.
- **Schema:** Campos para duración de puja y reprogramación (ver más abajo); constantes de duración 15–60 min documentadas para uso futuro.
- **Batería E2E:** `e2e/battery/sie-battery.spec.ts` con casos SIE-API-1 a SIE-API-6.

## Pendiente / mejora futura

- **Reprogramación de puja:** Lógica completa: al cerrar ventana, si &lt; 2 oferentes con BID, reprogramar una sola vez 24 h; en esa ventana validar postura &lt; mínima de la puja inicial.
- **Oferta económica inicial = BAE:** Validación cruzada entre el monto de la oferta técnica (Offer/declaración BAE) y el monto enviado en `POST .../initial`; hoy no hay ligación Offer ↔ AuctionBid.
- **Adjudicación 3 días:** Término de 3 días desde fin de puja/negociación (máx. 30 días) e informe a SERCOP si no se cumple en 3 días; no implementado a nivel de plazos ni notificación.
- **Duración puja 15–60 min:** Campo configurable y uso en `getOrCreateAuction`; actualmente stub 10/20 min; constantes y schema listos para uso.

## Referencias

- Transcript: `Docs/08 19 Subasta Inversa Electrónica.TXT`
- Art. 10 Reglamento a la Ley Orgánica del Sistema Nacional de Contratación Pública.
