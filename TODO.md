# MCP OpenWeatherMap Server - Product Requirements Document

## Overview
This document outlines the requirements for building an MCP (Model Context Protocol) server that integrates with the OpenWeatherMap API. The server will be built using the same technology stack and architecture patterns as `mcp-sunsama`.

## Technology Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Framework**: FastMCP (v2.1.3)
- **API Client**: openweather-api-node (by loloToster)
- **Schema Validation**: Zod (v3.24.4)

## Architecture Pattern
Following the mcp-sunsama structure:
```
mcp-openweathermap/
├── src/
│   ├── auth/
│   │   ├── http.ts        # HTTP stream authentication
│   │   ├── stdio.ts       # Stdio authentication
│   │   └── types.ts       # Authentication types
│   ├── config/
│   │   └── transport.ts   # Transport configuration
│   ├── utils/
│   │   └── client-resolver.ts  # OpenWeatherMap client resolution
│   ├── main.ts           # Main server entry point
│   └── schemas.ts        # Zod schemas for input validation
├── package.json
├── tsconfig.json
├── bun.lock
└── README.md
```

## Core Features

### 1. Authentication
- **Environment Variables**:
  - `OPENWEATHER_API_KEY`: OpenWeatherMap API key (required, used for both API access and HTTP stream authentication)
  - `PORT`: Server port (default: 3000, for HTTP transport only)
- Support both stdio and HTTP stream transports
- Automatic authentication on server startup for stdio transport
- HTTP Bearer Token Auth for HTTP stream transport (using OpenWeatherMap API key)

### 2. Weather Tools

#### 2.1 Current Weather
- **Tool Name**: `get-current-weather`
- **Description**: Get current weather conditions for a location
- **Parameters**:
  - `location`: City name (e.g., "New York") or coordinates
  - `units`: Temperature units (metric/imperial/kelvin)
- **Returns**: Current weather data including temperature, conditions, humidity, wind

#### 2.2 Weather Forecast
- **Tool Name**: `get-weather-forecast`
- **Description**: Get weather forecast for up to 5 days
- **Parameters**:
  - `location`: City name or coordinates
  - `units`: Temperature units
  - `days`: Number of days (1-5)
- **Returns**: Daily forecast data

#### 2.3 Hourly Forecast ✅ IMPLEMENTED
- **Tool Name**: `get-hourly-forecast`
- **Description**: Get hourly weather forecast for up to 48 hours
- **Parameters**:
  - `location`: City name or coordinates
  - `units`: Temperature units
  - `hours`: Number of hours (1-48, default: 48)
- **Returns**: Hourly forecast data with temperature, conditions, humidity, wind, pressure, visibility

#### 2.4 OneCall Weather
- **Tool Name**: `get-onecall-weather`
- **Description**: Get comprehensive weather data (current + 7-day forecast)
- **Parameters**:
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
  - `units`: Temperature units
  - `exclude`: Optional array of data to exclude (e.g., ["minutely", "hourly"])
- **Returns**: Complete weather data including current, hourly, and daily forecasts

#### 2.5 Air Pollution
- **Tool Name**: `get-air-pollution`
- **Description**: Get air quality index and pollution data
- **Parameters**:
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
- **Returns**: Air quality index, CO, NO, NO2, O3, SO2, PM2.5, PM10 levels

#### 2.6 Geocoding
- **Tool Name**: `geocode-location`
- **Description**: Convert location name to coordinates or vice versa
- **Parameters**:
  - `query`: Location name or zip code
  - `limit`: Maximum number of results (default: 5)
- **Returns**: Array of matching locations with coordinates

#### 2.7 Daily Forecast ✅ IMPLEMENTED
- **Tool Name**: `get-daily-forecast`
- **Description**: Get daily weather forecast for up to 8 days
- **Parameters**:
  - `location`: City name or coordinates
  - `units`: Temperature units
  - `days`: Number of days (1-8)
  - `include_today`: Include today's forecast (default: false)
- **Returns**: Daily forecast data with min/max temperatures, astronomical data, precipitation

#### 2.8 Minutely Forecast ✅ IMPLEMENTED
- **Tool Name**: `get-minutely-forecast`
- **Description**: Get minute-by-minute precipitation forecast for next hour
- **Parameters**:
  - `location`: City name or coordinates
  - `limit`: Number of minutes (default: 60)
- **Returns**: Precipitation data for each minute with intensity classification

