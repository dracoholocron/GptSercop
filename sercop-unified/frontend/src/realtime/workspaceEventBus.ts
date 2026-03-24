/**
 * Workspace Event Bus
 * Local pub/sub for dispatching PAA workspace real-time events
 * to subscribed components without coupling to the notification system.
 */
import type { PAAWorkspaceEvent } from '../services/cpWorkspaceService';

type WorkspaceEventHandler = (event: PAAWorkspaceEvent) => void;

interface Subscription {
  workspaceId: number;
  handler: WorkspaceEventHandler;
}

const subscribers: Subscription[] = [];

/** Subscribe to workspace events for a specific workspace ID. Returns an unsubscribe function. */
export function subscribeToWorkspace(workspaceId: number, handler: WorkspaceEventHandler): () => void {
  const subscription: Subscription = { workspaceId, handler };
  subscribers.push(subscription);

  return () => {
    const idx = subscribers.indexOf(subscription);
    if (idx !== -1) {
      subscribers.splice(idx, 1);
    }
  };
}

/** Dispatch a workspace event to all matching subscribers. */
export function dispatchWorkspaceEvent(event: PAAWorkspaceEvent): void {
  for (const sub of subscribers) {
    if (sub.workspaceId === event.workspaceId) {
      try {
        sub.handler(event);
      } catch (err) {
        console.error('Error in workspace event handler:', err);
      }
    }
  }
}
