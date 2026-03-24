/**
 * Real-Time Notification System Types
 *
 * Shared types for the real-time notification system.
 * Supports multiple providers: SignalR (Azure), WebSocket (AWS), Pub/Sub (GCP).
 */
import type { AlertResponse } from '../services/alertService';

/**
 * Supported real-time providers.
 */
export type RealTimeProvider = 'signalr' | 'websocket' | 'pubsub' | 'none';

/**
 * Connection states for real-time providers.
 */
export type RealTimeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Event types received from the server.
 */
export type RealTimeEventType = 'connected' | 'alert' | 'video_call' | 'message' | 'system';

/**
 * Connected event data.
 */
export interface RealTimeConnectedEvent {
  status: 'connected';
  userId: string;
}

/**
 * Instant message from another user.
 */
export interface RealTimeInstantMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

/**
 * System message broadcast to all users.
 */
export interface RealTimeSystemMessage {
  message: string;
  level: 'info' | 'warning' | 'error';
  timestamp: number;
}

/**
 * Callbacks for real-time events.
 */
export interface RealTimeCallbacks {
  onConnected?: (data: RealTimeConnectedEvent) => void;
  onAlert?: (alert: AlertResponse) => void;
  onVideoCall?: (alert: AlertResponse) => void;
  onMessage?: (message: RealTimeInstantMessage) => void;
  onSystem?: (message: RealTimeSystemMessage) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
}

/**
 * Configuration for real-time providers.
 */
export interface RealTimeConfig {
  enabled: boolean;
  provider: RealTimeProvider;
  signalrUrl?: string;
  websocketUrl?: string;
  pubsubEndpoint?: string;
}

/**
 * Interface for real-time provider implementations.
 */
export interface RealTimeProviderInterface {
  connect(token: string, callbacks: RealTimeCallbacks): Promise<void>;
  disconnect(): void;
  getConnectionState(): RealTimeConnectionState;
  getProviderName(): string;
}

/**
 * Get real-time configuration from environment variables.
 */
export function getRealTimeConfig(): RealTimeConfig {
  const enabled = import.meta.env.VITE_REALTIME_ENABLED === 'true';
  const provider = (import.meta.env.VITE_REALTIME_PROVIDER || 'none') as RealTimeProvider;

  return {
    enabled,
    provider,
    signalrUrl: import.meta.env.VITE_SIGNALR_URL,
    websocketUrl: import.meta.env.VITE_WEBSOCKET_URL,
    pubsubEndpoint: import.meta.env.VITE_PUBSUB_ENDPOINT,
  };
}
