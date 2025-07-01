import { z } from "zod";
import { logger } from "../utils/logger.js";

/**
 * Environment configuration schema for HTTP transport settings
 *
 * Validates and parses environment variables for MCP HTTP server configuration.
 * Supports both HTTP and HTTPS modes with security settings.
 */
const environmentConfigSchema = z.object({
  // HTTP Transport Configuration
  mcpHttpEnabled: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val.toLowerCase() === "true")
    .describe("Enable HTTP transport for MCP server"),

  mcpHttpPort: z
    .string()
    .optional()
    .default("3000")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535))
    .describe("HTTP server port (1-65535)"),

  mcpHttpHost: z
    .string()
    .optional()
    .default("localhost")
    .describe("HTTP server host address"),

  // HTTPS Configuration
  mcpHttpsEnabled: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val.toLowerCase() === "true")
    .describe("Enable HTTPS mode for HTTP transport"),

  mcpHttpsCertPath: z
    .string()
    .optional()
    .describe("Path to HTTPS certificate file"),

  mcpHttpsKeyPath: z
    .string()
    .optional()
    .describe("Path to HTTPS private key file"),

  // Security Configuration
  mcpHttpAllowedHosts: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(",").map((h) => h.trim()) : ["127.0.0.1", "localhost"]
    )
    .describe(
      "Comma-separated list of allowed hosts for DNS rebinding protection"
    ),

  mcpHttpAllowedOrigins: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((o) => o.trim()) : []))
    .describe("Comma-separated list of allowed origins for CORS"),
});

/**
 * Type definition for environment configuration
 */
export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;

/**
 * HTTP server configuration interface
 *
 * Provides typed configuration for HTTP transport server initialization
 */
export interface HttpServerConfig {
  /** Whether HTTP transport is enabled */
  enabled: boolean;
  /** HTTP server port */
  port: number;
  /** HTTP server host */
  host: string;
  /** HTTPS configuration */
  https: {
    /** Whether HTTPS is enabled */
    enabled: boolean;
    /** Path to certificate file */
    certPath?: string;
    /** Path to private key file */
    keyPath?: string;
  };
  /** Security configuration */
  security: {
    /** Allowed hosts for DNS rebinding protection */
    allowedHosts: string[];
    /** Allowed origins for CORS */
    allowedOrigins: string[];
  };
}

/**
 * Parses and validates environment variables for HTTP transport configuration
 *
 * @returns Parsed and validated environment configuration
 * @throws Error if environment variables are invalid
 *
 * @example
 * ```typescript
 * const config = parseEnvironmentConfig();
 * if (config.mcpHttpEnabled) {
 *   console.log(`HTTP server will run on ${config.mcpHttpHost}:${config.mcpHttpPort}`);
 * }
 * ```
 */
export function parseEnvironmentConfig(): EnvironmentConfig {
  try {
    const rawConfig = {
      mcpHttpEnabled: process.env.MCP_HTTP_ENABLED,
      mcpHttpPort: process.env.MCP_HTTP_PORT,
      mcpHttpHost: process.env.MCP_HTTP_HOST,
      mcpHttpsEnabled: process.env.MCP_HTTPS_ENABLED,
      mcpHttpsCertPath: process.env.MCP_HTTPS_CERT_PATH,
      mcpHttpsKeyPath: process.env.MCP_HTTPS_KEY_PATH,
      mcpHttpAllowedHosts: process.env.MCP_HTTP_ALLOWED_HOSTS,
      mcpHttpAllowedOrigins: process.env.MCP_HTTP_ALLOWED_ORIGINS,
    };

    logger.debug("Parsing environment configuration", { rawConfig });

    const config = environmentConfigSchema.parse(rawConfig);

    logger.info("Environment configuration parsed successfully", {
      httpEnabled: config.mcpHttpEnabled,
      httpsEnabled: config.mcpHttpsEnabled,
      port: config.mcpHttpPort,
      host: config.mcpHttpHost,
      allowedHosts: config.mcpHttpAllowedHosts,
      allowedOrigins: config.mcpHttpAllowedOrigins,
    });

    return config;
  } catch (error) {
    logger.error("Failed to parse environment configuration", { error });
    throw new Error(
      `Environment configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Converts environment configuration to HTTP server configuration
 *
 * @param envConfig - Environment configuration
 * @returns HTTP server configuration
 *
 * @example
 * ```typescript
 * const envConfig = parseEnvironmentConfig();
 * const httpConfig = getHttpServerConfig(envConfig);
 * ```
 */
export function getHttpServerConfig(
  envConfig: EnvironmentConfig
): HttpServerConfig {
  return {
    enabled: envConfig.mcpHttpEnabled,
    port: envConfig.mcpHttpPort,
    host: envConfig.mcpHttpHost,
    https: {
      enabled: envConfig.mcpHttpsEnabled,
      certPath: envConfig.mcpHttpsCertPath,
      keyPath: envConfig.mcpHttpsKeyPath,
    },
    security: {
      allowedHosts: envConfig.mcpHttpAllowedHosts,
      allowedOrigins: envConfig.mcpHttpAllowedOrigins,
    },
  };
}

/**
 * Validates HTTPS configuration when HTTPS is enabled
 *
 * @param config - HTTP server configuration
 * @throws Error if HTTPS configuration is invalid
 *
 * @example
 * ```typescript
 * const config = getHttpServerConfig(parseEnvironmentConfig());
 * validateHttpsConfig(config);
 * ```
 */
export function validateHttpsConfig(config: HttpServerConfig): void {
  if (!config.https.enabled) {
    return;
  }

  if (!config.https.certPath || !config.https.keyPath) {
    throw new Error(
      "HTTPS is enabled but MCP_HTTPS_CERT_PATH and MCP_HTTPS_KEY_PATH environment variables are required"
    );
  }

  logger.debug("HTTPS configuration validated", {
    certPath: config.https.certPath,
    keyPath: config.https.keyPath,
  });
}
