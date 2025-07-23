# Use the official Bun image as the base image
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package.json and bun.lock (if exists) for dependency installation
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

ENV MCP_TRANSPORT=httpStream
ENV PORT=3000
ENV MCP_ENDPOINT=/stream

# Expose port (if needed for HTTP transport)
EXPOSE 3000

# Build the TypeScript project
# RUN bun run src/main.ts
CMD ["bun", "run", "src/main.ts"]

# # Production stage
# FROM oven/bun:1-slim AS production

# # Set working directory
# WORKDIR /app

# # Copy package.json for production dependencies
# COPY package.json ./

# # Install only production dependencies
# RUN bun install --production --frozen-lockfile

# # Copy built application from build stage
# COPY --from=base /app/dist ./dist

# # Create a non-root user for security
# RUN addgroup --system --gid 1001 nodejs && \
#     adduser --system --uid 1001 nodejs

# # Change ownership of the app directory to the nodejs user
# RUN chown -R nodejs:nodejs /app
# USER nodejs

# ENV MCP_TRANSPORT=httpStream
# ENV PORT=3000
# ENV MCP_ENDPOINT=/stream

# # Expose port (if needed for HTTP transport)
# EXPOSE 3000

# # Set default command to run the built application
# CMD ["bun", "run", "dist/main.js"]
