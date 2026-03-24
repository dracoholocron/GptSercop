import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { scheduleService } from '../services/scheduleService';
import type { ScheduleStatus } from '../services/scheduleService';

interface ScheduleContextType {
  scheduleStatus: ScheduleStatus | null;
  isBlocked: boolean;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  clearBlockedState: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    // Solo verificar si hay token (usuario autenticado)
    const token = localStorage.getItem('globalcmx_token');
    if (!token) {
      setScheduleStatus(null);
      setIsBlocked(false);
      setIsLoading(false);
      return;
    }

    // Skip schedule check for CLIENT users (they use client portal)
    const userStr = localStorage.getItem('globalcmx_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.roles && user.roles.includes('ROLE_CLIENT')) {
          setScheduleStatus(null);
          setIsBlocked(false);
          return;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const status = await scheduleService.getCurrentStatus();
      setScheduleStatus(status);
      setIsBlocked(!status.isAllowed);
    } catch (err: unknown) {
      // Verificar si es error de horario (403 con SCHEDULE_ACCESS_DENIED)
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as { message: string }).message;
        if (errorMessage.includes('SCHEDULE_ACCESS_DENIED')) {
          setIsBlocked(true);
          setError(errorMessage);
          setIsLoading(false);
          return; // No continuar si es bloqueo de horario
        }
        // Si es error 403 relacionado con autenticación, el apiClient ya debería haber redirigido
        if (errorMessage.includes('403') && !errorMessage.includes('SCHEDULE')) {
          // Error de autenticación, el apiClient debería haber manejado la redirección
          // No bloquear el renderizado, permitir que continúe
          setIsBlocked(false);
          setScheduleStatus(null);
          setIsLoading(false);
          return;
        }
      }
      // Otros errores se ignoran silenciosamente (feature puede no estar habilitada)
      // No bloquear el renderizado si hay errores
      setIsBlocked(false);
      setScheduleStatus(null);
      console.debug('Schedule status check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearBlockedState = useCallback(() => {
    setIsBlocked(false);
    setError(null);
  }, []);

  // Verificar estado al montar y periódicamente
  useEffect(() => {
    refreshStatus();

    // Refrescar cada 5 minutos
    const interval = setInterval(refreshStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Escuchar cambios en localStorage (login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'globalcmx_token') {
        if (e.newValue) {
          // Usuario hizo login
          refreshStatus();
        } else {
          // Usuario hizo logout
          setScheduleStatus(null);
          setIsBlocked(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshStatus]);

  const value: ScheduleContextType = {
    scheduleStatus,
    isBlocked,
    isLoading,
    error,
    refreshStatus,
    clearBlockedState,
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export default ScheduleContext;
