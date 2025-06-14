# mcp-openweathermap

## 0.1.3

### Patch Changes

- Add CLAUDE.md development guidance, remove TODO.md, and fix stdio console.log compatibility issue

## 0.1.2

### Patch Changes

- Improve stdio transport compatibility by reorganizing console logging

  - Move HTTP stream logging inside the conditional block
  - Remove problematic console.log for stdio transport to prevent interference with MCP protocol communication
  - Ensure all startup messages use console.error for stderr output when needed

## 0.1.1

### Patch Changes

- Convert to ESM modules and update build process for better compatibility

## 0.1.0

### Minor Changes

- Initial release of MCP OpenWeatherMap server

  Complete MCP server implementation with 11 weather tools:

  **Weather Information:**

  - Current weather conditions
  - 5-day weather forecast
  - Hourly forecasts (up to 48 hours)
  - Daily forecasts (up to 8 days)
  - Minutely precipitation forecasts

  **Air Quality & Location:**

  - Current air pollution data
  - Air pollution forecasts and history
  - Weather alerts and warnings
  - Location info (reverse geocoding)
  - Geocoding (location to coordinates)
  - Comprehensive OneCall weather data

  **Features:**

  - Supports both stdio and HTTP stream transports
  - Comprehensive error handling and logging
  - Compatible with Claude Desktop
  - Uses OpenWeatherMap API with openweather-api-node client
  - TypeScript with full type safety
