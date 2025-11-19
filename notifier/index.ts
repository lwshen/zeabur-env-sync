import type { VariablesDiff } from "../type";
import type { NotificationPayload, NotificationProvider } from "./types";
import { BarkNotifier } from "./bark";

/**
 * Create a notification payload from sync results
 */
export function createNotificationPayload(
  diff: VariablesDiff,
  success: boolean,
  error?: Error
): NotificationPayload {
  const timestamp = new Date().toISOString();
  const changesCount = {
    added: diff.toAdd.length,
    updated: diff.toUpdate.length,
    deleted: diff.toDelete.length,
    total: diff.toAdd.length + diff.toUpdate.length + diff.toDelete.length,
  };

  let title: string;
  let body: string;
  let summary: string;

  if (!success && error) {
    // Error notification
    title = "❌ Zeabur Env Sync Failed";
    summary = `Sync failed with error`;
    body = `Error: ${error.message}\n[${timestamp}]`;
  } else if (changesCount.total === 0) {
    // No changes notification
    title = "ℹ️ Zeabur Env Sync";
    summary = "No changes needed";
    body = `No changes needed\n[${timestamp}]`;
  } else {
    // Success notification with changes
    title = "✅ Zeabur Env Sync Success";
    summary = `${changesCount.total} changes applied`;
    const changes: string[] = [];
    if (changesCount.added > 0) {
      changes.push(`Added: ${changesCount.added} variable${changesCount.added > 1 ? "s" : ""}`);
    }
    if (changesCount.updated > 0) {
      changes.push(`Updated: ${changesCount.updated} variable${changesCount.updated > 1 ? "s" : ""}`);
    }
    if (changesCount.deleted > 0) {
      changes.push(`Deleted: ${changesCount.deleted} variable${changesCount.deleted > 1 ? "s" : ""}`);
    }
    changes.push(`Total: ${changesCount.total} changes applied`);
    body = `${changes.join("\n")}\n[${timestamp}]`;
  }

  return {
    title,
    body,
    summary,
    changesCount,
    timestamp,
    success,
    error: error?.message,
  };
}

/**
 * Send notifications to all configured providers
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  const providers: NotificationProvider[] = [];

  // Check and add enabled providers
  if (Bun.env.BARK_KEY) {
    try {
      providers.push(new BarkNotifier());
    } catch (error) {
      console.error("Failed to initialize Bark notifier:", error);
    }
  }

  // Future providers can be added here:
  // if (Bun.env.DISCORD_WEBHOOK) { providers.push(new DiscordNotifier()); }
  // if (Bun.env.SLACK_WEBHOOK) { providers.push(new SlackNotifier()); }

  if (providers.length === 0) {
    console.log("No notification providers configured, skipping notifications");
    return;
  }

  // Send to all providers in parallel
  const results = await Promise.allSettled(
    providers.map((provider) => provider.send(payload))
  );

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Notification provider ${index} failed:`, result.reason);
    }
  });
}
