import { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import type {
  AccountingEntry,
  GenerateEntryRequest,
  AccountingConfiguration
} from '../types/accounting';

/**
 * Hook personalizado para gestionar asientos contables
 * Facilita la integración de contabilidad en cualquier producto
 */
export const useAccountingEntry = (product?: string, event?: string) => {
  const [entry, setEntry] = useState<AccountingEntry | null>(null);
  const [configuration, setConfiguration] = useState<AccountingConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera una vista previa del asiento sin guardarlo
   */
  const previewEntry = async (request: GenerateEntryRequest): Promise<AccountingEntry | null> => {
    try {
      setLoading(true);
      setError(null);
      const preview = await accountingService.previewEntry(request);
      setEntry(preview);
      return preview;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error generating preview';
      setError(errorMsg);
      console.error('Error previewing entry:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Genera y guarda el asiento contable
   */
  const generateEntry = async (request: GenerateEntryRequest): Promise<AccountingEntry | null> => {
    try {
      setLoading(true);
      setError(null);
      const generated = await accountingService.generateEntry(request);
      setEntry(generated);
      return generated;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error generating entry';
      setError(errorMsg);
      console.error('Error generating entry:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene la configuración contable para el producto y evento
   */
  const fetchConfiguration = async (prod: string, evt: string) => {
    try {
      setLoading(true);
      setError(null);
      const config = await accountingService.getConfiguration(prod, evt);
      setConfiguration(config);
      return config;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching configuration';
      setError(errorMsg);
      console.error('Error fetching configuration:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene un asiento por referencia
   */
  const fetchByReference = async (reference: string): Promise<AccountingEntry[]> => {
    try {
      setLoading(true);
      setError(null);
      const entries = await accountingService.getEntriesByReference(reference);
      if (entries.length > 0) {
        setEntry(entries[0]);
      }
      return entries;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching entries';
      setError(errorMsg);
      console.error('Error fetching entries:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valida el asiento actual
   */
  const validateCurrentEntry = async () => {
    if (!entry) return null;

    try {
      setLoading(true);
      setError(null);
      return await accountingService.validateEntry(entry);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error validating entry';
      setError(errorMsg);
      console.error('Error validating entry:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Contabiliza el asiento
   */
  const postEntry = async (id: string): Promise<AccountingEntry | null> => {
    try {
      setLoading(true);
      setError(null);
      const posted = await accountingService.postEntry(id);
      setEntry(posted);
      return posted;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error posting entry';
      setError(errorMsg);
      console.error('Error posting entry:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cargar configuración automáticamente si se provee producto y evento
  useEffect(() => {
    if (product && event) {
      fetchConfiguration(product, event);
    }
  }, [product, event]);

  return {
    entry,
    configuration,
    loading,
    error,
    previewEntry,
    generateEntry,
    fetchConfiguration,
    fetchByReference,
    validateCurrentEntry,
    postEntry,
    clearEntry: () => setEntry(null),
    clearError: () => setError(null),
  };
};

export default useAccountingEntry;
