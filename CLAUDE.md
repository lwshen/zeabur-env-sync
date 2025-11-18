---
description: Coding guidelines for the zeabur-env-sync CLI tool using Bun runtime
globs: "*.ts, *.tsx, package.json"
alwaysApply: false
---

# Zeabur-Env-Sync Coding Guidelines

This is a **CLI tool** (not a web app) that synchronizes environment variables from VaultHub to Zeabur services using Bun runtime.

## Project Context

- **Purpose**: Fetch env vars from VaultHub, compare with Zeabur, and sync differences
- **Runtime**: Bun (not Node.js)
- **APIs Used**:
  - Zeabur GraphQL API (via `graphql-request`)
  - VaultHub REST API (via `@lwshen/vault-hub-ts-fetch-client`)
- **No Frontend**: Pure CLI automation tool

## Bun Basics

Default to using Bun instead of Node.js:

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>`
- **Bun automatically loads .env**, so don't import dotenv for env loading

### Running the Tool

```bash
bun run index.ts
```

## Environment Variables

### Loading Environment Variables

Use `Bun.env.VARIABLE_NAME` to access environment variables. Bun automatically loads `.env` files.

```typescript
const ZEABUR_API_KEY = Bun.env.ZEABUR_API_KEY;
const ZEABUR_SERVICE_ID = Bun.env.ZEABUR_SERVICE_ID;
```

### Always Validate Required Variables

```typescript
if (!ZEABUR_API_KEY || !ZEABUR_SERVICE_ID || !ZEABUR_ENV_ID) {
  throw new Error('Missing required environment variables: ...');
}
```

### When to Use `dotenv` Package

In this project, `dotenv` is used **ONLY** for parsing vault content (which is in `.env` format), NOT for loading environment variables:

```typescript
import dotenv from 'dotenv';

// Parse .env format string content from VaultHub
const parsed = dotenv.parse(envContent);
```

## Module Structure

Follow this organization pattern:

- **index.ts**: Main orchestration logic (fetch, compare, sync workflow)
- **zeabur.ts**: All Zeabur GraphQL API operations
- **vault-hub.ts**: All VaultHub REST API operations
- **utils.ts**: Pure utility functions (parsing, comparison)
- **type.ts**: Shared TypeScript type definitions

### Adding New Functionality

1. Determine which module the feature belongs to
2. If adding Zeabur operations: add to `zeabur.ts` and use `createZeaburClient()`
3. If adding VaultHub operations: add to `vault-hub.ts`
4. If adding utilities: add to `utils.ts`
5. Export the function and use it in `index.ts`

## API Integration Patterns

### Zeabur GraphQL API

Use `graphql-request` library with centralized client creation:

```typescript
import { GraphQLClient, gql } from 'graphql-request';

