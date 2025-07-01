import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SerperService } from "./services/serper-service.js";
import {
  SerperApiError,
  SerperConfigurationError,
} from "./types/serper-errors.js";
import { logger, logError } from "./utils/logger.js";
import { getPromptTemplateContent } from "./resources/prompt-template-content.js";
import { validateQuoteParameters } from "./utils/parameter-validator.js";
import { HttpTransportService } from "./services/http-transport-service.js";
import {
  parseEnvironmentConfig,
  getHttpServerConfig,
} from "./config/environment-config.js";

/**
 * Main MCP Quotes Server
 *
 * This server provides quote-related tools and resources via the Model Context Protocol (MCP).
 * It uses stdio transport for communication with MCP clients.
 */

/**
 * Creates a new MCP server instance with the specified configuration
 *
 * @returns A new McpServer instance configured for the quotes server
 * @example
 * ```typescript
 * const server = createServer();
 * ```
 */
export function createServer(): McpServer {
  return new McpServer({
    name: "mcp-quotes-server",
    version: "1.0.0",
  });
}

/**
 * Registers all tools on the provided server
 *
 * Currently registers the `get_quote` tool which allows retrieval of quotes
 * from specified persons with optional topic filtering and multiple quote support.
 *
 * @param server - The MCP server instance to register tools on
 * @example
 * ```typescript
 * const server = createServer();
 * registerTools(server);
 * ```
 */
