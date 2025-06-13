import { z } from "zod";

// Transport configuration schema
const transportConfigSchema = z.object({
  transportType: z.enum(["stdio", "httpStream"]),
  httpStream: z.object({
    port: z.number(),
    endpoint: z.string(),
  }).optional(),
});

export type TransportConfig = z.infer<typeof transportConfigSchema>;

/**
 * Get transport configuration from environment variables
 * Defaults to stdio transport if MCP_TRANSPORT is not set
 */
export function getTransportConfig(): TransportConfig {
  const transportType = process.env.MCP_TRANSPORT || "stdio";

  if (transportType === "httpStream") {
    const port = parseInt(process.env.PORT || "3000", 10);
    const endpoint = process.env.MCP_ENDPOINT || "/mcp";

    const config: TransportConfig = {
      transportType: "httpStream",
      httpStream: {
        port,
        endpoint,
      },
    };

    // Validate configuration
    try {
      return transportConfigSchema.parse(config);
    } catch (error) {
      console.error("Invalid transport configuration:", error);
      throw new Error("Invalid HTTP stream transport configuration");
    }
  }

  // Default to stdio transport
  return {
    transportType: "stdio",
  };
}