import { compareVariables, parseEnvToVariables } from "./utils";
import { getVaultHubVault } from "./vault-hub";
import {
  getZeaburVariables,
  restartZeaburService,
  updateZeaburVariables,
} from "./zeabur";

async function main() {
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
  console.log("Update result:", updateResult);

  const restartResult = await restartZeaburService();
  console.log("Restart result:", restartResult);

  return {
    diff,
    updateResult,
    restartResult,
  };
}

await main();
