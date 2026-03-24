/**
 * Azure SignalR Provider
 *
 * Real-time notification provider using Azure SignalR Service.
 * Uses the @microsoft/signalr client library.
 */
import * as signalR from '@microsoft/signalr';
import type {
  RealTimeProviderInterface,
  RealTimeCallbacks,
  RealTimeConnectionState,
  RealTimeConnectedEvent,
  RealTimeInstantMessage,
  RealTimeSystemMessage,
} from '../types';
import type { AlertResponse } from '../../services/alertService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class SignalRProvider implements RealTimeProviderInterface {
  private connection: signalR.HubConnection | null = null;
  private connectionState: RealTimeConnectionState = 'disconnected';
  private callbacks: RealTimeCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(token: string, callbacks: RealTimeCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.connectionState = 'connecting';

    try {
      // First, negotiate to get the SignalR connection info
      const response = await fetch(`${API_BASE_URL}/realtime/negotiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Negotiation failed: ${response.status}`);
      }

      const { url, accessToken } = await response.json();

      // Build the SignalR connection
      // In Serverless mode, the SignalR client negotiates with Azure SignalR
      // using the access token we provide
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(url, {
          accessTokenFactory: () => accessToken,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null; // Stop retrying
            }
            this.connectionState = 'reconnecting';
            this.reconnectAttempts = retryContext.previousRetryCount + 1;
            callbacks.onReconnect?.(this.reconnectAttempts);
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Setup event handlers
      this.setupEventHandlers();

      // Start the connection
      await this.connection.start();
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;

      console.log('SignalR: Connected');
      callbacks.onConnected?.({ status: 'connected', userId: '' });

    } catch (error) {
      this.connectionState = 'disconnected';
      console.error('SignalR: Connection failed', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
  }

  getConnectionState(): RealTimeConnectionState {
    return this.connectionState;
  }

  getProviderName(): string {
    return 'SignalR';
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle reconnection events
    this.connection.onreconnecting(() => {
      this.connectionState = 'reconnecting';
      console.log('SignalR: Reconnecting...');
    });

    this.connection.onreconnected(() => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      console.log('SignalR: Reconnected');
      this.callbacks.onConnected?.({ status: 'connected', userId: '' });
    });

    this.connection.onclose((error) => {
      this.connectionState = 'disconnected';
      console.log('SignalR: Connection closed', error);
      if (error) {
        this.callbacks.onError?.(error);
      }
    });

    // Handle real-time events
    this.connection.on('alert', (alert: AlertResponse) => {
      console.log('SignalR: Received alert', alert.title);
      this.callbacks.onAlert?.(alert);
    });

    this.connection.on('video_call', (alert: AlertResponse) => {
      console.log('SignalR: Received video call invitation');
      this.callbacks.onVideoCall?.(alert);
    });

    this.connection.on('message', (message: RealTimeInstantMessage) => {
      console.log('SignalR: Received instant message from', message.senderName);
      this.callbacks.onMessage?.(message);
    });

    this.connection.on('system', (message: RealTimeSystemMessage) => {
      console.log('SignalR: Received system message');
      this.callbacks.onSystem?.(message);
    });

    this.connection.on('connected', (data: RealTimeConnectedEvent) => {
      console.log('SignalR: Connection confirmed');
      this.callbacks.onConnected?.(data);
    });
  }
}

export default SignalRProvider;
