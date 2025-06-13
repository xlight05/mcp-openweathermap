#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { getTransportConfig } from "./config/transport.js";
import { httpStreamAuthenticator } from "./auth/http.js";
import { initializeStdioAuth } from "./auth/stdio.js";
import { getOpenWeatherClient, configureClientForLocation } from "./utils/client-resolver.js";
import { formatCurrentWeather, formatWeatherForecast } from "./utils/weather-formatter.js";
import { 
  getCurrentWeatherSchema, 
  getWeatherForecastSchema,
  getOneCallWeatherSchema,
  getAirPollutionSchema,
  geocodeLocationSchema
} from "./schemas.js";

// Get transport configuration with validation
const transportConfig = getTransportConfig();


const server = new FastMCP({
  name: "OpenWeatherMap MCP Server",
  version: "0.0.1",
  instructions: `
This MCP server provides access to the OpenWeatherMap API for weather data and forecasts.

Available tools:
- Current weather: get current weather conditions for any location
- Weather forecast: get weather forecast for up to 5 days
- OneCall weather: get comprehensive weather data (current + 7-day forecast)
- Air pollution: get air quality index and pollution data
- Geocoding: convert location names to coordinates or vice versa

Authentication is handled via the OPENWEATHER_API_KEY environment variable.
The server maintains session state per MCP connection.
  `.trim(),
  // dynamically handle authentication
  ...(transportConfig.transportType === "httpStream" ? {
    authenticate: httpStreamAuthenticator,
  } : {})
});

