#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { getTransportConfig } from "./config/transport.js";
import { httpStreamAuthenticator } from "./auth/http.js";
import { initializeStdioAuth } from "./auth/stdio.js";
import { getOpenWeatherClient, configureClientForLocation } from "./utils/client-resolver.js";
import { formatCurrentWeather, formatWeatherForecast, formatHourlyForecast } from "./utils/weather-formatter.js";
import type { SessionData } from "./auth/types.js";
import { 
  getCurrentWeatherSchema, 
  getWeatherForecastSchema,
  getHourlyForecastSchema,
  getDailyForecastSchema,
  getMinutelyForecastSchema,
  getWeatherAlertsSchema,
  getCurrentAirPollutionSchema,
  getLocationInfoSchema,
  getOneCallWeatherSchema,
  getAirPollutionSchema,
  geocodeLocationSchema
} from "./schemas.js";

// Get transport configuration with validation
const transportConfig = getTransportConfig();


const server = new FastMCP({
  name: "OpenWeatherMap MCP Server",
  version: "0.1.3",
  instructions: `
This MCP server provides access to the OpenWeatherMap API for weather data and forecasts.

Available tools:
- Current weather: get current weather conditions for any location
- Weather forecast: get weather forecast for up to 5 days
- Hourly forecast: get hourly weather forecast for up to 48 hours
- Daily forecast: get daily weather forecast for up to 8 days
- Minutely forecast: get minute-by-minute precipitation forecast
- Weather alerts: get active weather alerts and warnings
- Current air pollution: get current air quality data and pollutant levels
- Location info: get location information from coordinates (reverse geocoding)
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
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
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
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
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

// Hourly Weather Forecast Tool
server.addTool({
  name: "get-hourly-forecast",
  description: "Get hourly weather forecast for up to 48 hours",
  parameters: getHourlyForecastSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting hourly weather forecast", { 
        location: args.location,
        hours: args.hours 
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Configure client for this request
      configureClientForLocation(client, args.location, args.units);
      
      // Fetch hourly forecast data
      const requestedHours = args.hours || 48;
      const hourlyData = await client.getHourlyForecast(requestedHours);
      
      log.info("Successfully retrieved hourly weather forecast", { 
        location: args.location,
        entries: hourlyData.length
      });
      
      // Format the response
      const formattedForecast = formatHourlyForecast(
        hourlyData, 
        `${hourlyData[0]?.lat?.toFixed(4)}, ${hourlyData[0]?.lon?.toFixed(4)}` || args.location,
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
      log.error("Failed to get hourly weather forecast", { 
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
      
      throw new Error(`Failed to get hourly weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Daily Forecast Tool
server.addTool({
  name: "get-daily-forecast",
  description: "Get daily weather forecast for up to 8 days",
  parameters: getDailyForecastSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting daily weather forecast", { 
        location: args.location,
        days: args.days,
        include_today: args.include_today
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Configure client for this request
      configureClientForLocation(client, args.location, args.units);
      
      // Fetch daily forecast data
      const includeToday = args.include_today || false;
      const requestedDays = args.days || 8;
      const dailyData = await client.getDailyForecast(requestedDays, includeToday);
      
      log.info("Successfully retrieved daily weather forecast", { 
        location: args.location,
        days: dailyData.length,
        include_today: includeToday
      });
      
      // Format the response
      const formattedForecast = JSON.stringify({
        location: args.location,
        units: args.units || 'metric',
        days_requested: requestedDays,
        includes_today: includeToday,
        forecast: dailyData.map(day => ({
          date: day.dt.toISOString().split('T')[0],
          summary: day.weather.description,
          temperature: {
            min: day.weather.temp.min,
            max: day.weather.temp.max,
            morning: day.weather.temp.morn,
            day: day.weather.temp.day,
            evening: day.weather.temp.eve,
            night: day.weather.temp.night
          },
          feels_like: {
            morning: day.weather.feelsLike.morn,
            day: day.weather.feelsLike.day,
            evening: day.weather.feelsLike.eve,
            night: day.weather.feelsLike.night
          },
          pressure: day.weather.pressure,
          humidity: day.weather.humidity,
          wind: {
            speed: day.weather.wind.speed,
            direction: day.weather.wind.deg,
            gust: day.weather.wind.gust
          },
          clouds: day.weather.clouds,
          precipitation: {
            probability: day.weather.pop,
            rain: day.weather.rain || 0,
            snow: day.weather.snow || 0
          },
          uv_index: day.weather.uvi,
          sunrise: day.astronomical.sunrise.toISOString(),
          sunset: day.astronomical.sunset.toISOString(),
          moonrise: day.astronomical.moonrise.toISOString(),
          moonset: day.astronomical.moonset.toISOString(),
          moon_phase: day.astronomical.moonPhase
        }))
      }, null, 2);
      
      return {
        content: [
          {
            type: "text",
            text: formattedForecast
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get daily weather forecast", { 
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
      
      throw new Error(`Failed to get daily weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Minutely Forecast Tool
server.addTool({
  name: "get-minutely-forecast",
  description: "Get minute-by-minute precipitation forecast for next hour",
  parameters: getMinutelyForecastSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting minutely weather forecast", { 
        location: args.location,
        limit: args.limit
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Configure client for this request
      configureClientForLocation(client, args.location);
      
      // Fetch minutely forecast data
      const requestedMinutes = args.limit || 60;
      const minutelyData = await client.getMinutelyForecast(requestedMinutes);
      
      log.info("Successfully retrieved minutely weather forecast", { 
        location: args.location,
        minutes: minutelyData.length
      });
      
      // Format the response
      const formattedForecast = JSON.stringify({
        location: args.location,
        minutes_requested: requestedMinutes,
        forecast: minutelyData.map((minute, index) => ({
          minute_offset: index + 1,
          time: minute.dt.toISOString(),
          precipitation: minute.weather.rain,
          precipitation_description: minute.weather.rain > 0 ? 
            (minute.weather.rain < 0.1 ? 'Light rain' : 
             minute.weather.rain < 0.5 ? 'Moderate rain' : 'Heavy rain') : 'No precipitation'
        }))
      }, null, 2);
      
      return {
        content: [
          {
            type: "text",
            text: formattedForecast
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get minutely weather forecast", { 
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
      
      throw new Error(`Failed to get minutely weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Weather Alerts Tool
server.addTool({
  name: "get-weather-alerts",
  description: "Get active weather alerts and warnings",
  parameters: getWeatherAlertsSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting weather alerts", { 
        location: args.location
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Configure client for this request
      configureClientForLocation(client, args.location);
      
      // Fetch alerts data
      const alertsData = await client.getAlerts();
      
      log.info("Successfully retrieved weather alerts", { 
        location: args.location,
        alerts_count: alertsData.length
      });
      
      // Format the response
      const formattedAlerts = JSON.stringify({
        location: args.location,
        alerts_count: alertsData.length,
        alerts: alertsData.map(alert => ({
          sender: alert.sender_name,
          event: alert.event,
          start_time: new Date(alert.start * 1000).toISOString(),
          end_time: new Date(alert.end * 1000).toISOString(),
          description: alert.description,
          tags: alert.tags,
          severity: alert.tags.includes('severe') || alert.tags.includes('extreme') ? 'High' : 
                   alert.tags.includes('moderate') ? 'Medium' : 'Low'
        }))
      }, null, 2);
      
      return {
        content: [
          {
            type: "text",
            text: formattedAlerts
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get weather alerts", { 
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
      
      throw new Error(`Failed to get weather alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Current Air Pollution Tool
server.addTool({
  name: "get-current-air-pollution",
  description: "Get current air quality data",
  parameters: getCurrentAirPollutionSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting current air pollution", { 
        location: args.location
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Configure client for this request
      configureClientForLocation(client, args.location);
      
      // Fetch current air pollution data
      const pollutionData = await client.getCurrentAirPollution();
      
      log.info("Successfully retrieved current air pollution", { 
        location: args.location,
        aqi: pollutionData.aqi
      });
      
      // Format the response
      const formattedPollution = JSON.stringify({
        location: args.location,
        coordinates: {
          latitude: pollutionData.lat,
          longitude: pollutionData.lon
        },
        air_quality: {
          index: pollutionData.aqi,
          description: pollutionData.aqiName,
          scale: "1 (Good) to 5 (Very Poor)"
        },
        pollutants: {
          carbon_monoxide: {
            value: pollutionData.components.co,
            unit: "μg/m³",
            description: "Carbon monoxide"
          },
          nitrogen_monoxide: {
            value: pollutionData.components.no,
            unit: "μg/m³",
            description: "Nitrogen monoxide"
          },
          nitrogen_dioxide: {
            value: pollutionData.components.no2,
            unit: "μg/m³",
            description: "Nitrogen dioxide"
          },
          ozone: {
            value: pollutionData.components.o3,
            unit: "μg/m³",
            description: "Ozone"
          },
          sulphur_dioxide: {
            value: pollutionData.components.so2,
            unit: "μg/m³",
            description: "Sulphur dioxide"
          },
          pm2_5: {
            value: pollutionData.components.pm2_5,
            unit: "μg/m³",
            description: "Fine particles matter"
          },
          pm10: {
            value: pollutionData.components.pm10,
            unit: "μg/m³",
            description: "Coarse particulate matter"
          },
          ammonia: {
            value: pollutionData.components.nh3,
            unit: "μg/m³",
            description: "Ammonia"
          }
        },
        timestamp: pollutionData.dt.toISOString()
      }, null, 2);
      
      return {
        content: [
          {
            type: "text",
            text: formattedPollution
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get current air pollution", { 
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
      
      throw new Error(`Failed to get current air pollution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Location Info Tool (Reverse Geocoding)
server.addTool({
  name: "get-location-info",
  description: "Get location information from coordinates (reverse geocoding)",
  parameters: getLocationInfoSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting location info", { 
        latitude: args.latitude,
        longitude: args.longitude
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Set coordinates directly for reverse geocoding
      client.setLocationByCoordinates(args.latitude, args.longitude);
      
      // Fetch location data using reverse geocoding
      const locationData = await client.getLocation();
      
      log.info("Successfully retrieved location info", { 
        latitude: args.latitude,
        longitude: args.longitude,
        location_name: locationData?.name
      });
      
      // Format the response
      const formattedLocation = JSON.stringify({
        coordinates: {
          latitude: args.latitude,
          longitude: args.longitude
        },
        location: locationData ? {
          name: locationData.name,
          country: locationData.country,
          state: locationData.state,
          local_names: locationData.local_names
        } : {
          message: "No location data found for these coordinates"
        }
      }, null, 2);
      
      return {
        content: [
          {
            type: "text",
            text: formattedLocation
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get location info", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid coordinates')) {
          throw new Error(`Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180.`);
        }
        if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenWeatherMap API key. Please check your configuration.');
        }
      }
      
      throw new Error(`Failed to get location info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// OneCall Weather Tool
server.addTool({
  name: "get-onecall-weather",
  description: "Get comprehensive weather data (current + 7-day forecast)",
  parameters: getOneCallWeatherSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting OneCall weather data", { 
        latitude: args.latitude,
        longitude: args.longitude 
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Set coordinates for OneCall API
      client.setLocationByCoordinates(args.latitude, args.longitude);
      
      // Set units if provided
      if (args.units) {
        client.setUnits(args.units);
      }
      
      // Fetch comprehensive weather data
      const weatherData = await client.getEverything();
      
      log.info("Successfully retrieved OneCall weather data", { 
        latitude: args.latitude,
        longitude: args.longitude,
        has_current: !!weatherData.current,
        daily_count: weatherData.daily?.length || 0,
        hourly_count: weatherData.hourly?.length || 0
      });
      
      // Format the comprehensive response
      const formattedData = {
        location: {
          latitude: args.latitude,
          longitude: args.longitude,
          timezone: weatherData.timezone,
          timezone_offset: weatherData.timezoneOffset
        },
        current: weatherData.current ? {
          datetime: weatherData.current.dt.toISOString(),
          temperature: weatherData.current.weather.temp.cur,
          feels_like: weatherData.current.weather.feelsLike.cur,
          pressure: weatherData.current.weather.pressure,
          humidity: weatherData.current.weather.humidity,
          dew_point: weatherData.current.weather.dewPoint,
          uv_index: weatherData.current.weather.uvi,
          clouds: weatherData.current.weather.clouds,
          visibility: weatherData.current.weather.visibility,
          wind: {
            speed: weatherData.current.weather.wind.speed,
            direction: weatherData.current.weather.wind.deg,
            gust: weatherData.current.weather.wind.gust
          },
          weather: {
            main: weatherData.current.weather.main,
            description: weatherData.current.weather.description,
            icon: weatherData.current.weather.icon
          },
          rain: weatherData.current.weather.rain,
          snow: weatherData.current.weather.snow
        } : null,
        minutely: weatherData.minutely?.slice(0, 60).map((minute, index) => ({
          minute_offset: index + 1,
          time: minute.dt.toISOString(),
          precipitation: minute.weather.rain
        })) || [],
        hourly: weatherData.hourly?.slice(0, 48).map(hour => ({
          datetime: hour.dt.toISOString(),
          temperature: hour.weather.temp.cur,
          feels_like: hour.weather.feelsLike.cur,
          pressure: hour.weather.pressure,
          humidity: hour.weather.humidity,
          dew_point: hour.weather.dewPoint,
          uv_index: hour.weather.uvi,
          clouds: hour.weather.clouds,
          visibility: hour.weather.visibility,
          wind: {
            speed: hour.weather.wind.speed,
            direction: hour.weather.wind.deg,
            gust: hour.weather.wind.gust
          },
          weather: {
            main: hour.weather.main,
            description: hour.weather.description,
            icon: hour.weather.icon
          },
          precipitation_probability: hour.weather.pop,
          rain: hour.weather.rain,
          snow: hour.weather.snow
        })) || [],
        daily: weatherData.daily?.slice(0, 7).map(day => ({
          date: day.dt.toISOString().split('T')[0],
          temperature: {
            min: day.weather.temp.min,
            max: day.weather.temp.max,
            morning: day.weather.temp.morn,
            day: day.weather.temp.day,
            evening: day.weather.temp.eve,
            night: day.weather.temp.night
          },
          feels_like: {
            morning: day.weather.feelsLike.morn,
            day: day.weather.feelsLike.day,
            evening: day.weather.feelsLike.eve,
            night: day.weather.feelsLike.night
          },
          pressure: day.weather.pressure,
          humidity: day.weather.humidity,
          dew_point: day.weather.dewPoint,
          wind: {
            speed: day.weather.wind.speed,
            direction: day.weather.wind.deg,
            gust: day.weather.wind.gust
          },
          weather: {
            main: day.weather.main,
            description: day.weather.description,
            icon: day.weather.icon
          },
          clouds: day.weather.clouds,
          precipitation_probability: day.weather.pop,
          rain: day.weather.rain,
          snow: day.weather.snow,
          uv_index: day.weather.uvi,
          moon_phase: day.astronomical.moonPhase,
          sunrise: day.astronomical.sunrise.toISOString(),
          sunset: day.astronomical.sunset.toISOString()
        })) || [],
        alerts: weatherData.alerts?.map(alert => ({
          sender: alert.sender_name,
          event: alert.event,
          start_time: new Date(alert.start * 1000).toISOString(),
          end_time: new Date(alert.end * 1000).toISOString(),
          description: alert.description,
          tags: alert.tags
        })) || []
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedData, null, 2)
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get OneCall weather", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid coordinates')) {
          throw new Error(`Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180.`);
        }
        if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenWeatherMap API key. Please check your configuration.');
        }
      }
      
      throw new Error(`Failed to get OneCall weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Air Pollution Tool
server.addTool({
  name: "get-air-pollution",
  description: "Get air quality index and pollution data",
  parameters: getAirPollutionSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Getting air pollution data", { 
        latitude: args.latitude,
        longitude: args.longitude 
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Set coordinates for air pollution API
      client.setLocationByCoordinates(args.latitude, args.longitude);
      
      // Fetch forecasted air pollution data (includes current + forecast)
      const pollutionData = await client.getForecastedAirPollution();
      
      log.info("Successfully retrieved air pollution data", { 
        latitude: args.latitude,
        longitude: args.longitude,
        data_points: pollutionData.length
      });
      
      // Format the response with current and forecast data
      const formattedData = {
        location: {
          latitude: args.latitude,
          longitude: args.longitude
        },
        current: pollutionData.length > 0 ? {
          datetime: pollutionData[0].dt.toISOString(),
          air_quality_index: pollutionData[0].aqi,
          air_quality_description: pollutionData[0].aqiName,
          pollutants: {
            carbon_monoxide: {
              value: pollutionData[0].components.co,
              unit: "μg/m³",
              description: "Carbon monoxide"
            },
            nitrogen_monoxide: {
              value: pollutionData[0].components.no,
              unit: "μg/m³",
              description: "Nitrogen monoxide"
            },
            nitrogen_dioxide: {
              value: pollutionData[0].components.no2,
              unit: "μg/m³",
              description: "Nitrogen dioxide"
            },
            ozone: {
              value: pollutionData[0].components.o3,
              unit: "μg/m³",
              description: "Ozone"
            },
            sulphur_dioxide: {
              value: pollutionData[0].components.so2,
              unit: "μg/m³",
              description: "Sulphur dioxide"
            },
            pm2_5: {
              value: pollutionData[0].components.pm2_5,
              unit: "μg/m³",
              description: "Fine particles matter"
            },
            pm10: {
              value: pollutionData[0].components.pm10,
              unit: "μg/m³",
              description: "Coarse particulate matter"
            },
            ammonia: {
              value: pollutionData[0].components.nh3,
              unit: "μg/m³",
              description: "Ammonia"
            }
          }
        } : null,
        forecast: pollutionData.slice(1).map(data => ({
          datetime: data.dt.toISOString(),
          air_quality_index: data.aqi,
          air_quality_description: data.aqiName,
          pollutants: {
            carbon_monoxide: data.components.co,
            nitrogen_monoxide: data.components.no,
            nitrogen_dioxide: data.components.no2,
            ozone: data.components.o3,
            sulphur_dioxide: data.components.so2,
            pm2_5: data.components.pm2_5,
            pm10: data.components.pm10,
            ammonia: data.components.nh3
          }
        })),
        air_quality_scale: "1 (Good) to 5 (Very Poor)",
        units: "μg/m³ (micrograms per cubic meter)"
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedData, null, 2)
          }
        ]
      };
    } catch (error) {
      log.error("Failed to get air pollution data", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid coordinates')) {
          throw new Error(`Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180.`);
        }
        if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenWeatherMap API key. Please check your configuration.');
        }
      }
      
      throw new Error(`Failed to get air pollution data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Geocoding Tool
server.addTool({
  name: "geocode-location",
  description: "Convert location name to coordinates or vice versa",
  parameters: geocodeLocationSchema,
  execute: async (args, { session, log }) => {
    try {
      log.info("Geocoding location", { 
        query: args.query,
        limit: args.limit 
      });
      
      // Get OpenWeather client
      const client = getOpenWeatherClient(session as SessionData | undefined);
      
      // Set location by the query (could be city name, zip code, etc.)
      client.setLocationByName(args.query);
      
      // Get all matching locations up to the specified limit
      const limit = args.limit || 5;
      const locations = await client.getAllLocations(limit.toString());
      
      log.info("Successfully retrieved geocoding results", { 
        query: args.query,
        results_count: locations.length,
        limit: limit
      });
      
      // Format the response with all matching locations
      const formattedData = {
        query: args.query,
        limit: limit,
        results_count: locations.length,
        locations: locations.map(location => ({
          name: location.name,
          local_names: location.local_names || {},
          coordinates: {
            latitude: location.lat,
            longitude: location.lon
          },
          country: location.country,
          state: location.state || null,
          formatted_address: [
            location.name,
            location.state,
            location.country
          ].filter(Boolean).join(', ')
        }))
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedData, null, 2)
          }
        ]
      };
    } catch (error) {
      log.error("Failed to geocode location", { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('city not found')) {
          throw new Error(`Location "${args.query}" not found. Please check the spelling or try a different location name.`);
        }
        if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid OpenWeatherMap API key. Please check your configuration.');
        }
      }
      
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
  - Returns: Daily forecast data

- **get-hourly-forecast**: Get hourly weather forecast for up to 48 hours
  - Parameters:
    - \`location\` (required): City name or coordinates
    - \`units\` (optional): Temperature units (metric/imperial/standard)
    - \`hours\` (optional): Number of hours (1-48)
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

// Start server with dynamic transport configuration
async function startServer() {
  // Initialize authentication for stdio
  if (transportConfig.transportType === "stdio") {
    await initializeStdioAuth();
  }

  if (transportConfig.transportType === "httpStream") {
    // Log startup information
    console.log(`HTTP Stream configuration: port=${transportConfig.httpStream?.port}, endpoint=${transportConfig.httpStream?.endpoint}`);

    await server.start({
      transportType: "httpStream",
      httpStream: {
        port: transportConfig.httpStream!.port
      }
    });

    console.log(`OpenWeatherMap MCP Server running on port ${transportConfig.httpStream!.port}`);
    console.log(`HTTP endpoint: ${transportConfig.httpStream!.endpoint}`);
    console.log("Authentication: OPENWEATHER_API_KEY environment variable");
  } else {
    await server.start({
      transportType: "stdio"
    });
  }
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
