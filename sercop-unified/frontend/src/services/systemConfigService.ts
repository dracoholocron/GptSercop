import { catalogoPersonalizadoService, type CatalogoPersonalizado } from './customCatalogService';

/**
 * Códigos de parámetros del sistema (almacenados en catálogo SYSTEM_CONFIG)
 */
export const SYSTEM_PARAM_CODES = {
  LOCAL_CURRENCY: 'LOCAL_CURRENCY',       // Código de moneda local (ej: USD, EUR, MXN)
  COUNTRY_CODE: 'COUNTRY_CODE',           // Código de país ISO (ej: EC, MX, US)
  TIMEZONE: 'TIMEZONE',                   // Zona horaria (ej: America/Guayaquil)
  DATE_FORMAT: 'DATE_FORMAT',             // Formato de fecha (ej: DD/MM/YYYY)
  CURRENCY_DECIMALS: 'CURRENCY_DECIMALS', // Decimales para montos (ej: 2)
} as const;

/**
 * Catálogo padre para configuración del sistema
 */
export const SYSTEM_CONFIG_CATALOG = 'SYSTEM_CONFIG';

/**
 * Configuración del sistema - parámetros globales
 */
export interface SystemConfig {
  // Moneda local/nacional del país donde está instalado el sistema
  localCurrency: string;
  localCurrencyName: string;

  // País de instalación
  countryCode: string;
  countryName: string;

  // Zona horaria
  timezone: string;

  // Formato de fechas
  dateFormat: string;

  // Decimales para montos
  currencyDecimals: number;
}

// Configuración por defecto (fallback)
const DEFAULT_CONFIG: SystemConfig = {
  localCurrency: 'USD',
  localCurrencyName: 'US Dollar',
  countryCode: 'US',
  countryName: 'United States',
  timezone: 'America/New_York',
  dateFormat: 'YYYY-MM-DD',
  currencyDecimals: 2,
};

class SystemConfigService {
  private cachedConfig: SystemConfig | null = null;
  private cachedParams: Map<string, CatalogoPersonalizado> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Carga los parámetros del sistema desde el catálogo SYSTEM_CONFIG
   */
  private async loadSystemParams(): Promise<Map<string, CatalogoPersonalizado>> {
    try {
      const params = await catalogoPersonalizadoService.getCatalogosByCodigoPadre(SYSTEM_CONFIG_CATALOG);
      const paramMap = new Map<string, CatalogoPersonalizado>();

      params.forEach(param => {
        if (param.activo) {
          paramMap.set(param.codigo, param);
        }
      });

      return paramMap;
    } catch (error) {
      console.warn('[SystemConfig] Error loading system params from catalog:', error);
      return new Map();
    }
  }

  /**
   * Obtiene la configuración del sistema desde catálogos personalizados.
   * Usa caché para evitar llamadas repetidas.
   */
  async getConfig(): Promise<SystemConfig> {
    // Retornar caché si es válido
    if (this.cachedConfig && Date.now() - this.cacheTimestamp < this.CACHE_DURATION_MS) {
      return this.cachedConfig;
    }

    try {
      this.cachedParams = await this.loadSystemParams();

      const getParamValue = (code: string, defaultValue: string): string => {
        const param = this.cachedParams.get(code);
        // El nombre del registro contiene el valor del parámetro
        return param?.nombre || defaultValue;
      };

      const getParamDescription = (code: string, defaultValue: string): string => {
        const param = this.cachedParams.get(code);
        return param?.descripcion || defaultValue;
      };

      this.cachedConfig = {
        localCurrency: getParamValue(SYSTEM_PARAM_CODES.LOCAL_CURRENCY, DEFAULT_CONFIG.localCurrency),
        localCurrencyName: getParamDescription(SYSTEM_PARAM_CODES.LOCAL_CURRENCY, DEFAULT_CONFIG.localCurrencyName),
        countryCode: getParamValue(SYSTEM_PARAM_CODES.COUNTRY_CODE, DEFAULT_CONFIG.countryCode),
        countryName: getParamDescription(SYSTEM_PARAM_CODES.COUNTRY_CODE, DEFAULT_CONFIG.countryName),
        timezone: getParamValue(SYSTEM_PARAM_CODES.TIMEZONE, DEFAULT_CONFIG.timezone),
        dateFormat: getParamValue(SYSTEM_PARAM_CODES.DATE_FORMAT, DEFAULT_CONFIG.dateFormat),
        currencyDecimals: parseInt(
          getParamValue(SYSTEM_PARAM_CODES.CURRENCY_DECIMALS, String(DEFAULT_CONFIG.currencyDecimals)),
          10
        ),
      };

      this.cacheTimestamp = Date.now();
      return this.cachedConfig;
    } catch (error) {
      console.warn('[SystemConfig] Error fetching config, using defaults:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Obtiene solo la moneda local
   */
  async getLocalCurrency(): Promise<string> {
    const config = await this.getConfig();
    return config.localCurrency;
  }

  /**
   * Verifica si una moneda es la moneda local
   */
  async isLocalCurrency(currencyCode: string): Promise<boolean> {
    const localCurrency = await this.getLocalCurrency();
    return currencyCode.toUpperCase() === localCurrency.toUpperCase();
  }

  /**
   * Verifica si una moneda es diferente a la moneda local (requiere cotización)
   */
  async requiresExchangeRate(currencyCode: string): Promise<boolean> {
    return !(await this.isLocalCurrency(currencyCode));
  }

  /**
   * Limpia la caché para forzar recarga
   */
  clearCache(): void {
    this.cachedConfig = null;
    this.cachedParams.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Obtiene la configuración por defecto (sin llamada al servidor)
   */
  getDefaultConfig(): SystemConfig {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Obtiene la moneda local de forma síncrona (usa caché o default)
   * Útil para renderizado inicial antes de que la caché esté disponible
   */
  getLocalCurrencySync(): string {
    return this.cachedConfig?.localCurrency || DEFAULT_CONFIG.localCurrency;
  }
}

export const systemConfigService = new SystemConfigService();
export default systemConfigService;
