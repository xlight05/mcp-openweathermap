import { z } from "zod";

/**
 * Common Schemas
 */

// Temperature units schema
export const unitsSchema = z.enum(["metric", "imperial", "standard"]).optional()
  .describe("Temperature units: metric (Celsius), imperial (Fahrenheit), or standard (Kelvin)");

/**
 * Weather Operation Schemas
 */

// Get current weather parameters
export const getCurrentWeatherSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
  units: unitsSchema,
});

// Get weather forecast parameters
export const getWeatherForecastSchema = z.object({
  location: z.string().describe("City name (e.g., 'New York') or coordinates (e.g., 'lat,lon')"),
  units: unitsSchema,
  days: z.number().min(1).max(5).optional().describe("Number of days to forecast (1-5, default: 5)"),
});

// OneCall exclude options
export const oneCallExcludeSchema = z.array(
  z.enum(["current", "minutely", "hourly", "daily", "alerts"])
).optional().describe("Parts of weather data to exclude from the response");

// Get OneCall weather parameters
export const getOneCallWeatherSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
  longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),
  units: unitsSchema,
  exclude: oneCallExcludeSchema,
});

/**
 * Air Quality Operation Schemas
 */

// Get air pollution parameters
export const getAirPollutionSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
  longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),
});

/**
 * Geocoding Operation Schemas
 */

// Geocode location parameters
export const geocodeLocationSchema = z.object({
  query: z.string().describe("Location name, zip code, or address to geocode"),
  limit: z.number().min(1).max(10).optional().describe("Maximum number of results to return (default: 5)"),
});

/**
 * Response Type Schemas (for validation and documentation)
 */

// Weather condition schema
export const weatherConditionSchema = z.object({
  id: z.number(),
  main: z.string(),
  description: z.string(),
  icon: z.string(),
});

// Temperature data schema
export const temperatureSchema = z.object({
  temp: z.number(),
  feels_like: z.number(),
  temp_min: z.number(),
  temp_max: z.number(),
  pressure: z.number(),
  humidity: z.number(),
});

// Wind data schema
export const windSchema = z.object({
  speed: z.number(),
  deg: z.number(),
  gust: z.number().optional(),
});

// Current weather response schema
export const currentWeatherResponseSchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  weather: z.array(weatherConditionSchema),
  main: temperatureSchema,
  wind: windSchema,
  visibility: z.number(),
  dt: z.number(),
  timezone: z.number(),
  name: z.string(),
  cod: z.number(),
});

// Air quality component schema
export const airQualityComponentSchema = z.object({
  co: z.number(),
  no: z.number(),
  no2: z.number(),
  o3: z.number(),
  so2: z.number(),
  pm2_5: z.number(),
  pm10: z.number(),
  nh3: z.number(),
});

// Air quality response schema
export const airPollutionResponseSchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  list: z.array(z.object({
    main: z.object({
      aqi: z.number().min(1).max(5),
    }),
    components: airQualityComponentSchema,
    dt: z.number(),
  })),
});

// Geocoding result schema
export const geocodingResultSchema = z.object({
  name: z.string(),
  local_names: z.record(z.string()).optional(),
  lat: z.number(),
  lon: z.number(),
  country: z.string(),
  state: z.string().optional(),
});

/**
 * Error Response Schema
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

/**
 * Type Exports (for use in tools)
 */
export type Units = z.infer<typeof unitsSchema>;
export type OneCallExclude = z.infer<typeof oneCallExcludeSchema>;

export type GetCurrentWeatherInput = z.infer<typeof getCurrentWeatherSchema>;
export type GetWeatherForecastInput = z.infer<typeof getWeatherForecastSchema>;
export type GetOneCallWeatherInput = z.infer<typeof getOneCallWeatherSchema>;
export type GetAirPollutionInput = z.infer<typeof getAirPollutionSchema>;
export type GeocodeLocationInput = z.infer<typeof geocodeLocationSchema>;

export type CurrentWeatherResponse = z.infer<typeof currentWeatherResponseSchema>;
export type AirPollutionResponse = z.infer<typeof airPollutionResponseSchema>;
export type GeocodingResult = z.infer<typeof geocodingResultSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;