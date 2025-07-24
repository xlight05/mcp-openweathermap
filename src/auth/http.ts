
/**
 * HTTP Stream authenticator for FastMCP
 * Uses the OpenWeatherMap API key from environment variables
 * Makes HTTP calls unauthenticated by reading from OPENWEATHER_API_KEY env var
 */
export async function httpStreamAuthenticator(
  _request: any
): Promise<Record<string, any>> {
  // Get API key from environment variable (same as stdio)
  const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;

  if (!openWeatherApiKey) {
    throw new Error(
      "OPENWEATHER_API_KEY environment variable is required for HTTP stream transport. " +
      "Please set it before starting the server."
    );
  }

  // Validate API key format (basic validation)
  if (openWeatherApiKey.length < 32) {
    throw new Error("Invalid OPENWEATHER_API_KEY format. Please check your API key.");
  }

  // Return session data
  return {
    apiKey: openWeatherApiKey,
    authenticatedAt: new Date(),
  };
}
