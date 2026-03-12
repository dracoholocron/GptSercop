# Revisión transcript YouTube – Principios del Sistema Nacional de Contratación Pública

**Fuente:** `Docs/transcrip youtube video 1.sty` (SercopCapacita – 12 principios, 10 mar 2026).

## Ya cubierto en la aplicación

- **12 principios** en página Principios (public-portal).
- **Denuncias** (portal público, sistema de gestión de denuncias).
- **Reclamos** (proveedor puede presentar reclamo; admin puede responder).
- **Liberación por no producción nacional** (solicitud y aprobación en entidad/admin).
- **BAE (Valor Agregado Ecuatoriano)** y verificación en evaluaciones.
- **Inhabilidades** (arts. 75-76): declaración de no incurrir en inhabilidades en ofertas.
- **Preferencia territorial** (Amazonía, Galápagos) en creación de proceso.
- **Administrador del contrato** (nombre, email) en contrato.
- **Plan de contingencia** (procesos en régimen emergencia).
- **Firma electrónica** (campo en proceso licitación; wizard oferta con OTP).
- **Catálogo dinámico inclusivo / catálogo electrónico** (referencias y tipos en modelo).
- **Plazos y requisitos licitación** (página `/licitacion-plazos` con tiempos mínimos, existencia legal, convalidación, adjudicatario fallido).
- **Convalidación** (solicitud, respuesta, descripción de errores, respuesta entidad) en API y UI entidad.
- **Rendición de cuentas** (enlace en menú entidad).

## Funcionalidades o mejoras sugeridas a partir del transcript

1. **Informe de resultado / principio “resultado”**  
   El transcript indica que, al cierre o entrega del contrato, la entidad debería elaborar un informe que verifique si lo contratado sirvió para satisfacer la necesidad (principio del resultado).  
   - **Estado:** Ya existe `result_report` / informe de resultado en el contrato (documento y relación en schema).  
   - **Sugerencia:** Revisar que en la UI de contrato esté claro que ese documento cumple el informe de cierre/resultado; opcional: texto de ayuda que cite el principio “resultado”.

2. **Plazo de 3 días para reclamos (cause estado)**  
   Se menciona que los proveedores tienen 3 días para presentar reclamo para que cause estado.  
   - **Sugerencia:** Mostrar en la UI de detalle de proceso (o en ayuda) el texto: “Los reclamos deben presentarse dentro del plazo indicado (ej. 3 días) para que cause estado.” Si existe `claimWindowDays` en el proceso, mostrarlo explícitamente en el detalle público/proveedor.

3. **Certificación por roles y certificación de fundamentos**  
   Se menciona “certificación por roles” (por publicar) y “certificación de fundamentos” (sábados).  
   - **Sugerencia:** En la página de Certificación (public-portal), añadir un párrafo: “La certificación por roles se publicará en el portal cuando estén definidas las fases. La certificación de fundamentos se realiza todos los sábados; puede registrarse de sábado a martes.”

4. **Objeción a la designación de administrador de contrato**  
   El transcript indica que el designado puede poner objeción en 3 días, debidamente motivada.  
   - **Sugerencia (opcional):** Campo o flujo “Objeción a designación” (fecha límite 3 días, texto motivado) en la entidad, vinculado al administrador del contrato; o solo texto informativo en la sección de contrato.

5. **Unificación de plazos (TDR vs contrato)**  
   Se recomienda unificar criterios entre pliegos y contrato para plazos de controversias.  
   - **Estado:** El contrato tiene “Plazo controversias (días)”.  
   - **Sugerencia:** En ayuda o en el formulario de contrato, indicar que el plazo de controversias debe coincidir con el establecido en los TDR/pliegos.

6. **Valor por dinero en emergencias**  
   Se indica que en emergencias conviene tener plan de contingencia previo y, cuando sea posible, considerar mejor valor por dinero.  
   - **Estado:** Plan de contingencia ya está; criterios de valor por dinero/sostenibilidad existen en proceso.  
   - **Sugerencia:** En la página de plazos o en ayuda, añadir una línea: “En procesos de emergencia se recomienda contar con plan de contingencia y, cuando la premura lo permita, considerar criterios de mejor valor por dinero.”

7. **Interoperabilidad SRI (códigos CPC)**  
   Se menciona validación de códigos CPC con actividades en SRI.  
   - **Alcance:** Fuera de alcance actual (integración real SRI); solo referenciable en documentación o como mejora futura.

8. **Estudio de mercado / ínfimas**  
   Para ínfimas, al menos 3 cotizaciones e informe cuando no hay más oferta en el mercado.  
   - **Sugerencia:** Si existe modelo o campo de “estudio de mercado” o “informe de necesidad” en procesos ínfima, asegurar que en ayuda o en la UI se indique la exigencia de “al menos 3” cuando aplique.

## Resumen

- Lo ya implementado cubre la mayor parte de los temas del transcript (principios, denuncias, reclamos, BAE, liberación, preferencia territorial, administrador, plan contingencia, convalidación, plazos licitación).
- Las sugerencias anteriores son mejoras de texto (ayuda, certificación, plazos), visibilidad de campos existentes (informe de resultado, plazo reclamos) y, si se desea, un flujo opcional de objeción al administrador de contrato.
- La interoperabilidad con SRI (CPC) se deja como referencia para una fase posterior.
