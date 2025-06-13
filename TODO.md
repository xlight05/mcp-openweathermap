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
  - `OPENWEATHER_API_KEY`: OpenWeatherMap API key (required)
  - `API_KEY`: MCP server authentication key (for HTTP transport)
  - `PORT`: Server port (default: 3000)
- Support both stdio and HTTP stream transports
- Automatic authentication on server startup for stdio transport
- HTTP Basic Auth for HTTP stream transport

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
- **Returns**: Hourly forecast data

#### 2.3 OneCall Weather
- **Tool Name**: `get-onecall-weather`
- **Description**: Get comprehensive weather data (current + 7-day forecast)
- **Parameters**:
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
  - `units`: Temperature units
  - `exclude`: Optional array of data to exclude (e.g., ["minutely", "hourly"])
- **Returns**: Complete weather data including current, hourly, and daily forecasts

#### 2.4 Air Pollution
- **Tool Name**: `get-air-pollution`
- **Description**: Get air quality index and pollution data
- **Parameters**:
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
- **Returns**: Air quality index, CO, NO, NO2, O3, SO2, PM2.5, PM10 levels

#### 2.5 Geocoding
- **Tool Name**: `geocode-location`
- **Description**: Convert location name to coordinates or vice versa
- **Parameters**:
  - `query`: Location name or zip code
  - `limit`: Maximum number of results (default: 5)
- **Returns**: Array of matching locations with coordinates

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

### Phase 1: Foundation (Week 1)
- [ ] Initialize project with bun, typescript, and pnpm
- [ ] Set up FastMCP server with basic configuration
- [ ] Implement transport configuration (stdio/HTTP)
- [ ] Create authentication system for both transports
- [ ] Set up Zod schemas for all tools

### Phase 2: Core Weather Tools (Week 2)
- [ ] Integrate openweather-api-node library
- [ ] Implement get-current-weather tool
- [ ] Implement get-weather-forecast tool
- [ ] Add proper error handling and validation
- [ ] Create utility functions for data formatting

### Phase 3: Advanced Features (Week 3)
- [ ] Implement get-onecall-weather tool
- [ ] Implement get-air-pollution tool
- [ ] Implement geocode-location tool
- [ ] Add caching for frequently requested data
- [ ] Create comprehensive documentation resource

### Phase 4: Testing & Polish (Week 4)
- [ ] Write unit tests for all tools
- [ ] Add integration tests with mock API responses
- [ ] Create example usage documentation
- [ ] Set up MCP inspector configuration
- [ ] Performance optimization and error handling refinement

## Security Considerations
- Never expose API keys in logs or responses
- Sanitize location inputs to prevent injection
- Implement rate limiting for HTTP transport
- Use HTTPS for all API communications

## Performance Requirements
- Response time < 2 seconds for all weather queries
- Implement caching with 10-minute TTL for same location queries
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