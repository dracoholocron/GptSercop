# Plan paso 5 – Funcionalidades a partir del transcript SERCOP

Funcionalidades y mejoras identificadas en el transcript del video (principios del Sistema Nacional de Contratación Pública) que podemos implementar o reforzar.

## Prioridad alta (implementadas o en curso)

1. **Notificaciones / Comunicados** – Página en portal público que liste oficios, comunicados y avisos del ente rector (documentType `comunicado` en RAG). Enlace en menú.
2. **Tipo de catálogo: dinámico inclusivo vs electrónico** – El transcript diferencia catálogo dinámico inclusivo (solo MIPyMEs y economía popular solidaria) y catálogo electrónico (todos). Añadir campo `catalogType` en Catálogo y en UI de entidad.
3. **Criterios de sostenibilidad y mejor valor por dinero** – En creación de proceso (entidad), campos opcionales para criterios de sostenibilidad (ambiental, social, económico) y de mejor valor por dinero (vida útil, eficiencia, impacto). El modelo Tender ya tiene `sustainabilityCriteria` y `valueForMoneyCriteria` (Json).

## Prioridad media (implementados)

4. **Reclamos – plazo 3 días** – En gestión de reclamos (admin), caja informativa: “Los proveedores tienen 3 días para que el reclamo cause estado…”
5. **Informe de resultado – mensaje de buena práctica** – En pantalla de contrato (entidad), texto recomendando elaborar informe al cierre y anexarlo al expediente.
6. **Administrador de contrato** – En pantalla de contrato (entidad), texto de ayuda: designación por máxima autoridad, objeción en 3 días motivada.

## Prioridad baja / referencia

7. **Contratación en cifras** – Ya existe `/cifras` con métricas (procesos, publicados, proveedores, contratos). Revisar que el endpoint de analíticas devuelva datos coherentes.
8. **Correlacionador CPC / SRI** – En producción integrar validación de códigos CPC con actividades en SRI; en desarrollo mantener stub de sugerencias CPC.
9. **Certificación por roles / fundamentos** – Página informativa o enlace a cronograma externo (no crítico para MVP).
10. **Preferencia local (Amazonía, Galápagos)** – Referencia normativa; posible filtro o etiqueta en procesos por circunscripción (no implementado en esta fase).

---

## Estado de implementación

| # | Funcionalidad | Estado |
|---|----------------|--------|
| 1 | Notificaciones/Comunicados | Implementado: página /notificaciones, RAG documentType comunicado, seed, nav |
| 2 | Catálogo dinámico inclusivo / electrónico | Implementado: catalogType en schema/API/UI (entidad) |
| 3 | Criterios sostenibilidad y valor por dinero en proceso | Implementado: campos en crear proceso (entidad) y API |
| 4 | Reclamos plazo 3 días | Implementado: caja informativa en admin/reclamos |
| 5 | Informe resultado – buena práctica | Implementado: texto en contrato (entidad) |
| 6 | Administrador contrato – ayuda | Implementado: texto designación y objeción 3 días |
| 7–10 | Resto | Pendiente / referencia |
