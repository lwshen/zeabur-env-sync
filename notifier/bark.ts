import type { NotificationPayload, NotificationProvider } from "./types";

interface BarkConfig {
  key: string;
  serverUrl: string;
  sound?: string;
  group?: string;
}

/**
 * Get Bark configuration from environment variables
 */
function getBarkConfig(): BarkConfig | null {
  const BARK_KEY = Bun.env.BARK_KEY;

  if (!BARK_KEY) {
    return null;
  }

  const BARK_SERVER_URL = Bun.env.BARK_SERVER_URL || "https://api.day.app";
  const BARK_SOUND = Bun.env.BARK_SOUND;
  const BARK_GROUP = Bun.env.BARK_GROUP;

  return {
    key: BARK_KEY,
    serverUrl: BARK_SERVER_URL,
    sound: BARK_SOUND,
    group: BARK_GROUP,
  };
}

/**
 * Bark notification provider for iOS push notifications
 */
export class BarkNotifier implements NotificationProvider {
  private config: BarkConfig;

  constructor() {
    const config = getBarkConfig();
    if (!config) {
      throw new Error("Bark configuration not found: BARK_KEY is required");
    }
    this.config = config;
  }

  /**
   * Send notification via Bark API
   */
  async send(payload: NotificationPayload): Promise<void> {
    // Remove trailing slashes from server URL
    const serverUrl = this.config.serverUrl.replace(/\/+$/, "");
    const endpoint = `${serverUrl}/push`;

    // Construct request body
    const body: Record<string, string> = {
      device_key: this.config.key,
      title: payload.title,
      body: payload.body,
    };

    // Add optional parameters
    if (this.config.sound) {
      body.sound = this.config.sound;
    }
    if (this.config.group) {
      body.group = this.config.group;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `Bark notification failed with status ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Bark notification sent successfully:", result);
    } catch (error) {
      console.error("Failed to send Bark notification:", error);
      throw error;
    }
  }
}

/**
 * Send notification via Bark (convenience function)
 */
export async function sendBarkNotification(
  payload: NotificationPayload
): Promise<void> {
  const config = getBarkConfig();
  if (!config) {
    console.log("Bark notification skipped: BARK_KEY not configured");
    return;
  }

  const notifier = new BarkNotifier();
  await notifier.send(payload);
}
