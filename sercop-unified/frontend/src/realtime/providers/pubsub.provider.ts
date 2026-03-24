/**
 * GCP Pub/Sub Provider
 *
 * Real-time notification provider using GCP Pub/Sub with push delivery.
 *
 * Note: GCP Pub/Sub uses a push model where the server pushes messages to
 * the client via a Cloud Run/Functions endpoint. This provider uses SSE
 * or long-polling to receive messages from that endpoint.
 *
 * For simplicity, this implementation uses polling. In production, consider
 * using a dedicated push endpoint that maintains WebSocket connections.
 */
import type {
  RealTimeProviderInterface,
  RealTimeCallbacks,
  RealTimeConnectionState,
  RealTimeInstantMessage,
  RealTimeSystemMessage,
} from '../types';
import type { AlertResponse } from '../../services/alertService';

export class PubSubProvider implements RealTimeProviderInterface {
  private connectionState: RealTimeConnectionState = 'disconnected';
  private callbacks: RealTimeCallbacks = {};
  private pollInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private endpoint: string;
  private token: string = '';

  constructor(endpoint?: string) {
    this.endpoint = endpoint || import.meta.env.VITE_PUBSUB_ENDPOINT || '';
  }

  async connect(token: string, callbacks: RealTimeCallbacks): Promise<void> {
    this.token = token;
    this.callbacks = callbacks;
    this.connectionState = 'connecting';

    if (!this.endpoint) {
      console.warn('PubSub: Endpoint not configured');
      this.connectionState = 'disconnected';
      return;
    }

    try {
      // Register with the push endpoint
      const response = await fetch(`${this.endpoint}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Subscription failed: ${response.status}`);
      }

      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      console.log('PubSub: Connected');
      callbacks.onConnected?.({ status: 'connected', userId: '' });

      // Start polling for messages
      this.startPolling();

    } catch (error) {
      this.connectionState = 'disconnected';
      console.error('PubSub: Connection failed', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;

    // Unsubscribe from the push endpoint
    if (this.endpoint && this.token) {
      fetch(`${this.endpoint}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore errors during disconnect
      });
    }
  }

  getConnectionState(): RealTimeConnectionState {
    return this.connectionState;
  }

  getProviderName(): string {
    return 'PubSub';
  }

  private startPolling(): void {
    // Poll every 5 seconds for new messages
    this.pollInterval = setInterval(() => {
      this.pollMessages();
    }, 5000);
  }

  private async pollMessages(): Promise<void> {
    if (!this.endpoint || !this.token) return;

    try {
      const response = await fetch(`${this.endpoint}/messages`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.disconnect();
          this.callbacks.onError?.(new Error('Authentication expired'));
        }
        return;
      }

      const messages = await response.json();
      for (const message of messages) {
        this.handleMessage(message);
      }

    } catch (error) {
      console.error('PubSub: Poll error', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.disconnect();
        this.callbacks.onError?.(new Error('Max reconnection attempts reached'));
      } else {
        this.connectionState = 'reconnecting';
        this.callbacks.onReconnect?.(this.reconnectAttempts);
      }
    }
  }

  private handleMessage(message: { eventType: string; data: unknown }): void {
    const { eventType, data } = message;

    switch (eventType) {
      case 'alert':
        console.log('PubSub: Received alert');
        this.callbacks.onAlert?.(data as AlertResponse);
        break;
      case 'video_call':
        console.log('PubSub: Received video call invitation');
        this.callbacks.onVideoCall?.(data as AlertResponse);
        break;
      case 'message':
        console.log('PubSub: Received instant message');
        this.callbacks.onMessage?.(data as RealTimeInstantMessage);
        break;
      case 'system':
        console.log('PubSub: Received system message');
        this.callbacks.onSystem?.(data as RealTimeSystemMessage);
        break;
      default:
        console.warn('PubSub: Unknown message type', eventType);
    }
  }
}

export default PubSubProvider;
