# Evidencia Fase 5 – TanStack Query (admin)

## Contenido implementado

- **@tanstack/react-query** en sercop-admin. QueryClientProvider en layout.
- **/usuarios**: useQuery para listado (queryKey ['users', token], invalidación automática).
- **/normativa**: useQuery para listado de chunks; useMutation para crear/actualizar y eliminar, con invalidación de la query tras éxito.

## Cómo reproducir

1. Admin: `npm run dev:admin`.
2. Navegar a Usuarios y Normativa; comprobar carga y que crear/editar/eliminar actualiza el listado sin recarga manual.

## Beneficios

- Cache y revalidación; estados isLoading/isPending; menos fetch manual y duplicado.