export function registerTools(server: McpServer): void {
  server.registerTool(
    "get_quote",
    {
      title: "Get Quote",
      description:
        "Retrieves one or more quotes from a specified person or topic using Serper.dev API. Supports retrieving 1-10 quotes per request.",
      inputSchema: {
        person: z
          .string()
          .describe("The name of the person to get a quote from"),
        topic: z
          .string()
          .optional()
          .describe("Optional topic to filter quotes by"),
        numberOfQuotes: z
          .number()
          .int()
          .min(1)
          .max(10)
          .describe("Number of quotes to retrieve (1-10)")
          .default(1),
      },
    },
    async ({ person, topic, numberOfQuotes = 1 }) => {
      try {
        // Validate parameters using the validation utility
        const validationResult = validateQuoteParameters({
          person,
          topic,
          numberOfQuotes,
        });

        if (!validationResult.success) {
          logger.warn("Parameter validation failed for get_quote tool", {
            errors: validationResult.errors,
            rawParams: { person, topic, numberOfQuotes },
          });

          return {
            content: [
              {
                type: "text",
                text: `Validation Error: ${validationResult.errors.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Get API key from environment
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) {
          logger.error("SERPER_API_KEY environment variable not set");
          return {
            content: [
              {
                type: "text",
                text: "Error: SERPER_API_KEY environment variable is not configured. Please set your Serper.dev API key.",
              },
            ],
            isError: true,
          };
        }

        // Use validated parameters
        const {
          person: validatedPerson,
          topic: validatedTopic,
          numberOfQuotes: validatedNumberOfQuotes,
        } = validationResult.data;

        // Create SerperService instance and get quotes
        const serperService = new SerperService(apiKey);
        const quote = await serperService.getQuote(
          { person: validatedPerson, topic: validatedTopic },
          validatedNumberOfQuotes
        );

        logger.info("Quote(s) retrieved successfully", {
          person: validatedPerson,
          topic: validatedTopic,
          numberOfQuotes: validatedNumberOfQuotes,
          quoteLength: quote.length,
        });

        return {
          content: [
            {
              type: "text",
              text: quote,
            },
          ],
        };
      } catch (error) {
        if (error instanceof SerperConfigurationError) {
          logError("SerperService configuration error", error, {
            person,
            topic,
            numberOfQuotes,
          });
          return {
            content: [
              {
                type: "text",
                text: `Configuration Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }

        if (error instanceof SerperApiError) {
          logError("SerperService API error", error, {
            person,
            topic,
            numberOfQuotes,
            statusCode: error.statusCode,
          });
          return {
            content: [
              {
                type: "text",
                text: `API Error: ${error.message}. Please try again later.`,
              },
            ],
            isError: true,
          };
        }

        // Handle unexpected errors
        logError("Unexpected error in get_quote tool", error as Error, {
          person,
          topic,
          numberOfQuotes,
        });
        return {
          content: [
            {
              type: "text",
              text: "An unexpected error occurred while retrieving the quote(s). Please try again later.",
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Registers all resources on the provided server
 *
 * This function registers the Prompt Template Resource as defined in ADR 004,
 * making it accessible via the MCP protocol at a static URI.
 *
 * @param server - The MCP server instance to register resources on
 *
 * @example
 * ```typescript
 * const server = createServer();
 * registerResources(server);
 * ```
 */
export function registerResources(server: McpServer): void {
  logger.debug("Registering MCP resources...");

  try {
    // Register the prompt template resource with static URI
    server.registerResource(
      "prompt-template",
      "prompt-template://quote-request",
      {
        title: "Quote Request Prompt Template",
        description:
          "Structured template for generating prompts related to quote requests, including parameter specifications and usage examples",
        mimeType: "application/json",
      },
      async (uri: URL) => {
        logger.debug("Prompt template resource accessed", { uri: uri.href });

        const content = getPromptTemplateContent();

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(content, null, 2),
              mimeType: "application/json",
            },
          ],
        };
      }
    );

    logger.info("MCP resources registered successfully", {
      resources: ["prompt-template://quote-request"],
    });
  } catch (error) {
    logError("Failed to register MCP resources", error as Error);
    throw new Error(
      `Resource registration failed: ${(error as Error).message}`
    );
  }
}

/**
 * Creates a stdio transport for the server
 *
 * This function creates and returns a new StdioServerTransport instance
 * for handling MCP communication over standard input/output streams.
 *
 * @returns A new StdioServerTransport instance configured for MCP communication
 * @example
 * ```typescript
 * const transport = createTransport();
 * await server.connect(transport);
 * ```
 */
export function createTransport(): StdioServerTransport {
  return new StdioServerTransport();
}

/**
 * Starts the HTTP server for MCP communication
 *
 * Creates and configures the HTTP transport service, then starts
 * the Express server to handle HTTP-based MCP requests. The function
 * reads environment configuration to determine if HTTP transport is enabled
 * and configures the server accordingly.
 *
 * @returns Promise that resolves when the HTTP server is successfully started
 * @throws {Error} When HTTP server startup fails or configuration is invalid
 * @example
 * ```typescript
 * await startHttpServer();
 * ```
 */
export async function startHttpServer(): Promise<void> {
  try {
    logger.info("Starting MCP HTTP Server...");

    // Parse environment configuration
    const envConfig = parseEnvironmentConfig();

    if (!envConfig.mcpHttpEnabled) {
      logger.warn("HTTP transport is disabled via environment configuration");
      return;
    }

    // Create a factory function to create new server instances for each session
    const createMcpServer = (): McpServer => {
      const server = createServer();
      registerTools(server);
      registerResources(server);
      return server;
    };

    // Convert environment config to HTTP server config
    const httpConfig = getHttpServerConfig(envConfig);

    // Create and start HTTP transport service with factory function
    const httpService = new HttpTransportService(httpConfig, createMcpServer);
    await httpService.start();

    logger.info("MCP HTTP Server started successfully", {
      port: envConfig.mcpHttpPort,
      https: envConfig.mcpHttpsEnabled,
      tools: ["get_quote"],
      resources: ["prompt-template://quote-request"],
    });
  } catch (error) {
    logError(
      "Failed to start MCP HTTP Server",
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Starts the stdio server for MCP communication
 *
 * Initializes the server with both tools and resources, then connects
 * to the stdio transport for MCP communication. This is the default
 * transport method used for MCP communication via standard input/output.
 *
 * @returns Promise that resolves when the stdio server is successfully started and connected
 * @throws {Error} When stdio server startup fails or connection cannot be established
 * @example
 * ```typescript
 * await startStdioServer();
 * ```
 */
export async function startStdioServer(): Promise<void> {
  try {
    logger.info("Starting MCP Stdio Server...");

    // Create server and register tools and resources
    const server = createServer();
    registerTools(server);
    registerResources(server);

    // Create stdio transport
    const transport = createTransport();

    // Connect the server to the transport
    await server.connect(transport);

    logger.info(
      "MCP Stdio Server started successfully and is listening for connections.",
      {
        tools: ["get_quote"],
        resources: ["prompt-template://quote-request"],
      }
    );
  } catch (error) {
    logError(
      "Failed to start MCP Stdio Server",
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Main function to start the MCP server with dual transport support
 *
 * Determines which transport(s) to start based on environment configuration.
 * - If HTTP is enabled, starts HTTP server
 * - If HTTP is disabled or not configured, starts stdio server
 * - Maintains backwards compatibility with existing stdio functionality
 */
export async function main(): Promise<void> {
  try {
    logger.info("Starting MCP Quotes Server with dual transport support...");

    // Parse environment configuration
    const envConfig = parseEnvironmentConfig();

    if (envConfig.mcpHttpEnabled) {
      // Start HTTP server
      await startHttpServer();
    } else {
      // Default to stdio server for backwards compatibility
      logger.info("HTTP transport disabled, starting stdio server");
      await startStdioServer();
    }
  } catch (error) {
    logError(
      "Failed to start MCP Quotes Server",
      error instanceof Error ? error : new Error(String(error))
    );
    process.exit(1);
  }
}

// Note: Main execution is handled by npm start script
// The server can be started by calling main() function directly
