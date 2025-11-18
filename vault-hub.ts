import { Configuration, CliApi } from '@lwshen/vault-hub-ts-fetch-client';
import type { Vault } from '@lwshen/vault-hub-ts-fetch-client';

export async function getVaultHubVault(): Promise<Vault> {
  // Load environment variables from Bun.env (automatically loads from .env)
  const VAULT_HUB_BASE_URL = Bun.env.VAULT_HUB_BASE_URL;
  const VAULT_HUB_API_KEY = Bun.env.VAULT_HUB_API_KEY;
  const VAULT_HUB_NAME = Bun.env.VAULT_HUB_NAME;

  // Validate required environment variables
  if (!VAULT_HUB_BASE_URL || !VAULT_HUB_API_KEY || !VAULT_HUB_NAME) {
    throw new Error('Missing required environment variables: VAULT_HUB_BASE_URL, VAULT_HUB_API_KEY, VAULT_HUB_NAME');
  }

  // Validate API key format (must start with 'vhub_')
  if (!VAULT_HUB_API_KEY.startsWith('vhub_')) {
    throw new Error('Invalid API key format: VAULT_HUB_API_KEY must start with "vhub_"');
  }

  // Initialize configuration with base URL and API key authentication
  const config = new Configuration({
    basePath: VAULT_HUB_BASE_URL,
    headers: {
      'Authorization': `Bearer ${VAULT_HUB_API_KEY}`,
    },
  });

  // Create CLI API client
  const cliApi = new CliApi(config);

  // Get vault by name
  const vault = await cliApi.getVaultByNameAPIKey(VAULT_HUB_NAME);

  return vault;
}
