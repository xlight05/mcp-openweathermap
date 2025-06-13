/**
 * Parse location input to determine if it's coordinates or a city name
 */
export interface ParsedLocation {
  type: 'coordinates' | 'city';
  latitude?: number;
  longitude?: number;
  city?: string;
}

/**
 * Parse a location string into coordinates or city name
 * Supports formats:
 * - "New York" (city name)
 * - "New York, US" (city with country code)
 * - "40.7128,-74.0060" (coordinates)
 * - "lat:40.7128,lon:-74.0060" (explicit coordinates)
 */
export function parseLocation(location: string): ParsedLocation {
  // Trim whitespace
  const trimmed = location.trim();
  
  // Check for explicit coordinate format
  const explicitCoordMatch = trimmed.match(/lat[:\s]*(-?\d+\.?\d*)[,\s]+lon[:\s]*(-?\d+\.?\d*)/i);
  if (explicitCoordMatch) {
    const latitude = parseFloat(explicitCoordMatch[1]);
    const longitude = parseFloat(explicitCoordMatch[2]);
    
    if (isValidCoordinate(latitude, longitude)) {
      return { type: 'coordinates', latitude, longitude };
    }
  }
  
  // Check for comma-separated coordinates
  const coordMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const latitude = parseFloat(coordMatch[1]);
    const longitude = parseFloat(coordMatch[2]);
    
    if (isValidCoordinate(latitude, longitude)) {
      return { type: 'coordinates', latitude, longitude };
    }
  }
  
  // Otherwise, treat as city name
  return { type: 'city', city: trimmed };
}

/**
 * Validate if the given values are valid coordinates
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Format location for display
 */
export function formatLocation(location: ParsedLocation): string {
  if (location.type === 'coordinates') {
    return `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`;
  }
  return location.city || 'Unknown location';
}