import OpenWeatherAPI from "openweather-api-node";
import type { SessionData } from "../auth/types.js";
import { getStdioSession } from "../auth/stdio.js";
import { parseLocation } from "./location-parser.js";
import type { Units } from "../schemas.js";

// Cache of OpenWeatherAPI clients by API key
const clientCache = new Map<string, OpenWeatherAPI>();

/**
 * Get or create an OpenWeatherAPI client for the given session
 * @param session - Session data from HTTP auth, or null/undefined for stdio
 * @returns Configured OpenWeatherAPI client
 */
export function getOpenWeatherClient(session: SessionData | null | undefined): OpenWeatherAPI {
  // For stdio transport, use the global session
  const effectiveSession = session || getStdioSession();

  if (!effectiveSession) {
    throw new Error("No authentication session available");
  }

  const { apiKey } = effectiveSession;

  // Check cache first
  let client = clientCache.get(apiKey);
  
  if (!client) {
    // Create new client
    client = new OpenWeatherAPI({
      key: apiKey,
      // Default to metric units, can be overridden per request
      units: "metric"
    });

    // Cache the client
    clientCache.set(apiKey, client);
  }

  return client;
}

/**
 * Configure client for a specific request
 * @param client - OpenWeatherAPI client instance
 * @param location - Location string to parse
 * @param units - Temperature units
 */
export function configureClientForLocation(
  client: OpenWeatherAPI, 
  location: string, 
  units?: Units
): OpenWeatherAPI {
  // Parse location
  const parsed = parseLocation(location);
  
  // Set location based on type
  if (parsed.type === 'coordinates' && parsed.latitude && parsed.longitude) {
    client.setLocationByCoordinates(parsed.latitude, parsed.longitude);
  } else if (parsed.type === 'city' && parsed.city) {
    client.setLocationByName(parsed.city);
  } else {
    throw new Error("Invalid location format");
  }
  
  // Set units if provided
  if (units) {
    client.setUnits(units);
  }
  
  return client;
}

/**
 * Clear the client cache (useful for testing)
 */
export function clearClientCache(): void {
  clientCache.clear();
}