#### 2.9 Weather Alerts ✅ IMPLEMENTED
- **Tool Name**: `get-weather-alerts`
- **Description**: Get active weather alerts and warnings
- **Parameters**:
  - `location`: City name or coordinates
- **Returns**: Array of weather alerts with severity classification and detailed descriptions

#### 2.10 Current Air Pollution ✅ IMPLEMENTED
- **Tool Name**: `get-current-air-pollution`
- **Description**: Get current air quality data (replaces placeholder)
- **Parameters**:
  - `location`: City name or coordinates
- **Returns**: Current air quality index and comprehensive pollutant measurements

#### 2.11 Location Info ✅ IMPLEMENTED
- **Tool Name**: `get-location-info`
- **Description**: Get location information from coordinates (reverse geocoding)
- **Parameters**:
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
- **Returns**: Location name, country, state, and local name information

### 3. Resources
- **URI**: `openweather://api/docs`
- **Name**: OpenWeatherMap API Documentation
- **Description**: Documentation for available weather data endpoints and response formats

## Data Formats

### Weather Response Format
All weather data should be returned in a consistent format with:
- Clear field names and units
- Timestamps in ISO 8601 format
- Temperature values with unit indicators
- Descriptive weather conditions

### Error Handling
- Validate API key on startup
- Handle rate limiting gracefully
- Provide clear error messages for:
  - Invalid locations
  - Missing API key
  - Network errors
  - API quota exceeded

## Development Milestones

### Phase 1: Foundation ✅ COMPLETED
- [x] Initialize project with bun, typescript, and pnpm
- [x] Set up FastMCP server with basic configuration
- [x] Implement transport configuration (stdio/HTTP)
- [x] Create authentication system for both transports
- [x] Set up Zod schemas for all tools
- [x] Initialize git repository with proper .gitignore

### Phase 2: Core Weather Tools ✅ COMPLETED
- [x] Integrate openweather-api-node library
- [x] Implement get-current-weather tool
- [x] Implement get-weather-forecast tool
- [x] Implement get-hourly-forecast tool
- [x] Add proper error handling and validation
- [x] Create utility functions for data formatting
- [x] Create location parsing utilities (city names vs coordinates)
- [x] Add comprehensive weather data formatting
- [x] Set up MCP inspector configuration
- [x] Switch to Bearer token authentication for HTTP transport

### Phase 3: Advanced Features 🔄 IN PROGRESS
- [ ] Implement get-onecall-weather tool
- [ ] Implement get-air-pollution tool
- [ ] Implement geocode-location tool
- [x] Implement get-daily-forecast tool (high priority)
- [x] Implement get-minutely-forecast tool (high priority)
- [x] Implement get-weather-alerts tool (high priority)
- [x] Implement get-current-air-pollution tool (high priority)
- [x] Implement get-location-info tool (high priority - reverse geocoding)
- [ ] Create comprehensive documentation resource

### Phase 4: Testing & Polish
- [ ] Write unit tests for all tools
- [ ] Add integration tests with mock API responses
- [ ] Create example usage documentation
- [x] Set up MCP inspector configuration
- [ ] Performance optimization and error handling refinement

## Security Considerations
- Never expose API keys in logs or responses
- Sanitize location inputs to prevent injection
- Implement rate limiting for HTTP transport
- Use HTTPS for all API communications

## Performance Requirements
- Response time < 2 seconds for all weather queries
- Efficient data trimming to reduce response sizes
- Support concurrent tool calls

## NPM Publishing Strategy
- **Package Name**: `mcp-openweathermap`
- **Executable**: Users can run via `npx mcp-openweathermap`
- **Distribution**: Published to npm registry using changesets
- **Entry Point**: Configure bin field in package.json for CLI execution
- **Versioning**: Use changesets for version management and changelog generation
- **Requirements**:
  - Initialize changesets configuration
  - Ensure proper shebang line in main executable
  - Bundle all dependencies appropriately
  - Test npx execution before publishing
  - Include clear installation instructions in README
  - Set up GitHub Actions for automated releases

## Success Criteria
- All weather tools return accurate, real-time data
- Server handles authentication seamlessly
- Error messages are clear and actionable
- Documentation is comprehensive and helpful
- Compatible with MCP inspector for testing
- Follows mcp-sunsama patterns for consistency
- Successfully published to npm and runnable via `npx mcp-openweathermap`
- Works seamlessly with Claude Desktop configuration
- Automated release pipeline with changesets