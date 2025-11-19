/**
 * Notification payload structure shared across all notification providers
 */
export type NotificationPayload = {
  title: string;
  body: string;
  summary: string;
  changesCount: {
    added: number;
    updated: number;
    deleted: number;
    total: number;
  };
  timestamp: string;
  success: boolean;
  error?: string;
};

/**
 * Common interface that all notification providers must implement
 */
export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
}
