# Resumen del plan de mejoras UX/UI (SERCOP V2)

## Decisiones aplicadas

- **Paleta:** Primary #0A66C2, accent #059669, fondo hero #F0F7FF. Texto primario #1A1A1A, secundario #525252.
- **Tipografía:** Source Sans 3 (next/font/google) para el portal público; misma escala en todos los portales.
- **Logo y favicon:** SVG único (logo-sercop.svg, favicon.svg) replicado en public de cada app; integrado vía prop `logo` en AppHeader.
- **Componentes:** Button con variante `accent`; Card con variantes `default`, `elevated`, `outline`; Input con `iconLeft`; EmptyState y Skeleton (variant card); iconos desde design-system (Lucide).
- **Portal público:** Hero con búsqueda RAG; filtros colapsables en móvil y chips de filtros activos en Procesos; breadcrumb y EmptyState en detalle; skeletons en cargas; Cifras con bloque "En números" y tokens; Enlaces con icono ExternalLink y botón "Ir al sitio".

## Fases ejecutadas

1. **Fundamentos:** Tokens, Tailwind theme en las 4 apps, tipografía, logo/favicon, AppHeader con logo.
2. **Componentes:** Button/Card/Input/AppFooter con tokens; iconos; EmptyState; Skeleton card.
3. **Portal público:** Hero, home (normativa + procesos con skeletons/empty), procesos (filtros, chips, empty), detalle (breadcrumb, skeleton, empty), normativa (búsqueda, empty).
4. **Cifras y Enlaces:** Cifras con tokens y sección "En números"; Enlaces con cards elevated e icono.
5. **Documentación:** 01_design_principles.md actualizado; este resumen en 07_plan-mejoras-ux-ui.md.

## Verificación

Tras los cambios se ejecuta: build, smoke, test:integration, test:security, E2E admin. Contraste y accesibilidad verificados con axe en E2E.
