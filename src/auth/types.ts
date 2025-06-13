/**
 * Session data structure for authenticated requests
 */
export interface SessionData {
  apiKey: string;
  authenticatedAt: Date;
}

/**
 * Authentication result structure
 */
export interface AuthResult {
  success: boolean;
  session?: SessionData;
  error?: string;
}