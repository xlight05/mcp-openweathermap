
/**
 * HTTP Stream authenticator for FastMCP
 * Validates the OpenWeatherMap API key from the Authorization Bearer token
 */
export async function httpStreamAuthenticator(
  request: any
): Promise<Record<string, any>> {
  const headers = request.headers as Record<string, string | string[] | undefined>;

  // Get authorization header
  const authHeaderValue = headers.authorization || headers.Authorization;
  const authHeader = Array.isArray(authHeaderValue) ? authHeaderValue[0] : authHeaderValue;

  if (!authHeader) {
    throw new Error("Authorization header required. Use Bearer token with your OpenWeatherMap API key.");
  }

  // Parse Bearer token
  const [authType, apiKey] = authHeader.split(" ");

  if (authType.toLowerCase() !== "bearer") {
    throw new Error("Only Bearer token authentication is supported");
  }

  if (!apiKey) {
    throw new Error("Invalid authorization header format");
  }

  const openWeatherApiKey = apiKey;

  if (!openWeatherApiKey) {
    throw new Error("OpenWeatherMap API key is required");
  }

  // Validate API key format (basic validation)
  if (openWeatherApiKey.length < 32) {
    throw new Error("Invalid OpenWeatherMap API key format");
  }

  // Return session data
  return {
    apiKey: openWeatherApiKey,
    authenticatedAt: new Date(),
  };
}