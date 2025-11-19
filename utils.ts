import dotenv from 'dotenv';
import type { EnvironmentVariable, VariablesDiff } from './type';

/**
 * Parse .env file content into EnvironmentVariable array
 * @param envContent - The .env file content as a string
 * @returns Array of EnvironmentVariable with incremental IDs
 */
export function parseEnvToVariables(envContent: string): EnvironmentVariable[] {
  // Use dotenv.parse to convert .env string to key-value object
  const parsed = dotenv.parse(envContent);

  // Convert to EnvironmentVariable array with incremental IDs
  let id = 1;
  return Object.entries(parsed)
    .filter(([key, value]) => key && value !== undefined)
    .map(([key, value]) => ({
      _id: String(id++),
      key,
      value,
    }));
}

/**
 * Compare current variables with desired variables to find differences
 * @param current - Current variables (e.g., from Zeabur)
 * @param desired - Desired variables (e.g., from Vault)
 * @returns Diff object showing variables to add, update, and delete
 */
export function compareVariables(
  current: EnvironmentVariable[],
  desired: EnvironmentVariable[]
): VariablesDiff {
  // Create maps for easy lookup (case-sensitive key matching)
  const currentMap = new Map(current.map(v => [v.key, v]));
  const desiredMap = new Map(desired.map(v => [v.key, v]));

  const toAdd: EnvironmentVariable[] = [];
  const toUpdate: Array<{ key: string; oldValue: string; newValue: string }> = [];
  const toDelete: EnvironmentVariable[] = [];

  // Find variables to add and update
  for (const [key, desiredVar] of desiredMap) {
    const currentVar = currentMap.get(key);
    if (!currentVar) {
      // Variable exists in vault but not in current state - need to add
      toAdd.push(desiredVar);
    } else if (currentVar.value !== desiredVar.value) {
      // Variable exists in both but has different value - need to update
      toUpdate.push({
        key,
        oldValue: currentVar.value,
        newValue: desiredVar.value,
      });
    }
  }

  // Find variables to delete
  for (const [key, currentVar] of currentMap) {
    if (!desiredMap.has(key)) {
      // Variable exists in current state but not in vault - need to delete
      toDelete.push(currentVar);
    }
  }

  return { toAdd, toUpdate, toDelete };
}