// Centralized client creation pattern
function createZeaburClient(): ZeaburConfig {
  const ZEABUR_API_KEY = Bun.env.ZEABUR_API_KEY;
  // ... validate vars ...

  const client = new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${ZEABUR_API_KEY}`,
    },
  });

  return { client, serviceId, envId };
}

// Use in functions
export async function getZeaburVariables() {
  const { client, serviceId, envId } = createZeaburClient();
  const data = await client.request(query, { serviceId, envId });
  return data;
}
```

**Define Queries/Mutations:**

```typescript
const query = gql`
  query GetServiceVariables($serviceId: ObjectID!, $envId: ObjectID!) {
    service(_id: $serviceId) {
      variables(environmentID: $envId) {
        _id
        key
        value
      }
    }
  }
`;
```

### VaultHub REST API

Use `@lwshen/vault-hub-ts-fetch-client` TypeScript client:

```typescript
import { Configuration, CliApi } from '@lwshen/vault-hub-ts-fetch-client';

const config = new Configuration({
  basePath: VAULT_HUB_BASE_URL,
  headers: {
    'Authorization': `Bearer ${VAULT_HUB_API_KEY}`,
  },
});

const cliApi = new CliApi(config);
const vault = await cliApi.getVaultByNameAPIKey(vaultName);
```

**API Key Validation:**
- VaultHub API keys must start with `vhub_` prefix
- Validate format before making API calls

```typescript
if (!VAULT_HUB_API_KEY.startsWith('vhub_')) {
  throw new Error('Invalid API key format: must start with "vhub_"');
}
```

## TypeScript Conventions

### Use Explicit Return Types

```typescript
export async function getZeaburVariables(): Promise<EnvironmentVariable[]> {
  // ...
}
```

### Define Interfaces for Configuration

```typescript
interface ZeaburConfig {
  client: GraphQLClient;
  serviceId: string;
  envId: string;
}
```

### Type External API Responses

```typescript
// Type as 'any' initially, then map to internal types
const data: any = await client.request(query);

return data.service.variables.map((variable: any) => ({
  _id: variable._id,
  key: variable.key,
  value: variable.value,
}));
```

### Export Shared Types

Define shared types in `type.ts` and import where needed:

```typescript
// type.ts
export type EnvironmentVariable = {
  _id: string;
  key: string;
  value: string;
};

// other files
import type { EnvironmentVariable } from './type';
```

## Error Handling Patterns

### Early Validation

Validate all required inputs at the start of functions:

```typescript
export async function getVaultHubVault(): Promise<Vault> {
  // Validate environment variables first
  if (!VAULT_HUB_BASE_URL || !VAULT_HUB_API_KEY || !VAULT_HUB_NAME) {
    throw new Error('Missing required environment variables: ...');
  }

  // Validate format
  if (!VAULT_HUB_API_KEY.startsWith('vhub_')) {
    throw new Error('Invalid API key format: ...');
  }

  // Proceed with API call
}
```

### Descriptive Error Messages

Always include context in error messages:

```typescript
// Good
throw new Error('Missing required environment variables: ZEABUR_API_KEY, ZEABUR_SERVICE_ID, ZEABUR_ENV_ID');

// Bad
throw new Error('Missing config');
```

### Let Errors Bubble Up

Don't catch errors in low-level functions. Let them bubble up to the main orchestration layer:

```typescript
// In zeabur.ts, vault-hub.ts, utils.ts - no try-catch
export async function getZeaburVariables() {
  // Just throw errors, don't catch
}

// In index.ts - catch at top level
async function main() {
  try {
    await getZeaburVariables();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
```

## Data Structures

### Use Map for Key-Value Data

```typescript
const currentMap = new Map(current.map(v => [v.key, v]));
const desiredMap = new Map(desired.map(v => [v.key, v]));

// Fast O(1) lookups
if (currentMap.has(key)) { ... }
```

### Filter and Map Patterns

```typescript
return Object.entries(parsed)
  .filter(([key, value]) => key && value !== undefined)
  .map(([key, value]) => ({
    _id: String(id++),
    key,
    value,
  }));
```

## Testing

Use `bun test` for testing (when adding tests):

```typescript
import { test, expect } from "bun:test";

test("parseEnvToVariables", () => {
  const result = parseEnvToVariables("KEY=value");
  expect(result).toEqual([{ _id: "1", key: "KEY", value: "value" }]);
});
```

## Dependencies

Current dependencies and their purposes:

- **@lwshen/vault-hub-ts-fetch-client**: TypeScript client for VaultHub API
- **graphql-request**: Lightweight GraphQL client for Zeabur API
- **graphql**: GraphQL schema and query language
- **dotenv**: Parse `.env` format content from vaults (NOT for loading env)

### When Adding Dependencies

Prefer Bun-native solutions when available:
- Use `Bun.env` instead of `dotenv` for environment loading
- Use `Bun.file` instead of `fs.readFile/writeFile`
- Use `Bun.$` instead of `execa` for shell commands

Only use external packages when needed for specific APIs (like graphql-request, vault-hub client).

## Code Style

- Use descriptive function and variable names
- Keep functions focused on a single responsibility
- Extract shared logic into helper functions
- Comment complex logic, but prefer self-documenting code
- Use JSDoc comments for exported functions

```typescript
/**
 * Parse .env file content into EnvironmentVariable array
 * @param envContent - The .env file content as a string
 * @returns Array of EnvironmentVariable with incremental IDs
 */
export function parseEnvToVariables(envContent: string): EnvironmentVariable[] {
  // ...
}
```

## Reference

For more Bun-specific APIs and patterns, see: `node_modules/bun-types/docs/**.md`
