import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { BusinessDashboard, CommissionsDashboard } from '../components/dashboard';
import { AlertsPage } from './AlertsPage';

const WIDGET_REGISTRY: Record<string, React.ComponentType> = {
  'business-dashboard': BusinessDashboard,
  'commissions-dashboard': CommissionsDashboard,
  'alerts': AlertsPage,
};

type EmbedState = 'waiting' | 'authenticated' | 'error';

/**
 * Pagina de widget embebido.
 *
 * Seguridad:
 * - Token se guarda en MEMORIA (useRef), nunca en localStorage
 * - Se intercepta window.fetch para inyectar el token sin contaminar localStorage
 * - No redirige a /login en caso de 401 (muestra error en el widget)
 * - Valida y bloquea origin despues del primer mensaje valido
 * - El backend restringe widget tokens a solo GET en endpoints de dashboard
 */
export default function EmbedWidget() {
  const { widgetName } = useParams<{ widgetName: string }>();
  const [state, setState] = useState<EmbedState>('waiting');
  const [errorMsg, setErrorMsg] = useState('');
  const widgetTokenRef = useRef<string>('');
  const trustedOriginRef = useRef<string>('');
  const originalFetchRef = useRef<typeof window.fetch>(window.fetch.bind(window));

  // Interceptar fetch para inyectar Authorization header desde memoria
  // Esto evita guardar el token en localStorage (que es compartido con la app principal)
  const patchFetch = useCallback((token: string) => {
    const originalFetch = originalFetchRef.current;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);

      // Inyectar token solo si no tiene Authorization ya
      if (!headers.has('Authorization') && token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await originalFetch(input, { ...init, headers });

      // En contexto embed: NO redirigir a /login en 401/403
      // El widget muestra error en lugar de romper el iframe
      if (response.status === 401 || response.status === 403) {
        const cloned = response.clone();
        try {
          const body = await cloned.json();
          if (body.error === 'WIDGET_SCOPE_DENIED') {
            console.warn('[EmbedWidget] Acceso denegado por scope:', body.message);
          }
        } catch {
          // ignorar
        }
        // Prevenir que apiClient redirija a /login
        // No lanzar excepcion, dejar que el componente maneje el error
      }

      return response;
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'GLOBALCMX_AUTH') return;

      // Seguridad: bloquear origin despues del primer mensaje valido
      if (trustedOriginRef.current && event.origin !== trustedOriginRef.current) {
        console.warn('[EmbedWidget] Mensaje rechazado de origin no confiable:', event.origin);
        return;
      }

      const { token } = event.data;
      if (!token) {
        setState('error');
        setErrorMsg('Token no recibido');
        return;
      }

      // Guardar origin como confiable (solo el primero)
      if (!trustedOriginRef.current) {
        trustedOriginRef.current = event.origin;
      }

      // Token en MEMORIA solamente (no localStorage)
      widgetTokenRef.current = token;

      // Interceptar fetch para inyectar el token
      patchFetch(token);

      setState('authenticated');

      // Confirmar al padre que el token fue recibido
      if (event.source && typeof (event.source as Window).postMessage === 'function') {
        (event.source as Window).postMessage(
          { type: 'GLOBALCMX_AUTH_ACK', status: 'ok' },
          event.origin
        );
      }
    };

    window.addEventListener('message', handleMessage);

    // Notificar al padre que el iframe esta listo
    if (window.parent !== window) {
      const targetOrigin = document.referrer
        ? new URL(document.referrer).origin
        : (import.meta.env.VITE_APP_URL || '*');
      window.parent.postMessage({ type: 'GLOBALCMX_WIDGET_READY' }, targetOrigin);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      // Restaurar fetch original
      window.fetch = originalFetchRef.current;
      // Limpiar token de memoria
      widgetTokenRef.current = '';
      trustedOriginRef.current = '';
    };
  }, [patchFetch]);

  if (!widgetName || !WIDGET_REGISTRY[widgetName]) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" fontSize="lg">
          Widget no encontrado: {widgetName || '(vacio)'}
        </Text>
        <Text mt={2} color="gray.500" fontSize="sm">
          Widgets disponibles: {Object.keys(WIDGET_REGISTRY).join(', ')}
        </Text>
      </Box>
    );
  }

  if (state === 'waiting') {
    return (
      <VStack justify="center" align="center" minH="100vh" gap={4}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.500">Esperando autenticacion...</Text>
      </VStack>
    );
  }

  if (state === 'error') {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" fontSize="lg">Error de autenticacion</Text>
        <Text mt={2} color="gray.500">{errorMsg}</Text>
      </Box>
    );
  }

  const WidgetComponent = WIDGET_REGISTRY[widgetName];

  return (
    <Box w="100%" minH="100vh" overflow="auto">
      <WidgetComponent />
    </Box>
  );
}
