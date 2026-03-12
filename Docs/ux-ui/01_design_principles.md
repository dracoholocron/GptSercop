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

- **Colores (paleta vanguardia):** primary #0A66C2, primaryHover #0052A3, accent #059669, backgroundHero #F0F7FF, textPrimary #1A1A1A, textSecondary #525252, success #059669, error #DC2626, warning #f59e0b, neutral scale
- **Espaciado:** base 8px (1=4px, 2=8px, 4=16px, 8=32px)
- **Breakpoints:** sm 640, md 768, lg 1024, xl 1280 px
- **Tipografía:** Portal público usa Source Sans 3 (next/font/google). Escala: 14/16/18/24/32 px; pesos 400, 500, 600, 700. Clases: font-sans (cuerpo), font-heading (títulos)
- **Logo:** SVG en `/public/logo-sercop.svg` (símbolo + texto SERCOP). Favicon en `/public/favicon.svg`. Usar en header de todos los portales con alt "SERCOP".
- **Iconografía:** Lucide React (lucide-react) exportado desde el design-system (Search, FileText, ExternalLink, etc.). Uso consistente en búsqueda, navegación y CTAs.

## Accesibilidad

- Contraste mínimo 4.5:1 (texto normal)
- focus-visible en elementos interactivos
- aria-label en iconos
- Labels asociados a inputs
- Navegación por teclado completa

**Verificación WCAG 2.1 AA:** En CI, los E2E del admin ejecutan @axe-core/playwright sobre la página de login (tags wcag2a, wcag2aa). El E2E del portal público incluye comprobación del skip link. Para auditorías completas, usar navegador con extensión de accesibilidad o servicio de testing (ej. Lighthouse, Pa11y).
