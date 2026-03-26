import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { BrandTemplate } from '../services/brandTemplateService';
import { brandTemplateService } from '../services/brandTemplateService';
import { TOKEN_STORAGE_KEY } from '../config/api.config';

interface BrandContextType {
  brand: BrandTemplate | null;
  isLoading: boolean;
  error: string | null;
  refreshBrand: () => Promise<void>;
}

// Default brand configuration (used when no active brand or loading)
const DEFAULT_BRAND = {
  code: 'COMPRAS_PUBLICAS_DEFAULT',
  name: 'Compras Publicas',
  companyName: 'Compras Publicas',
  companyShortName: 'SERCOP',
  primaryColor: '#0073E6',
  secondaryColor: '#FFB800',
  accentColor: '#2DD4BF',
  sidebarBgColor: '#1A202C',
  headerBgColor: '#FFFFFF',
  fontFamily: 'Inter',
  fontUrl: '',
  contentBgColor: '#F7FAFC',
  contentBgColorDark: '#2D3748',
  cardBgColor: '#FFFFFF',
  cardBgColorDark: '#2D3748',
  borderColor: '#E2E8F0',
  borderColorDark: '#4A5568',
  textColor: '#1A202C',
  textColorDark: '#F7FAFC',
  textColorSecondary: '#718096',
  textColorSecondaryDark: '#A0AEC0',
  darkModeEnabled: true,
};

const defaultContext: BrandContextType = {
  brand: null,
  isLoading: false,
  error: null,
  refreshBrand: async () => {},
};

const BrandContext = createContext<BrandContextType>(defaultContext);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brand, setBrand] = useState<BrandTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveBrand = useCallback(async () => {
    // Only fetch brand if user is authenticated
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      // Apply defaults silently if not authenticated
      applyBrandStyles(DEFAULT_BRAND as any);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const activeBrand = await brandTemplateService.getActive();
      setBrand(activeBrand);

      if (activeBrand) {
        applyBrandStyles(activeBrand);
      } else {
        applyBrandStyles(DEFAULT_BRAND as any);
      }
    } catch (err) {
      console.warn('Brand templates not available yet:', err);
      // Don't set error state - just use defaults silently
      applyBrandStyles(DEFAULT_BRAND as any);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshBrand = useCallback(async () => {
    await fetchActiveBrand();
  }, [fetchActiveBrand]);

  useEffect(() => {
    // Delay initial fetch to avoid blocking app startup
    const timer = setTimeout(() => {
      fetchActiveBrand();
    }, 100);

    // Listen for storage events to detect login/logout (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_STORAGE_KEY) {
        fetchActiveBrand();
      }
    };

    // Listen for auth:login event (same tab)
    const handleAuthLogin = () => {
      fetchActiveBrand();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:login', handleAuthLogin);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:login', handleAuthLogin);
    };
  }, [fetchActiveBrand]);

  return (
    <BrandContext.Provider value={{ brand, isLoading, error, refreshBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

function loadGoogleFont(fontFamily?: string, fontUrl?: string) {
  const linkId = 'brand-google-font';
  let link = document.getElementById(linkId) as HTMLLinkElement | null;

  if (fontUrl) {
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = fontUrl;
  } else if (fontFamily && fontFamily !== 'Inter' && fontFamily !== 'system-ui') {
    const encoded = fontFamily.replace(/ /g, '+');
    const url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = url;
  } else if (link) {
    link.remove();
  }
}

function applyBrandStyles(brand: Partial<BrandTemplate>) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', brand.primaryColor || DEFAULT_BRAND.primaryColor);
  root.style.setProperty('--brand-secondary', brand.secondaryColor || DEFAULT_BRAND.secondaryColor);
  root.style.setProperty('--brand-accent', brand.accentColor || DEFAULT_BRAND.accentColor);
  root.style.setProperty('--brand-sidebar-bg', brand.sidebarBgColor || DEFAULT_BRAND.sidebarBgColor);
  root.style.setProperty('--brand-header-bg', brand.headerBgColor || DEFAULT_BRAND.headerBgColor);

  // New CSS variables for extended branding
  const fontFamily = brand.fontFamily || DEFAULT_BRAND.fontFamily;
  root.style.setProperty('--brand-font-family', `'${fontFamily}', Inter, system-ui, sans-serif`);
  root.style.setProperty('--brand-content-bg', brand.contentBgColor || DEFAULT_BRAND.contentBgColor);
  root.style.setProperty('--brand-content-bg-dark', brand.contentBgColorDark || DEFAULT_BRAND.contentBgColorDark);
  root.style.setProperty('--brand-card-bg', brand.cardBgColor || DEFAULT_BRAND.cardBgColor);
  root.style.setProperty('--brand-card-bg-dark', brand.cardBgColorDark || DEFAULT_BRAND.cardBgColorDark);
  root.style.setProperty('--brand-border', brand.borderColor || DEFAULT_BRAND.borderColor);
  root.style.setProperty('--brand-border-dark', brand.borderColorDark || DEFAULT_BRAND.borderColorDark);
  root.style.setProperty('--brand-text', brand.textColor || DEFAULT_BRAND.textColor);
  root.style.setProperty('--brand-text-dark', brand.textColorDark || DEFAULT_BRAND.textColorDark);
  root.style.setProperty('--brand-text-secondary', brand.textColorSecondary || DEFAULT_BRAND.textColorSecondary);
  root.style.setProperty('--brand-text-secondary-dark', brand.textColorSecondaryDark || DEFAULT_BRAND.textColorSecondaryDark);

  // Load Google Font
  loadGoogleFont(brand.fontFamily, brand.fontUrl);

  // Apply font to body
  document.body.style.fontFamily = `'${fontFamily}', Inter, system-ui, sans-serif`;

  // Update page title and favicon
  document.title = brand.companyName || DEFAULT_BRAND.companyName;
  if (brand.faviconUrl) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = brand.faviconUrl;
  }
}

export const useBrand = () => {
  return useContext(BrandContext);
};

export const useBrandColors = () => {
  const { brand } = useBrand();
  return {
    primary: brand?.primaryColor || DEFAULT_BRAND.primaryColor,
    secondary: brand?.secondaryColor || DEFAULT_BRAND.secondaryColor,
    accent: brand?.accentColor || DEFAULT_BRAND.accentColor,
    sidebarBg: brand?.sidebarBgColor || DEFAULT_BRAND.sidebarBgColor,
    headerBg: brand?.headerBgColor || DEFAULT_BRAND.headerBgColor,
  };
};

export const useBrandCompany = () => {
  const { brand } = useBrand();
  return {
    name: brand?.companyName || DEFAULT_BRAND.companyName,
    shortName: brand?.companyShortName || DEFAULT_BRAND.companyShortName,
    logoUrl: brand?.logoUrl || null,
    logoSmallUrl: brand?.logoSmallUrl || null,
  };
};

export { DEFAULT_BRAND };
