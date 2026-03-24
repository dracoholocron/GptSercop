/**
 * useRealTimeNotifications Hook
 *
 * Unified hook for real-time notifications.
 * Automatically selects the appropriate provider based on configuration.
 *
 * Supported providers:
 * - SignalR (Azure)
 * - WebSocket (AWS)
 * - Pub/Sub (GCP)
 * - None (disabled)
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getRealTimeConfig,
  type RealTimeCallbacks,
  type RealTimeConnectionState,
  type RealTimeProviderInterface,
  type RealTimeInstantMessage,
  type RealTimeSystemMessage,
} from './types';
import { SignalRProvider } from './providers/signalr.provider';
import { WebSocketProvider } from './providers/websocket.provider';
import { PubSubProvider } from './providers/pubsub.provider';
import type { AlertResponse } from '../services/alertService';

// Re-export types for convenience
export type {
  RealTimeConnectionState,
  RealTimeInstantMessage,
  RealTimeSystemMessage,
};

/**
 * Callback types for the hook.
 */
export interface UseRealTimeNotificationsCallbacks {
  onConnected?: () => void;
  onAlert?: (alert: AlertResponse) => void;
  onVideoCall?: (alert: AlertResponse) => void;
  onMessage?: (message: RealTimeInstantMessage) => void;
  onSystem?: (message: RealTimeSystemMessage) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
}

/**
 * Return type for the hook.
 */
export interface UseRealTimeNotificationsResult {
  connectionState: RealTimeConnectionState;
  isConnected: boolean;
  isEnabled: boolean;
  provider: string;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Create a provider instance based on configuration.
 */
function createProvider(): RealTimeProviderInterface | null {
  const config = getRealTimeConfig();

  if (!config.enabled) {
    console.log('RealTime: Notifications disabled');
    return null;
  }

  switch (config.provider) {
    case 'signalr':
      console.log('RealTime: Using SignalR provider');
      return new SignalRProvider();
    case 'websocket':
      console.log('RealTime: Using WebSocket provider');
      return new WebSocketProvider(config.websocketUrl);
    case 'pubsub':
      console.log('RealTime: Using Pub/Sub provider');
      return new PubSubProvider(config.pubsubEndpoint);
    case 'none':
    default:
      console.log('RealTime: Provider set to none');
      return null;
  }
}

/**
 * Hook for real-time notifications.
 */
export function useRealTimeNotifications(
  callbacks: UseRealTimeNotificationsCallbacks = {}
): UseRealTimeNotificationsResult {
  const { isAuthenticated, token } = useAuth();
  const providerRef = useRef<RealTimeProviderInterface | null>(null);
  const [connectionState, setConnectionState] = useState<RealTimeConnectionState>('disconnected');
  const [providerName, setProviderName] = useState<string>('none');

  const config = getRealTimeConfig();
  const isEnabled = config.enabled && config.provider !== 'none';

  // Create internal callbacks that update state and call user callbacks
  const internalCallbacks: RealTimeCallbacks = {
    onConnected: (data) => {
      setConnectionState('connected');
      callbacks.onConnected?.();
    },
    onAlert: (alert) => {
      callbacks.onAlert?.(alert);
    },
    onVideoCall: (alert) => {
      callbacks.onVideoCall?.(alert);
    },
    onMessage: (message) => {
      callbacks.onMessage?.(message);
    },
    onSystem: (message) => {
      callbacks.onSystem?.(message);
    },
    onError: (error) => {
      setConnectionState('disconnected');
      callbacks.onError?.(error);
    },
    onReconnect: (attempt) => {
      setConnectionState('reconnecting');
      callbacks.onReconnect?.(attempt);
    },
  };

  // Connect to the provider
  const connect = useCallback(() => {
    if (!isEnabled || !token) {
      return;
    }

    // Create provider if not exists
    if (!providerRef.current) {
      providerRef.current = createProvider();
      if (providerRef.current) {
        setProviderName(providerRef.current.getProviderName());
      }
    }

    if (providerRef.current) {
      setConnectionState('connecting');
      providerRef.current.connect(token, internalCallbacks);
    }
  }, [isEnabled, token]);

  // Disconnect from the provider
  const disconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.disconnect();
      setConnectionState('disconnected');
    }
  }, []);

  // Reconnect (disconnect then connect)
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && isEnabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
      providerRef.current = null;
    };
  }, [isAuthenticated, isEnabled]);

  // Update connection state from provider
  useEffect(() => {
    const interval = setInterval(() => {
      if (providerRef.current) {
        const state = providerRef.current.getConnectionState();
        if (state !== connectionState) {
          setConnectionState(state);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionState]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isEnabled,
    provider: providerName,
    connect,
    disconnect,
    reconnect,
  };
}

export default useRealTimeNotifications;
