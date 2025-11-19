# Use official Bun image as base
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package.json bun.lock ./

# Install dependencies with frozen lockfile for reproducible builds
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Change ownership of app directory to bun user
RUN chown -R bun:bun /app

# Set environment to production
ENV NODE_ENV=production

# Run as non-root user for security (bun image provides 'bun' user)
USER bun

# Expose no ports (this is a CLI tool, not a web service)

# Default command: run the CLI tool
# Can be overridden with docker run command
CMD ["bun", "run", "index.ts"]
