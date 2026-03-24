# Brechas – Experiencia general y específica (licitación)

**Referencia:** Transcripts de licitación en bienes y servicios (gran escala) y principios; Reglamento LOSNCP art. 28.

## Reglas del transcript / normativa

- **Experiencia general:** Acreditación de experiencia con antigüedad de al menos **12 meses** en la actividad objeto del contrato (dependencia temporal).
- **Personas jurídicas con menos de 12 meses:** La experiencia puede acreditarse mediante los **accionistas** o representantes legales que cumplan el requisito de experiencia.
- La evaluación de experiencia forma parte de la fase de calificación y puede ser exigida en los pliegos/TDR.

## Estado actual en la aplicación

No existe en el código actual:

- Modelo de datos para registrar “experiencia” del proveedor (general o por ítem/actividad).
- Modelo para acreditar experiencia de accionistas en caso de PJ con menos de 12 meses.
- Motor de validación de plazos (12 meses) ni de asociación experiencia–proceso/ítem.
- UI para que el proveedor cargue o declare experiencia ni para que la entidad evalúe criterios de experiencia.

## Opciones para una fase posterior

1. **Campo declarativo:** Añadir en oferta o en perfil de proveedor un campo declarativo (texto o checkbox) de “experiencia conforme a pliegos”, sin validación automática de plazos ni documentos.
2. **Adjuntos sin validación:** Permitir adjuntar documentos de experiencia (por proceso o por proveedor) sin validación automática de fechas (12 meses) ni de vínculo con accionistas.
3. **Módulo de experiencia:** Modelo y flujo que incluyan:
   - Registro de experiencia (actividad, fechas inicio/fin, descripción).
   - Para PJ &lt; 12 meses: registro de experiencia de accionistas o representantes legales.
   - Validación de plazos (≥ 12 meses) y asociación a ítem/actividad del proceso.
   - Integración en la fase de calificación (criterios de experiencia en TDR).

## Resumen

La funcionalidad de **experiencia general y específica** queda documentada como brecha. No se incluyen tareas de implementación en el plan actual “Brechas transcripts licitación y principios”; las opciones anteriores sirven para priorizar una fase posterior.
