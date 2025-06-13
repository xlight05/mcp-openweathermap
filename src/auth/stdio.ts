import type { SessionData } from "./types.js";

// Global session data for stdio transport
let stdioSession: SessionData | null = null;

/**
 * Initialize authentication for stdio transport using environment variables
 * This is called once at server startup
 */
export async function initializeStdioAuth(): Promise<void> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENWEATHER_API_KEY environment variable is required for stdio transport. " +
      "Please set it before starting the server."
    );
  }

  // Validate API key format (basic validation)
  if (apiKey.length < 32) {
    throw new Error("Invalid OPENWEATHER_API_KEY format. Please check your API key.");
  }

  // Store session data
  stdioSession = {
    apiKey,
    authenticatedAt: new Date(),
  };

  console.log("OpenWeatherMap authentication initialized successfully");
}

/**
 * Get the current stdio session
 */
export function getStdioSession(): SessionData | null {
  return stdioSession;
}

/**
 * Clear the stdio session (for testing purposes)
 */
export function clearStdioSession(): void {
  stdioSession = null;
}