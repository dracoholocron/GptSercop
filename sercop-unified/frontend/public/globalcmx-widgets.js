/**
 * GlobalCMX Widget SDK
 * Permite a sitios externos embeber widgets de GlobalCMX via iframe seguro.
 *
 * Uso:
 *   <script src="https://mi-globalcmx.com/globalcmx-widgets.js"></script>
 *   <script>
 *     GlobalCMX.init({ appUrl: 'https://mi-globalcmx.com', token: widgetToken });
 *     GlobalCMX.embed('business-dashboard', '#container', { height: '800px' });
 *   </script>
 */
(function (root) {
  'use strict';

  var _config = {
    appUrl: '',
    token: '',
    user: null
  };

  var _iframes = [];
  var _listeners = [];

  /**
   * Inicializar el SDK con la URL de la app y el widget token.
   * @param {Object} options
   * @param {string} options.appUrl - URL base de GlobalCMX (ej: https://mi-globalcmx.com)
   * @param {string} options.token - Widget token JWT obtenido de POST /auth/widget-token
   * @param {Object} [options.user] - Datos opcionales del usuario para el contexto del widget
   */
  function init(options) {
    if (!options || !options.appUrl) {
      console.error('[GlobalCMX] appUrl es requerido en init()');
      return;
    }
    if (!options.token) {
      console.error('[GlobalCMX] token es requerido en init()');
      return;
    }

    _config.appUrl = options.appUrl.replace(/\/+$/, ''); // quitar trailing slash
    _config.token = options.token;
    _config.user = options.user || null;
  }

  /**
   * Embeber un widget en un contenedor del DOM.
   * @param {string} widgetName - Nombre del widget (ej: 'business-dashboard')
   * @param {string|HTMLElement} container - Selector CSS o elemento DOM
   * @param {Object} [options]
   * @param {string} [options.height='600px'] - Altura del iframe
   * @param {string} [options.width='100%'] - Ancho del iframe
   * @param {Function} [options.onReady] - Callback cuando el widget esta listo
   * @param {Function} [options.onError] - Callback en caso de error
   */
  function embed(widgetName, container, options) {
    if (!_config.appUrl || !_config.token) {
      console.error('[GlobalCMX] Debe llamar GlobalCMX.init() antes de embed()');
      return;
    }

    options = options || {};
    var height = options.height || '600px';
    var width = options.width || '100%';

    // Resolver contenedor
    var el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) {
      console.error('[GlobalCMX] Contenedor no encontrado:', container);
      return;
    }

    // Crear iframe
    var iframe = document.createElement('iframe');
    iframe.src = _config.appUrl + '/embed/' + encodeURIComponent(widgetName);
    iframe.style.width = width;
    iframe.style.height = height;
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    iframe.setAttribute('title', 'GlobalCMX Widget: ' + widgetName);

    // Listener para recibir mensajes del iframe
    var origin = _config.appUrl;
    var token = _config.token;
    var user = _config.user;

    var messageHandler = function (event) {
      // Validar origin
      if (event.origin !== origin) return;

      if (event.data && event.data.type === 'GLOBALCMX_WIDGET_READY') {
        // El iframe esta listo, enviar token
        iframe.contentWindow.postMessage({
          type: 'GLOBALCMX_AUTH',
          token: token,
          user: user
        }, origin);
      }

      if (event.data && event.data.type === 'GLOBALCMX_AUTH_ACK') {
        if (options.onReady) {
          options.onReady(widgetName);
        }
      }
    };

    window.addEventListener('message', messageHandler);
    _listeners.push(messageHandler);

    // Error handler
    iframe.onerror = function () {
      if (options.onError) {
        options.onError(new Error('Error cargando widget: ' + widgetName));
      }
    };

    el.innerHTML = '';
    el.appendChild(iframe);
    _iframes.push(iframe);

    return iframe;
  }

  /**
   * Destruir todos los iframes y limpiar listeners.
   */
  function destroy() {
    _iframes.forEach(function (iframe) {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    });
    _iframes = [];

    _listeners.forEach(function (handler) {
      window.removeEventListener('message', handler);
    });
    _listeners = [];

    _config.token = '';
    _config.user = null;
  }

  // API publica
  root.GlobalCMX = {
    init: init,
    embed: embed,
    destroy: destroy
  };

})(typeof window !== 'undefined' ? window : this);
