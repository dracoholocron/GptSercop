import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { systemConfigService, type SystemConfig } from '../services/systemConfigService';
import { TOKEN_STORAGE_KEY } from '../config/api.config';

interface SystemConfigContextType {
  // Configuración del sistema
  config: SystemConfig;
  isLoading: boolean;
  error: string | null;

  // Helpers para moneda local
  localCurrency: string;
  isLocalCurrency: (currencyCode: string) => boolean;
  requiresExchangeRate: (currencyCode: string) => boolean;

  // Acciones
  refreshConfig: () => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const SystemConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<SystemConfig>(systemConfigService.getDefaultConfig());
  // Start with isLoading: false so children render immediately with default config
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración al montar - en background sin bloquear
  // Solo cargar si hay un token de autenticación para evitar loops de redirect
  useEffect(() => {
    // Use a flag to prevent state updates after unmount
    let isMounted = true;

    const loadConfigBackground = async () => {
      // Verificar si hay token antes de hacer la llamada API
      // para evitar el redirect infinito a /login
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        // Sin token, usar configuración por defecto
        return;
      }

      try {
        setIsLoading(true);
        const loadedConfig = await systemConfigService.getConfig();
        if (isMounted) {
          setConfig(loadedConfig);
          setError(null);
        }
      } catch (err) {
        // Log but don't block - just use default config
        console.warn('SystemConfigProvider: Failed to load system config, using defaults:', err);
        if (isMounted) {
          setError('Using default configuration');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConfigBackground();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedConfig = await systemConfigService.getConfig();
      setConfig(loadedConfig);
    } catch (err) {
      console.warn('Failed to load system config, keeping current:', err);
      setError('Failed to refresh configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConfig = useCallback(async () => {
    systemConfigService.clearCache();
    await loadConfig();
  }, []);

  // Helper: Verifica si una moneda es la moneda local
  const isLocalCurrency = useCallback((currencyCode: string): boolean => {
    if (!currencyCode) return false;
    return currencyCode.toUpperCase() === config.localCurrency.toUpperCase();
  }, [config.localCurrency]);

  // Helper: Verifica si una moneda requiere cotización
  const requiresExchangeRate = useCallback((currencyCode: string): boolean => {
    if (!currencyCode) return false;
    return !isLocalCurrency(currencyCode);
  }, [isLocalCurrency]);

  return (
    <SystemConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        localCurrency: config.localCurrency,
        isLocalCurrency,
        requiresExchangeRate,
        refreshConfig,
      }}
    >
      {children}
    </SystemConfigContext.Provider>
  );
};

/**
 * Hook para acceder a la configuración del sistema.
 * Debe usarse dentro de SystemConfigProvider.
 */
export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};

/**
 * Hook opcional para usar en componentes que pueden estar fuera del provider.
 * Retorna undefined si no está dentro del SystemConfigProvider.
 */
export const useSystemConfigOptional = () => {
  return useContext(SystemConfigContext);
};

export default SystemConfigContext;