// Current Weather Tool
server.addTool({
  name: "get-current-weather",
  description: "Get current weather conditions for a location",
  parameters: getCurrentWeatherSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting current weather", { location: args.location });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as any);
      
      // Configure client for this request
      configureClientForLocation(client, args.location, args.units);
      
      // Fetch current weather
      const weatherData = await client.getCurrent();
      
      log.info("Successfully retrieved current weather", { 
        lat: weatherData.lat,
        lon: weatherData.lon,
        temp: weatherData.weather.temp.cur 
      });
      
      // Format the response
      const formattedWeather = formatCurrentWeather({
        name: `${weatherData.lat.toFixed(4)}, ${weatherData.lon.toFixed(4)}`, // Use coordinates as name
        main: {
          temp: weatherData.weather.temp.cur,
          feels_like: weatherData.weather.feelsLike.cur,
          humidity: weatherData.weather.humidity
        },
        weather: [{
          description: weatherData.weather.description
        }],
        wind: {
          speed: weatherData.weather.wind.speed,
          deg: weatherData.weather.wind.deg || 0
        },
        visibility: weatherData.weather.visibility,
        dt: weatherData.dtRaw,
        timezone: weatherData.timezoneOffset
      }, args.units);
      
      return {
        content: [
          {
            type: "text",
            text: formattedWeather
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get current weather", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('city not found')) {
          throw new Error(`Location "${args.location}" not found. Please check the spelling or try using coordinates.`);
        }
        if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenWeatherMap API key. Please check your configuration.');
        }
      }
      
      throw new Error(`Failed to get current weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Weather Forecast Tool
server.addTool({
  name: "get-weather-forecast",
  description: "Get weather forecast for up to 5 days",
  parameters: getWeatherForecastSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting weather forecast", { 
        location: args.location,
        days: args.days 
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as any);
      
      // Configure client for this request
      configureClientForLocation(client, args.location, args.units);
      
      // Fetch forecast data
      const forecastData = await client.getForecast();
      
      // Limit to requested number of days (default 5)
      const requestedDays = args.days || 5;
      const limitedForecast = forecastData.slice(0, requestedDays * 8); // 8 entries per day (3-hour intervals)
      
      log.info("Successfully retrieved weather forecast", { 
        location: args.location,
        entries: limitedForecast.length
      });
      
      // Group forecast by day and take daily summary
      const dailyForecasts = [];
      for (let i = 0; i < limitedForecast.length; i += 8) {
        const dayData = limitedForecast[i]; // Take first entry of each day
        if (dayData) {
          dailyForecasts.push({
            dt: dayData.dtRaw,
            main: {
              temp_min: dayData.weather.temp.min,
              temp_max: dayData.weather.temp.max,
              humidity: dayData.weather.humidity
            },
            weather: [{
              description: dayData.weather.description
            }],
            wind: {
              speed: dayData.weather.wind.speed,
              deg: dayData.weather.wind.deg || 0
            }
          });
        }
      }
      
      // Format the response
      const formattedForecast = formatWeatherForecast(
        dailyForecasts, 
        `${forecastData[0]?.lat.toFixed(4)}, ${forecastData[0]?.lon.toFixed(4)}`,
        args.units
      );
      
      return {
        content: [
          {
            type: "text",
            text: formattedForecast
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get weather forecast", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('city not found')) {
          throw new Error(`Location "${args.location}" not found. Please check the spelling or try using coordinates.`);
        }
        if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenWeatherMap API key. Please check your configuration.');
        }
      }
      
      throw new Error(`Failed to get weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// OneCall Weather Tool
server.addTool({
  name: "get-onecall-weather",
  description: "Get comprehensive weather data (current + 7-day forecast)",
  parameters: getOneCallWeatherSchema,
  execute: async (args, { log }) => {
    try {
      log.info("Getting OneCall weather data", { 
        latitude: args.latitude,
        longitude: args.longitude 
      });
      
      // TODO: Implement OneCall fetching logic
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ 
              message: "OneCall weather tool not yet implemented",
              latitude: args.latitude,
              longitude: args.longitude,
              units: args.units,
              exclude: args.exclude
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get OneCall weather", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error(`Failed to get OneCall weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Air Pollution Tool
server.addTool({
  name: "get-air-pollution",
  description: "Get air quality index and pollution data",
  parameters: getAirPollutionSchema,
  execute: async (args, { log }) => {
    try {
      log.info("Getting air pollution data", { 
        latitude: args.latitude,
        longitude: args.longitude 
      });
      
      // TODO: Implement air pollution fetching logic
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ 
              message: "Air pollution tool not yet implemented",
              latitude: args.latitude,
              longitude: args.longitude
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get air pollution data", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error(`Failed to get air pollution data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Geocoding Tool
server.addTool({
  name: "geocode-location",
  description: "Convert location name to coordinates or vice versa",
  parameters: geocodeLocationSchema,
  execute: async (args, { log }) => {
    try {
      log.info("Geocoding location", { 
        query: args.query,
        limit: args.limit 
      });
      
      // TODO: Implement geocoding logic
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ 
              message: "Geocoding tool not yet implemented",
              query: args.query,
              limit: args.limit
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      log.error("Failed to geocode location", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error(`Failed to geocode location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Add documentation resource
server.addResource({
  uri: "openweather://api/docs",
  name: "OpenWeatherMap API Documentation",
  description: "Documentation for available weather data endpoints and response formats",
  mimeType: "text/markdown",
  load: async () => {
    return {
      text: `# OpenWeatherMap MCP Server Documentation

## Overview
This MCP server provides access to the OpenWeatherMap API for weather data and forecasts.
Authentication is handled server-side using environment variables.

## Authentication
The server authenticates to OpenWeatherMap using environment variables:
- \`OPENWEATHER_API_KEY\`: Your OpenWeatherMap API key (required)

Authentication happens automatically on server startup. No client-side authentication is required.

## Available Tools

### Weather Operations
- **get-current-weather**: Get current weather conditions
  - Parameters: 
    - \`location\` (required): City name or coordinates
    - \`units\` (optional): Temperature units (metric/imperial/standard)
  - Returns: Current weather data

- **get-weather-forecast**: Get weather forecast for up to 5 days
  - Parameters:
    - \`location\` (required): City name or coordinates
    - \`units\` (optional): Temperature units (metric/imperial/standard)
    - \`days\` (optional): Number of days (1-5)
  - Returns: Hourly forecast data

- **get-onecall-weather**: Get comprehensive weather data
  - Parameters:
    - \`latitude\` (required): Latitude coordinate
    - \`longitude\` (required): Longitude coordinate
    - \`units\` (optional): Temperature units (metric/imperial/standard)
    - \`exclude\` (optional): Data to exclude
  - Returns: Complete weather data

### Air Quality Operations
- **get-air-pollution**: Get air quality index and pollution data
  - Parameters:
    - \`latitude\` (required): Latitude coordinate
    - \`longitude\` (required): Longitude coordinate
  - Returns: Air quality data

### Geocoding Operations
- **geocode-location**: Convert location names to coordinates
  - Parameters:
    - \`query\` (required): Location name or zip code
    - \`limit\` (optional): Maximum results (default: 5)
  - Returns: Array of matching locations

## Error Handling
- All operations require valid OpenWeatherMap authentication
- Invalid locations will return validation errors
- Network errors are handled gracefully with descriptive messages
- Server maintains session state across tool calls

## Environment Setup
Required environment variables:
- \`OPENWEATHER_API_KEY\`: OpenWeatherMap API key (used for both API access and HTTP stream authentication)
- \`PORT\`: Server port (default: 3000, for HTTP transport only)
      `.trim()
    };
  }
});

// Log startup information
console.log(`Starting OpenWeatherMap MCP Server with transport: ${transportConfig.transportType}`);
if (transportConfig.transportType === "httpStream") {
  console.log(`HTTP Stream configuration: port=${transportConfig.httpStream?.port}, endpoint=${transportConfig.httpStream?.endpoint}`);
}

// Start server with dynamic transport configuration
async function startServer() {
  // Initialize authentication for stdio
  if (transportConfig.transportType === "stdio") {
    await initializeStdioAuth();
  }

  if (transportConfig.transportType === "httpStream") {
    await server.start({
      transportType: "httpStream",
      httpStream: {
        port: transportConfig.httpStream!.port
      }
    });
    console.log(`OpenWeatherMap MCP Server running on port ${transportConfig.httpStream!.port}`);
    console.log(`HTTP endpoint: ${transportConfig.httpStream!.endpoint}`);
    console.log("Authentication: HTTP Bearer token with OpenWeatherMap API key");
  } else {
    await server.start({
      transportType: "stdio"
    });
    console.log("Server started with stdio transport");
  }
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});