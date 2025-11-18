# zeabur-env-sync

A tool to automatically synchronize environment variables from VaultHub to Zeabur services. This tool fetches environment variables stored in VaultHub, compares them with your Zeabur service's current configuration, and automatically updates any differences.

## Features

- Fetch environment variables from VaultHub (stored as `.env` format)
- Retrieve current variables from Zeabur service via GraphQL API
- Smart comparison to detect variables to add, update, or delete
- Automatic synchronization of variables to Zeabur
- Automatic service restart after updates
- Detailed diff reporting with clear visual indicators

## Prerequisites

- [Bun](https://bun.com) runtime (v1.3.0 or later)
- Zeabur account with API access
- VaultHub account with API access
- A Zeabur service to manage
- A VaultHub vault containing environment variables in `.env` format

## Installation

1. Clone or download this repository

2. Install dependencies:

```bash
bun install
```

## Configuration

### Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

#### Zeabur Configuration

- `ZEABUR_API_KEY` - Your Zeabur API key
  - Get from: [Zeabur Dashboard](https://zeabur.com) → Settings → API Keys
- `ZEABUR_SERVICE_ID` - The ID of the service to manage
  - Find in your service's URL or via Zeabur API
- `ZEABUR_ENV_ID` - The environment ID (e.g., production, staging)
  - Find in your environment settings

#### VaultHub Configuration

- `VAULT_HUB_BASE_URL` - Your VaultHub instance URL
  - Deploy your own VaultHub instance from the [open source project](https://github.com/lwshen/vault-hub)
- `VAULT_HUB_API_KEY` - Your VaultHub API key (must start with `vhub_`)
  - Get from your VaultHub dashboard
- `VAULT_HUB_NAME` - The name of the vault containing your environment variables
  - The vault should contain variables in `.env` file format

### Example .env File

```env
# Zeabur API Configuration
ZEABUR_API_KEY=your_zeabur_api_key_here
ZEABUR_SERVICE_ID=your_service_id_here
ZEABUR_ENV_ID=your_environment_id_here

# Vault Hub API Configuration
VAULT_HUB_BASE_URL=https://vault-hub-dev.zeabur.app
VAULT_HUB_API_KEY=vhub_your_api_key_here
VAULT_HUB_NAME=your_vault_name_here
```

## Usage

Run the synchronization tool:

```bash
bun run index.ts
```

### What It Does

1. Fetches current environment variables from your Zeabur service
2. Fetches the vault content from VaultHub
3. Parses the VaultHub vault content (`.env` format)
4. Compares current state with desired state
5. Displays a detailed diff showing:
   - Variables to ADD (exist in vault but not in Zeabur)
   - Variables to UPDATE (different values)
   - Variables to DELETE (exist in Zeabur but not in vault)
6. If changes detected:
   - Updates all variables in Zeabur
   - Automatically restarts the Zeabur service
7. If no changes: exits without making updates

### Example Output

```
=== Variables Comparison ===

📝 Variables to ADD (2):
  + NEW_API_KEY: abc123
  + NEW_FEATURE_FLAG: true

🔄 Variables to UPDATE (1):
  ~ DATABASE_URL:
    - Old: postgres://old-host/db
    + New: postgres://new-host/db

🗑️  Variables to DELETE (1):
  - DEPRECATED_VAR: old_value

=== Summary ===
Total changes needed: 4
```

## Project Structure

```
zeabur-env-sync/
├── index.ts           # Main entry point - orchestrates sync workflow
├── zeabur.ts          # Zeabur GraphQL API integration
├── vault-hub.ts       # VaultHub REST API integration
├── utils.ts           # Utility functions (parsing, comparison)
├── type.ts            # TypeScript type definitions
├── package.json       # Dependencies and project metadata
├── tsconfig.json      # TypeScript configuration
├── .env.example       # Environment variables template
└── README.md          # This file
```

### Module Descriptions

- **index.ts**: Main application logic that coordinates fetching, comparing, and syncing variables
- **zeabur.ts**: Functions to interact with Zeabur's GraphQL API (get/update variables, restart service)
- **vault-hub.ts**: Functions to fetch vaults from VaultHub using the CLI API
- **utils.ts**: Helper functions for parsing `.env` content and comparing variable sets
- **type.ts**: Shared TypeScript interfaces (e.g., `EnvironmentVariable`)

## How It Works

### Architecture

```
VaultHub (source of truth)
    ↓
[Fetch vault] ← vault-hub.ts
    ↓
[Parse .env content] ← utils.ts
    ↓
[Compare with Zeabur] ← utils.ts
    ↓
[Update if needed] ← zeabur.ts
    ↓
[Restart service] ← zeabur.ts
```

### Workflow Details

1. **Authentication**: The tool authenticates with both services using API keys from `.env`
2. **Fetch Current State**: Retrieves existing variables from Zeabur via GraphQL query
3. **Fetch Desired State**: Retrieves vault content from VaultHub via REST API
4. **Parse**: Converts vault content (`.env` format) into structured key-value pairs using `dotenv`
5. **Compare**: Performs case-sensitive comparison to identify differences
6. **Sync**: If changes detected, updates Zeabur variables in bulk using GraphQL mutation
7. **Restart**: Automatically restarts the Zeabur service to apply changes

## Development

This project uses:

- **Bun** as the runtime (faster than Node.js)
- **TypeScript** for type safety
- **GraphQL** for Zeabur API communication
- **REST API** for VaultHub integration
- **dotenv** for parsing `.env` file content

### Extending the Tool

To add new functionality:

1. Add new GraphQL queries/mutations to `zeabur.ts`
2. Use the shared `createZeaburClient()` helper for consistent authentication
3. Follow the existing pattern for error handling and validation
4. Export functions for use in `index.ts`

### Code Guidelines

See `CLAUDE.md` for Bun-specific coding conventions used in this project.

## License

MIT
