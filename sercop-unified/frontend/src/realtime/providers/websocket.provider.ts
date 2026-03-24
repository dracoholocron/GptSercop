/**
 * AWS WebSocket Provider
 *
 * Real-time notification provider using AWS API Gateway WebSocket.
 * Uses native WebSocket API.
 */
import type {
  RealTimeProviderInterface,
  RealTimeCallbacks,
  RealTimeConnectionState,
  RealTimeInstantMessage,
  RealTimeSystemMessage,
} from '../types';
import type { AlertResponse } from '../../services/alertService';

export class WebSocketProvider implements RealTimeProviderInterface {
  private socket: WebSocket | null = null;
  private connectionState: RealTimeConnectionState = 'disconnected';
  private callbacks: RealTimeCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string;
  private token: string = '';

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WEBSOCKET_URL || '';
  }

  async connect(token: string, callbacks: RealTimeCallbacks): Promise<void> {
    this.token = token;
    this.callbacks = callbacks;
    this.connectionState = 'connecting';

    if (!this.url) {
      console.warn('WebSocket: URL not configured');
      this.connectionState = 'disconnected';
      return;
    }

    try {
      // Connect with token as query parameter
      const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        console.log('WebSocket: Connected');
        callbacks.onConnected?.({ status: 'connected', userId: '' });
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (event) => {
        console.error('WebSocket: Error', event);
        callbacks.onError?.(new Error('WebSocket connection error'));
      };

      this.socket.onclose = (event) => {
        this.connectionState = 'disconnected';
        console.log('WebSocket: Connection closed', event.code, event.reason);

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts && !event.wasClean) {
          this.scheduleReconnect();
        }
      };

    } catch (error) {
      this.connectionState = 'disconnected';
      console.error('WebSocket: Connection failed', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close(1000, 'User disconnect');
      this.socket = null;
    }
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
  }

  getConnectionState(): RealTimeConnectionState {
    return this.connectionState;
  }

  getProviderName(): string {
    return 'WebSocket';
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const { type, data: payload } = message;

      switch (type) {
        case 'connected':
          this.callbacks.onConnected?.(payload);
          break;
        case 'alert':
          console.log('WebSocket: Received alert');
          this.callbacks.onAlert?.(payload as AlertResponse);
          break;
        case 'video_call':
          console.log('WebSocket: Received video call invitation');
          this.callbacks.onVideoCall?.(payload as AlertResponse);
          break;
        case 'message':
          console.log('WebSocket: Received instant message');
          this.callbacks.onMessage?.(payload as RealTimeInstantMessage);
          break;
        case 'system':
          console.log('WebSocket: Received system message');
          this.callbacks.onSystem?.(payload as RealTimeSystemMessage);
          break;
        default:
          console.warn('WebSocket: Unknown message type', type);
      }
    } catch (error) {
      console.error('WebSocket: Error parsing message', error);
    }
  }

  private scheduleReconnect(): void {
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    this.callbacks.onReconnect?.(this.reconnectAttempts);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.token, this.callbacks);
    }, delay);
  }
}

export default WebSocketProvider;
