# Principios de diseño y tokens

## Principios

| Principio | Aplicación |
|-----------|------------|
| Mobile-first | Diseño base 320px, progresión a tablet (768px) y desktop (1024px+) |
| Accesibilidad WCAG 2.1 AA | Contraste ≥4.5:1, foco visible, labels, roles ARIA |
| Consistencia | Mismos patrones en todos los portales |
| Feedback inmediato | Loading, mensajes éxito/error |
| Progressive disclosure | Información por capas |

## Design tokens

- **Colores:** primary #0d47a1, success #2e7d32, error #c62828, neutral scale
- **Espaciado:** base 8px (1=4px, 2=8px, 4=16px, 8=32px)
- **Breakpoints:** sm 640, md 768, lg 1024, xl 1280 px

## Accesibilidad

- Contraste mínimo 4.5:1 (texto normal)
- focus-visible en elementos interactivos
- aria-label en iconos
- Labels asociados a inputs
- Navegación por teclado completa

**Verificación WCAG 2.1 AA:** En CI, los E2E del admin ejecutan @axe-core/playwright sobre la página de login (tags wcag2a, wcag2aa). El E2E del portal público incluye comprobación del skip link. Para auditorías completas, usar navegador con extensión de accesibilidad o servicio de testing (ej. Lighthouse, Pa11y).
