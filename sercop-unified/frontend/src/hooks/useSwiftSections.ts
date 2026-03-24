import { useState, useEffect } from 'react';
import { swiftSectionConfigService } from '../services/swiftSectionConfigService';
import type { SwiftSectionConfig } from '../services/swiftSectionConfigService';

/**
 * Hook para cargar y gestionar secciones SWIFT de un mensaje
 *
 * @param messageType - Tipo de mensaje SWIFT (ej: 'MT700', 'MT760')
 * @returns Secciones, estado de carga y errores
 */
export const useSwiftSections = (messageType: string) => {
  const [sections, setSections] = useState<SwiftSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSections = async () => {
      if (!messageType) {
        setSections([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const loadedSections = await swiftSectionConfigService.getSectionsByMessageType(messageType);
        setSections(loadedSections);
      } catch (err) {
        console.error('Error cargando secciones SWIFT:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [messageType]);

  return {
    sections,
    loading,
    error,
  };
};

export default useSwiftSections;
