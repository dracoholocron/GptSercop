/**
 * Real-Time Notification System
 *
 * Exports the main hook and types for real-time notifications.
 */
export { useRealTimeNotifications } from './useRealTimeNotifications';
export type {
  UseRealTimeNotificationsCallbacks,
  UseRealTimeNotificationsResult,
  RealTimeConnectionState,
  RealTimeInstantMessage,
  RealTimeSystemMessage,
} from './useRealTimeNotifications';

export {
  getRealTimeConfig,
  type RealTimeProvider,
  type RealTimeConfig,
  type RealTimeCallbacks,
} from './types';
