import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import clientPortalService from '../services/clientPortalService';
import type { AccessibleCompany, AccessibleCompaniesResponse } from '../services/clientPortalTypes';

interface CorporationContextType {
  // Data
  hasMultipleCompanies: boolean;
  accessibleCompanies: AccessibleCompany[];
  selectedCompany: AccessibleCompany | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  selectCompany: (company: AccessibleCompany | null) => void;
  selectCompanyById: (companyId: number) => void;
  clearSelection: () => void;
  refreshCompanies: () => Promise<void>;

  // Helpers
  getSelectedCompanyId: () => number | undefined;
  isViewingAllCompanies: () => boolean;
}

const SELECTED_COMPANY_KEY = 'globalcmx_selected_company';

const CorporationContext = createContext<CorporationContextType | undefined>(undefined);

export const CorporationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();

  const [hasMultipleCompanies, setHasMultipleCompanies] = useState(false);
  const [accessibleCompanies, setAccessibleCompanies] = useState<AccessibleCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<AccessibleCompany | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is a client portal user
  const isClientPortalUser = user?.roles?.includes('ROLE_CLIENT') || false;

  // Load accessible companies when authenticated
  useEffect(() => {
    if (isAuthenticated && isClientPortalUser && user?.participantId) {
      loadAccessibleCompanies();
    } else {
      // Reset state for non-client users
      setHasMultipleCompanies(false);
      setAccessibleCompanies([]);
      setSelectedCompany(null);
    }
  }, [isAuthenticated, isClientPortalUser, user?.participantId]);

  // Restore selected company from localStorage
  useEffect(() => {
    if (accessibleCompanies.length > 0) {
      const savedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
      if (savedCompanyId) {
        const company = accessibleCompanies.find(c => c.id === parseInt(savedCompanyId, 10));
        if (company) {
          setSelectedCompany(company);
        }
      }
    }
  }, [accessibleCompanies]);

  const loadAccessibleCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: AccessibleCompaniesResponse = await clientPortalService.getAccessibleCompanies();

      setHasMultipleCompanies(response.hasMultipleCompanies);
      setAccessibleCompanies(response.companies);

      // If only one company, auto-select it
      if (!response.hasMultipleCompanies && response.companies.length === 1) {
        setSelectedCompany(response.companies[0]);
      }
    } catch (err) {
      console.error('Failed to load accessible companies:', err);
      setError('Failed to load company information');
    } finally {
      setIsLoading(false);
    }
  };

  const selectCompany = useCallback((company: AccessibleCompany | null) => {
    setSelectedCompany(company);
    if (company) {
      localStorage.setItem(SELECTED_COMPANY_KEY, company.id.toString());
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY);
    }
  }, []);

  const selectCompanyById = useCallback((companyId: number) => {
    const company = accessibleCompanies.find(c => c.id === companyId);
    if (company) {
      selectCompany(company);
    }
  }, [accessibleCompanies, selectCompany]);

  const clearSelection = useCallback(() => {
    setSelectedCompany(null);
    localStorage.removeItem(SELECTED_COMPANY_KEY);
  }, []);

  const refreshCompanies = useCallback(async () => {
    await loadAccessibleCompanies();
  }, []);

  const getSelectedCompanyId = useCallback((): number | undefined => {
    return selectedCompany?.id;
  }, [selectedCompany]);

  const isViewingAllCompanies = useCallback((): boolean => {
    return hasMultipleCompanies && selectedCompany === null;
  }, [hasMultipleCompanies, selectedCompany]);

  return (
    <CorporationContext.Provider
      value={{
        hasMultipleCompanies,
        accessibleCompanies,
        selectedCompany,
        isLoading,
        error,
        selectCompany,
        selectCompanyById,
        clearSelection,
        refreshCompanies,
        getSelectedCompanyId,
        isViewingAllCompanies,
      }}
    >
      {children}
    </CorporationContext.Provider>
  );
};

export const useCorporation = () => {
  const context = useContext(CorporationContext);
  if (context === undefined) {
    throw new Error('useCorporation must be used within a CorporationProvider');
  }
  return context;
};

/**
 * Hook for conditionally using corporation context.
 * Returns undefined if not within CorporationProvider (safe for non-client routes).
 */
export const useCorporationOptional = () => {
  return useContext(CorporationContext);
};
