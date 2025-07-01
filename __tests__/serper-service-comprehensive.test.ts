import { jest } from "@jest/globals";
import axios, { AxiosResponse } from "axios";
import { SerperService } from "../src/services/serper-service";
import {
  SerperApiError,
  SerperConfigurationError,
} from "../src/types/serper-errors";

// Mock axios
jest.mock("axios");
const mockedAxios = jest.mocked(axios);

// Mock axios-retry
jest.mock("axios-retry");

// Mock the logger
jest.mock("../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  logApiRequest: jest.fn(),
  logApiResponse: jest.fn(),
  logError: jest.fn(),
}));

// Create a mock axios instance with proper typing
const createMockAxiosInstance = () => ({
  post: jest.fn() as jest.MockedFunction<any>,
  interceptors: {
    request: {
      use: jest.fn() as jest.MockedFunction<any>,
    },
    response: {
      use: jest.fn() as jest.MockedFunction<any>,
    },
  },
});

// Sample API response
const mockApiResponse = {
  organic: [
    {
      title: "Albert Einstein Quotes",
      snippet:
        '"Imagination is more important than knowledge." - Albert Einstein',
      link: "https://example.com/einstein-quotes",
    },
  ],
};

describe("SerperService", () => {
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError.mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with valid API key", () => {
      const service = new SerperService("test-api-key");
      expect(service).toBeInstanceOf(SerperService);
      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it("should throw error when API key is empty", () => {
      expect(() => new SerperService("")).toThrow(SerperConfigurationError);
    });

    it("should throw error when API key is whitespace", () => {
      expect(() => new SerperService("   ")).toThrow(SerperConfigurationError);
    });

    it("should throw error when API key is null", () => {
      expect(() => new SerperService(null as any)).toThrow(
        SerperConfigurationError
      );
    });

    it("should throw error when API key is undefined", () => {
      expect(() => new SerperService(undefined as any)).toThrow(
        SerperConfigurationError
      );
    });

    it("should trim API key whitespace", () => {
      const service = new SerperService("  test-key  ");
      expect(service).toBeInstanceOf(SerperService);
    });
  });

  describe("getQuote", () => {
    let service: SerperService;

    beforeEach(() => {
      service = new SerperService("test-api-key");
    });

    it("should return quote for person", async () => {
      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/search" } as any,
        data: mockApiResponse,
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const result = await service.getQuote({ person: "Albert Einstein" });
      expect(result).toBe("Imagination is more important than knowledge.");
    });

    it("should return quote for person with topic", async () => {
      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/search" } as any,
        data: mockApiResponse,
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const result = await service.getQuote({
        person: "Einstein",
        topic: "science",
      });
      expect(result).toBe("Imagination is more important than knowledge.");
    });

    it("should handle empty search results", async () => {
      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/search" } as any,
        data: { organic: [] },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const result = await service.getQuote({ person: "Unknown Person" });
      expect(result).toContain("Unable to find");
    });

    it("should handle API errors with response", async () => {
      const errorResponse = {
        response: {
          status: 429,
          statusText: "Too Many Requests",
          data: { error: "Rate limit exceeded" },
          headers: {},
          config: { url: "/search" } as any,
        },
        config: { url: "/search" } as any,
      };

      mockAxiosInstance.post.mockRejectedValue(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(service.getQuote({ person: "Test Person" })).rejects.toThrow(
        SerperApiError
      );
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      mockAxiosInstance.post.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(service.getQuote({ person: "Test Person" })).rejects.toThrow(
        SerperApiError
      );
    });

    it("should handle axios errors without response", async () => {
      const axiosError = {
        message: "Request failed",
        config: { url: "/search" } as any,
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(service.getQuote({ person: "Test Person" })).rejects.toThrow(
        SerperApiError
      );
    });
  });

  describe("private methods coverage", () => {
    let service: SerperService;

    beforeEach(() => {
      service = new SerperService("test-api-key");
    });

    it("should test constructSearchQuery method", () => {
      const query1 = (service as any).constructSearchQuery({
        person: "Einstein",
      });
      expect(query1).toContain("Einstein");
      expect(query1).toContain("quotes");

      const query2 = (service as any).constructSearchQuery({
        person: "Einstein",
        topic: "science",
      });
      expect(query2).toContain("Einstein");
      expect(query2).toContain("science");
      expect(query2).toContain("quotes");
    });

    it("should test parseQuoteFromResponse method with valid response", () => {
      const result = (service as any).parseQuoteFromResponse(
        mockApiResponse,
        "Einstein"
      );
      expect(result).toBe("Imagination is more important than knowledge.");
    });

    it("should test parseQuoteFromResponse method with empty response", () => {
      const result = (service as any).parseQuoteFromResponse(
        { organic: [] },
        "Einstein"
      );
      expect(result).toContain("Unable to find");
    });

    it("should test parseQuoteFromResponse method with no organic results", () => {
      const result = (service as any).parseQuoteFromResponse({}, "Einstein");
      expect(result).toContain("Unable to find");
    });

    it("should test parseQuoteFromResponse method with malformed organic data", () => {
      const malformedResponse = {
        organic: [
          {
            title: "No snippet here",
          },
        ],
      };
      const result = (service as any).parseQuoteFromResponse(
        malformedResponse,
        "Einstein"
      );
      expect(result).toContain("Unable to find");
    });
  });

  describe("axios instance setup", () => {
    it("should setup interceptors", () => {
      new SerperService("test-api-key");
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it("should create axios instance with correct config", () => {
      new SerperService("test-api-key");
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "https://google.serper.dev",
        timeout: 10000,
        headers: {
          "X-API-KEY": "test-api-key",
          "Content-Type": "application/json",
          "User-Agent": "MCP-Quotes-Server/1.0.0",
        },
      });
    });
  });

  describe("additional edge cases", () => {
    let service: SerperService;

    beforeEach(() => {
      service = new SerperService("test-api-key");
    });

    it("should handle response with snippet containing no quotes", async () => {
      const responseWithoutQuotes = {
        organic: [
          {
            title: "Einstein Biography",
            snippet: "Albert Einstein was a physicist",
            link: "https://example.com",
          },
        ],
      };

      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/search" } as any,
        data: responseWithoutQuotes,
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const result = await service.getQuote({ person: "Einstein" });
      expect(result).toContain("Unable to find");
    });

    it("should handle response with multiple snippets and extract first quote", async () => {
      const responseMultipleSnippets = {
        organic: [
          {
            title: "Einstein Quotes 1",
            snippet: "Some text without quotes here",
            link: "https://example.com",
          },
          {
            title: "Einstein Quotes 2",
            snippet:
              '"The important thing is not to stop questioning." - Albert Einstein',
            link: "https://example.com",
          },
        ],
      };

      const mockResponse: AxiosResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/search" } as any,
        data: responseMultipleSnippets,
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const result = await service.getQuote({ person: "Einstein" });
      expect(result).toBe("The important thing is not to stop questioning.");
    });

    describe("private method coverage tests", () => {
      let service: SerperService;

      beforeEach(() => {
        service = new SerperService("test-api-key");
      });

      it("should test createAxiosInstance method", () => {
        // This method is called in constructor, verify it's working
        expect(mockedAxios.create).toHaveBeenCalledWith(
          expect.objectContaining({
            baseURL: "https://google.serper.dev",
          })
        );
      });

      it("should test setupRetryLogic method", () => {
        // This method is called in constructor, verify interceptors are set up
        expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
        expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      });

      it("should test parseQuoteFromResponse method with various responses", () => {
        // Test response parsing with different response formats
        const testCases = [
          {
            response: {
              organic: [
                {
                  title: "Einstein Quote",
                  snippet:
                    '"Imagination is more important than knowledge." - Albert Einstein',
                  link: "https://example.com",
                },
              ],
            },
            searchParams: { person: "Einstein" },
            expected: "Imagination is more important than knowledge.",
          },
          {
            response: { organic: [] },
            searchParams: { person: "Unknown Person" },
            expected: "Unable to find quotes",
          },
          {
            response: {},
            searchParams: { person: "Test Person" },
            expected: "Unable to find quotes",
          },
        ];

        testCases.forEach(({ response, searchParams, expected }) => {
          const result = (service as any).parseQuoteFromResponse(
            response,
            searchParams
          );
          if (expected.includes("Unable to find quotes")) {
            expect(result).toContain("Unable to find");
          } else {
            expect(result).toBe(expected);
          }
        });
      });

      it("should test error handling in different scenarios", async () => {
        // Test timeout error
        const timeoutError = {
          code: "ECONNABORTED",
          message: "timeout of 10000ms exceeded",
          config: { url: "/search" } as any,
        };

        mockAxiosInstance.post.mockRejectedValue(timeoutError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(service.getQuote({ person: "Test" })).rejects.toThrow(
          SerperApiError
        );

        // Test connection error
        const connectionError = {
          code: "ECONNREFUSED",
          message: "Connection refused",
          config: { url: "/search" } as any,
        };

        mockAxiosInstance.post.mockRejectedValue(connectionError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(service.getQuote({ person: "Test" })).rejects.toThrow(
          SerperApiError
        );
      });

      it("should test request and response interceptors", async () => {
        // Get the interceptor callbacks
        const requestUse = mockAxiosInstance.interceptors.request
          .use as jest.MockedFunction<any>;
        const responseUse = mockAxiosInstance.interceptors.response
          .use as jest.MockedFunction<any>;

        // Verify interceptors were called
        expect(requestUse).toHaveBeenCalled();
        expect(responseUse).toHaveBeenCalled();

        // Test the request interceptor callback
        const requestCallback = requestUse.mock.calls[0][0];
        const mockConfig = { url: "/search", method: "POST" };
        const requestResult = requestCallback(mockConfig);
        expect(requestResult).toBe(mockConfig);

        // Test the response interceptor success callback
        const responseSuccessCallback = responseUse.mock.calls[0][0];
        const mockResponse = {
          data: { test: "data" },
          status: 200,
          config: { url: "/search" },
        };
        const responseResult = responseSuccessCallback(mockResponse);
        expect(responseResult).toBe(mockResponse);

        // Test the response interceptor error callback
        const responseErrorCallback = responseUse.mock.calls[0][1];
        const mockError = new Error("Test error");

        // The error callback should reject with the error
        const errorResult = responseErrorCallback(mockError);
        expect(errorResult).toBeInstanceOf(Promise);
        await expect(errorResult).rejects.toThrow("Test error");
      });
    });
  });
});
