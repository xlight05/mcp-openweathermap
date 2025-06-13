
/**
 * HTTP Stream authenticator for FastMCP
 * Validates the API key from the Authorization header
 */
export async function httpStreamAuthenticator(
  request: any
): Promise<Record<string, any>> {
  const headers = request.headers as Record<string, string | string[] | undefined>;

  // Get authorization header
  const authHeaderValue = headers.authorization || headers.Authorization;
  const authHeader = Array.isArray(authHeaderValue) ? authHeaderValue[0] : authHeaderValue;

  if (!authHeader) {
    throw new Error("Authorization header required. Use Basic Auth with your OpenWeatherMap API key.");
  }

  // Parse Basic Auth
  const [authType, credentials] = authHeader.split(" ");

  if (authType.toLowerCase() !== "basic") {
    throw new Error("Only Basic authentication is supported");
  }

  if (!credentials) {
    throw new Error("Invalid authorization header format");
  }

  // Decode credentials
  const decoded = Buffer.from(credentials, "base64").toString("utf-8");
  const [username, apiKey] = decoded.split(":");

  // For OpenWeatherMap, we only need the API key (can be passed as either username or password)
  const openWeatherApiKey = apiKey || username;

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