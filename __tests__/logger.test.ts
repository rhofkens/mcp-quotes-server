/**
 * Unit tests for logger utility functions
 *
 * These tests ensure the logger utility functions work correctly
 * and help achieve the required function coverage threshold.
 */

import { jest } from "@jest/globals";
import {
  logApiRequest,
  logApiResponse,
  logError,
  logger,
} from "../src/utils/logger";

// Mock winston logger
jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    File: jest.fn(),
  },
}));

const mockedLogger = logger as jest.Mocked<typeof logger>;

describe("Logger Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logApiRequest", () => {
    it("should log API request with masked API key in URL", () => {
      const url = "https://api.example.com/search?key=secret123&q=test";
      const method = "POST";
      const params = { q: "test", key: "secret123" };

      logApiRequest(url, method, params);

      expect(mockedLogger.info).toHaveBeenCalledWith("API Request", {
        url: "https://api.example.com/search?key=***&q=test",
        method: "POST",
        params: { q: "test", key: undefined },
      });
    });

    it("should log API request without API key masking when no key present", () => {
      const url = "https://api.example.com/search?q=test";
      const method = "GET";
      const params = { q: "test" };

      logApiRequest(url, method, params);

      expect(mockedLogger.info).toHaveBeenCalledWith("API Request", {
        url: "https://api.example.com/search?q=test",
        method: "GET",
        params: { q: "test", key: undefined },
      });
    });

    it("should handle empty params object", () => {
      const url = "https://api.example.com/search";
      const method = "POST";
      const params = {};

      logApiRequest(url, method, params);

      expect(mockedLogger.info).toHaveBeenCalledWith("API Request", {
        url: "https://api.example.com/search",
        method: "POST",
        params: { key: undefined },
      });
    });
  });

  describe("logApiResponse", () => {
    it("should log API response with masked API key in URL", () => {
      const url = "https://api.example.com/search?key=secret123&q=test";
      const statusCode = 200;
      const responseSize = 1024;

      logApiResponse(url, statusCode, responseSize);

      expect(mockedLogger.info).toHaveBeenCalledWith("API Response", {
        url: "https://api.example.com/search?key=***&q=test",
        statusCode: 200,
        responseSize: 1024,
      });
    });

    it("should log API response without response size", () => {
      const url = "https://api.example.com/search?key=secret123";
      const statusCode = 404;

      logApiResponse(url, statusCode);

      expect(mockedLogger.info).toHaveBeenCalledWith("API Response", {
        url: "https://api.example.com/search?key=***",
        statusCode: 404,
        responseSize: undefined,
      });
    });

    it("should handle URL without API key", () => {
      const url = "https://api.example.com/search?q=test";
      const statusCode = 500;

      logApiResponse(url, statusCode);

      expect(mockedLogger.info).toHaveBeenCalledWith("API Response", {
        url: "https://api.example.com/search?q=test",
        statusCode: 500,
        responseSize: undefined,
      });
    });
  });

  describe("logError", () => {
    it("should log error with message, error details, and context", () => {
      const message = "API request failed";
      const error = new Error("Network timeout");
      error.stack = "Error: Network timeout\n    at test.js:1:1";
      const context = { url: "/api/test", retryCount: 3 };

      logError(message, error, context);

      expect(mockedLogger.error).toHaveBeenCalledWith("API request failed", {
        error: "Network timeout",
        stack: "Error: Network timeout\n    at test.js:1:1",
        name: "Error",
        url: "/api/test",
        retryCount: 3,
      });
    });

    it("should log error without context", () => {
      const message = "Unexpected error";
      const error = new TypeError("Cannot read property");
      error.stack = "TypeError: Cannot read property\n    at test.js:2:1";

      logError(message, error);

      expect(mockedLogger.error).toHaveBeenCalledWith("Unexpected error", {
        error: "Cannot read property",
        stack: "TypeError: Cannot read property\n    at test.js:2:1",
        name: "TypeError",
      });
    });

    it("should handle error without stack trace", () => {
      const message = "Simple error";
      const error = new Error("Basic error");
      // Explicitly remove stack for testing
      delete (error as any).stack;

      logError(message, error);

      expect(mockedLogger.error).toHaveBeenCalledWith("Simple error", {
        error: "Basic error",
        stack: undefined,
        name: "Error",
      });
    });
  });
});
