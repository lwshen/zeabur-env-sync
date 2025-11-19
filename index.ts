import Baker from "cronbake";
import { compareVariables, parseEnvToVariables } from "./utils";
import { getVaultHubVault } from "./vault-hub";
import {
  getZeaburVariables,
  restartZeaburService,
  updateZeaburVariables,
} from "./zeabur";

/**
 * Core sync logic - fetches from VaultHub, compares with Zeabur, and applies changes
 */
async function runSync() {
  const existingVariables = await getZeaburVariables();
  const vaultVariables = await getVaultHubVault();
  const parsedVaultVariables = parseEnvToVariables(vaultVariables.value);

  // Compare current (Zeabur) with desired (Vault) state
  const diff = compareVariables(existingVariables, parsedVaultVariables);

  console.log("=== Variables Comparison ===\n");

  // Variables to add
  console.log(`📝 Variables to ADD (${diff.toAdd.length}):`);
  if (diff.toAdd.length > 0) {
    diff.toAdd.forEach((v) => {
      console.log(`  + ${v.key}: ${v.value}`);
    });
  } else {
    console.log("  (none)");
  }

  console.log("");

  // Variables to update
  console.log(`🔄 Variables to UPDATE (${diff.toUpdate.length}):`);
  if (diff.toUpdate.length > 0) {
    diff.toUpdate.forEach((v) => {
      console.log(`  ~ ${v.key}:`);
      console.log(`    - Old: ${v.oldValue}`);
      console.log(`    + New: ${v.newValue}`);
    });
  } else {
    console.log("  (none)");
  }

  console.log("");

  // Variables to delete
  console.log(`🗑️  Variables to DELETE (${diff.toDelete.length}):`);
  if (diff.toDelete.length > 0) {
    diff.toDelete.forEach((v) => {
      console.log(`  - ${v.key}: ${v.value}`);
    });
  } else {
    console.log("  (none)");
  }

  console.log("\n=== Summary ===");
  console.log(
    `Total changes needed: ${
      diff.toAdd.length + diff.toUpdate.length + diff.toDelete.length
    }`
  );

  if (diff.toAdd.length + diff.toUpdate.length + diff.toDelete.length === 0) {
    console.log("No changes needed");
    return;
  }

  const updateResult = await updateZeaburVariables(parsedVaultVariables);

  const restartResult = await restartZeaburService();

  return {
    diff,
    updateResult,
    restartResult,
  };
}

/**
 * Wrapper for runSync with error handling for scheduled execution
 */
async function runSyncWithErrorHandling() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Starting sync...`);

  try {
    await runSync();
    console.log(`[${timestamp}] Sync completed successfully`);
  } catch (error) {
    console.error(`[${timestamp}] Sync failed:`, error);
    // Don't throw - let scheduler continue
  }
}

/**
 * Start the cron scheduler
 */
function startScheduler(cronSchedule: string) {
  console.log(`Starting scheduler with schedule: ${cronSchedule}`);
  console.log("Press Ctrl+C to stop\n");

  const baker = Baker.create({
    autoStart: true,
  });

  baker.add({
    name: "zeabur-env-sync",
    cron: cronSchedule,
    overrunProtection: true, // Skip if previous sync still running
    callback: async () => {
      await runSyncWithErrorHandling();
    },
    onTick: () => {
      // Job started
    },
    onComplete: () => {
      // Job finished successfully
    },
    onError: (error) => {
      console.error("Scheduler error:", error.message);
    },
  });

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\nShutting down scheduler...");
    baker.stopAll();
    process.exit(0);
  });
}

/**
 * Main entry point - check for CRON_SCHEDULE and route appropriately
 */
async function main() {
  const cronSchedule = Bun.env.CRON_SCHEDULE;

  if (!cronSchedule) {
    // One-time execution (original behavior)
    try {
      await runSync();
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  } else {
    // Scheduled execution
    startScheduler(cronSchedule);
  }
}

await main();
