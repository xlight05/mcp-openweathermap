# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development and testing
bun run dev                 # Run development server with .env file
bun run test               # Run test suite
bun run test:watch         # Run tests in watch mode
bun run typecheck          # TypeScript type checking
bun run typecheck:watch    # Type checking in watch mode

# Build and release
bun run build             # Compile TypeScript to JavaScript
bun run release           # Build and publish (with changesets)

# MCP Inspector for testing
bun run inspect           # Test with MCP Inspector (dev)
bun run inspect:built     # Test with MCP Inspector (built)
bun run inspect:http      # Test with MCP Inspector (HTTP mode)
```

## Architecture Overview

This is an MCP (Model Context Protocol) server that provides weather data integration through OpenWeatherMap API. It implements 11 weather-related tools using the FastMCP framework.

### Core Components

- **Main Entry Point** (`src/main.ts`): Implements all 11 weather tools with FastMCP framework
- **Authentication System** (`src/auth/`): Handles both HTTP bearer token and stdio environment variable authentication
- **Schema Validation** (`src/schemas.ts`): Zod schemas for all 11 tools with comprehensive input validation
- **Transport Configuration** (`src/config/transport.ts`): Environment-driven transport selection (stdio/HTTP stream)

### Key Utilities

- **Client Resolver** (`src/utils/client-resolver.ts`): Manages OpenWeatherAPI client instances with session-based caching
- **Location Parser** (`src/utils/location-parser.ts`): Parses coordinates, city names, and various location formats
- **Weather Formatter** (`src/utils/weather-formatter.ts`): Formats API responses for display

### Transport Modes

The server supports dual transport modes:
- **Stdio Transport** (default): Uses `OPENWEATHER_API_KEY` environment variable
- **HTTP Stream Transport**: Uses Bearer token authentication

Transport selection is automatic based on environment detection in `src/config/transport.ts`.

### Weather Tools Available

11 weather tools covering current conditions, forecasts (hourly/daily/minutely), air quality, weather alerts, and location services. All tools use consistent error handling and session-based API client caching.

## Development Notes

- Built with Bun runtime and TypeScript (ES2022 modules)
- Uses `openweather-api-node` for OpenWeatherMap API integration
- Session-based authentication prevents repeated API key validation
- MCP Inspector configurations available for all transport modes
- Comprehensive error handling with context-aware messages