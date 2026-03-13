'use client';

/**
 * Captura errores en el root layout (html/body).
 * Debe incluir su propio html y body.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', padding: '2rem', background: '#fafafa' }}>
        <div style={{ maxWidth: '32rem', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#1a1a1a' }}>Error del portal</h1>
          <p style={{ marginTop: '0.5rem', color: '#525252' }}>
            Ha ocurrido un error inesperado. Intente recargar la página.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#0A66C2',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
