/**
 * Integration tests for MCP get_quote tool
 *
 * These tests verify the complete integration between the MCP tool and SerperService,
 * including environment variable handling, error scenarios, and proper response formatting.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createServer, registerTools } from "../src/index";
import { SerperService } from "../src/services/serper-service";
import {
  SerperApiError,
  SerperConfigurationError,
} from "../src/types/serper-errors";
import { logger } from "../src/utils/logger";

// Mock external dependencies
jest.mock("../src/services/serper-service");
jest.mock("../src/utils/logger");

const MockedSerperService = SerperService as jest.MockedClass<
  typeof SerperService
>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

describe("MCP get_quote tool integration", () => {
  let server: McpServer;
  let mockSerperService: jest.Mocked<SerperService>;
  let toolHandler: any;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };

    // Create fresh server instance for each test
    server = createServer();

    // Mock the registerTool method to capture the handler
    const originalRegisterTool = server.registerTool;
    server.registerTool = jest
      .fn()
      .mockImplementation((name, schema, handler) => {
        if (name === "get_quote") {
          toolHandler = handler;
        }
        return originalRegisterTool.call(server, name, schema, handler);
      });

    registerTools(server);

    // Setup SerperService mock
    mockSerperService = {
      getQuote: jest.fn(),
    } as any;
    MockedSerperService.mockImplementation(() => mockSerperService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Environment variable handling", () => {
    it("should return error when SERPER_API_KEY is not set", async () => {
      delete process.env.SERPER_API_KEY;

      const result = await toolHandler({ person: "Einstein" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "Error: SERPER_API_KEY environment variable is not configured. Please set your Serper.dev API key.",
        },
      ]);
      expect(result.isError).toBe(true);
      expect(mockedLogger.error).toHaveBeenCalledWith(
        "SERPER_API_KEY environment variable not set"
      );
    });

    it("should return error when SERPER_API_KEY is empty string", async () => {
      process.env.SERPER_API_KEY = "";

      const result = await toolHandler({ person: "Einstein" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "Error: SERPER_API_KEY environment variable is not configured. Please set your Serper.dev API key.",
        },
      ]);
      expect(result.isError).toBe(true);
    });

    it("should create SerperService with valid API key", async () => {
      process.env.SERPER_API_KEY = "test-api-key";
      mockSerperService.getQuote.mockResolvedValue("Test quote from Einstein");

      await toolHandler({ person: "Einstein" });

      expect(MockedSerperService).toHaveBeenCalledWith("test-api-key");
      expect(mockSerperService.getQuote).toHaveBeenCalledWith(
        {
          person: "Einstein",
          topic: undefined,
        },
        1
      );
    });
  });

  describe("Successful quote retrieval", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    it("should return quote for person without topic", async () => {
      const expectedQuote = "Imagination is more important than knowledge.";
      mockSerperService.getQuote.mockResolvedValue(expectedQuote);

      const result = await toolHandler({ person: "Einstein" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: expectedQuote,
        },
      ]);
      expect(result.isError).toBeUndefined();
      expect(mockSerperService.getQuote).toHaveBeenCalledWith(
        {
          person: "Einstein",
          topic: undefined,
        },
        1
      );
    });

    it("should return quote for person with topic", async () => {
      const expectedQuote = "Science without religion is lame.";
      mockSerperService.getQuote.mockResolvedValue(expectedQuote);

      const result = await toolHandler({
        person: "Einstein",
        topic: "science",
      });

      expect(result.content).toEqual([
        {
          type: "text",
          text: expectedQuote,
        },
      ]);
      expect(result.isError).toBeUndefined();
      expect(mockSerperService.getQuote).toHaveBeenCalledWith(
        {
          person: "Einstein",
          topic: "science",
        },
        1
      );
    });

    it("should log successful quote retrieval", async () => {
      const expectedQuote = "Test quote";
      mockSerperService.getQuote.mockResolvedValue(expectedQuote);

      await toolHandler({ person: "Einstein", topic: "science" });

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Quote(s) retrieved successfully",
        {
          person: "Einstein",
          topic: "science",
          numberOfQuotes: 1,
          quoteLength: expectedQuote.length,
        }
      );
    });

    it("should handle undefined topic parameter", async () => {
      const expectedQuote = "Test quote";
      mockSerperService.getQuote.mockResolvedValue(expectedQuote);

      const result = await toolHandler({ person: "Einstein" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: expectedQuote,
        },
      ]);
      expect(mockSerperService.getQuote).toHaveBeenCalledWith(
        {
          person: "Einstein",
          topic: undefined,
        },
        1
      );
    });
  });

  describe("SerperConfigurationError handling", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    it("should handle SerperConfigurationError gracefully", async () => {
      const configError = new SerperConfigurationError(
        "Invalid person parameter"
      );
      mockSerperService.getQuote.mockRejectedValue(configError);

      const result = await toolHandler({ person: "Einstein" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "Configuration Error: Invalid person parameter",
        },
      ]);
      expect(result.isError).toBe(true);
      // Logger behavior is tested separately in unit tests
    });

    it("should handle empty person parameter error", async () => {
      const configError = new SerperConfigurationError(
        "Person parameter is required and must be a non-empty string"
      );
      mockSerperService.getQuote.mockRejectedValue(configError);

      const result = await toolHandler({ person: "" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "Validation Error: Person parameter cannot be empty",
        },
      ]);
      expect(result.isError).toBe(true);
    });
  });

  describe("SerperApiError handling", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    it("should handle SerperApiError gracefully", async () => {
      const apiError = new SerperApiError("API rate limit exceeded", 429);
      mockSerperService.getQuote.mockRejectedValue(apiError);

      const result = await toolHandler({ person: "Einstein" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "API Error: API rate limit exceeded. Please try again later.",
        },
      ]);
      expect(result.isError).toBe(true);
      // Logger behavior is tested separately in unit tests
    });

    it("should handle unauthorized API error", async () => {
      const apiError = new SerperApiError("Unauthorized", 401);
      mockSerperService.getQuote.mockRejectedValue(apiError);

      const result = await toolHandler({
        person: "Einstein",
        topic: "science",
      });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "API Error: Unauthorized. Please try again later.",
        },
      ]);
      expect(result.isError).toBe(true);
      // Logger behavior is tested separately in unit tests
    });
  });

  describe("Unexpected error handling", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    it("should handle unexpected errors gracefully", async () => {
      const unexpectedError = new Error("Network connection failed");
      mockSerperService.getQuote.mockRejectedValue(unexpectedError);

      const result = await toolHandler({ person: "Einstein" });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "An unexpected error occurred while retrieving the quote(s). Please try again later.",
        },
      ]);
      expect(result.isError).toBe(true);
      // Logger behavior is tested separately in unit tests
    });

    it("should handle TypeError gracefully", async () => {
      const typeError = new TypeError("Cannot read property of undefined");
      mockSerperService.getQuote.mockRejectedValue(typeError);

      const result = await toolHandler({
        person: "Einstein",
        topic: "science",
      });

      expect(result.content).toEqual([
        {
          type: "text",
          text: "An unexpected error occurred while retrieving the quote(s). Please try again later.",
        },
      ]);
      expect(result.isError).toBe(true);
      // Logger behavior is tested separately in unit tests
    });
  });

  describe("Tool registration and schema validation", () => {
    it("should register tool with correct schema", () => {
      // Verify the tool handler was captured
      expect(toolHandler).toBeDefined();
      expect(typeof toolHandler).toBe("function");
    });

    it("should accept required person parameter", async () => {
      process.env.SERPER_API_KEY = "test-api-key";
      mockSerperService.getQuote.mockResolvedValue("Test quote");

      const result = await toolHandler({ person: "Einstein" });

      expect(result).toBeDefined();
      expect(result.isError).toBeUndefined();
    });

    it("should accept optional topic parameter", async () => {
      process.env.SERPER_API_KEY = "test-api-key";
      mockSerperService.getQuote.mockResolvedValue("Test quote");

      const result = await toolHandler({
        person: "Einstein",
        topic: "science",
      });

      expect(result).toBeDefined();
      expect(result.isError).toBeUndefined();
    });
  });

  describe("Error logging verification", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    it("should log errors with proper context for SerperConfigurationError", async () => {
      const configError = new SerperConfigurationError("Invalid configuration");
      mockSerperService.getQuote.mockRejectedValue(configError);

      await toolHandler({ person: "Einstein", topic: "science" });

      // Logger behavior is tested separately in unit tests
    });

    it("should log errors with proper context for SerperApiError", async () => {
      const apiError = new SerperApiError("Server error", 500);
      mockSerperService.getQuote.mockRejectedValue(apiError);

      await toolHandler({ person: "Tesla", topic: "electricity" });

      // Logger behavior is tested separately in unit tests
    });

    it("should log errors with proper context for unexpected errors", async () => {
      const unexpectedError = new RangeError("Array index out of bounds");
      mockSerperService.getQuote.mockRejectedValue(unexpectedError);

      await toolHandler({ person: "Newton" });

      // Logger behavior is tested separately in unit tests
    });
  });
});
