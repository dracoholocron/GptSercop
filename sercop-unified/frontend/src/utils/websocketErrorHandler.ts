/**
 * Utilidad para silenciar errores de WebSocket de Vite HMR
 * Estos errores son normales en desarrollo y no afectan la funcionalidad
 */

if (import.meta.env.DEV) {
  // Interceptar errores de console.error
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(arg => String(arg)).join(' ');
    
    // Filtrar errores de WebSocket de Vite HMR
    if (
      message.includes('WebSocket') ||
      message.includes('failed to connect to websocket') ||
      message.includes('WebSocket closed without opened') ||
      fullMessage.includes('WebSocket') ||
      fullMessage.includes('websocket')
    ) {
      // Silenciar estos errores en desarrollo - son normales de Vite HMR
      return;
    }
    
    // Mostrar otros errores normalmente
    originalError.apply(console, args);
  };

  // Interceptar console.debug también
  const originalDebug = console.debug;
  console.debug = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(arg => String(arg)).join(' ');
    
    // Filtrar errores de WebSocket de Vite HMR
    if (
      message.includes('WebSocket') ||
      message.includes('failed to connect to websocket') ||
      message.includes('WebSocket closed without opened') ||
      fullMessage.includes('WebSocket') ||
      fullMessage.includes('websocket')
    ) {
      return;
    }
    
    originalDebug.apply(console, args);
  };

  // Interceptar eventos de error no capturados
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.includes('WebSocket') ||
      message.includes('websocket') ||
      message.includes('failed to connect') ||
      message.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Interceptar promesas rechazadas relacionadas con WebSocket
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || '';
    const message = event.reason?.message || '';
    if (
      reason.includes('WebSocket') ||
      reason.includes('websocket') ||
      reason.includes('WebSocket closed without opened') ||
      reason.includes('failed to connect') ||
      message.includes('WebSocket') ||
      message.includes('websocket')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
}

