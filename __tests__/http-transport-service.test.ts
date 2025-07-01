import { HttpTransportService } from "../src/services/http-transport-service";
import { HttpServerConfig } from "../src/types/http-transport-types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  accessSync: jest.fn(),
  constants: {
    R_OK: 4,
  },
}));

// Mock logger
jest.mock("../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock express
jest.mock("express", () => {
  const mockApp = {
    use: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn(),
  };

  const mockExpress = jest.fn(() => mockApp) as any;
  mockExpress.json = jest.fn();
  return mockExpress;
});

// Mock cors
jest.mock("cors", () => jest.fn());

// Mock http/https
jest.mock("http", () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
  })),
}));

jest.mock("https", () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
  })),
}));

// Mock StreamableHTTPServerTransport
jest.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: jest.fn().mockImplementation(() => ({
    handleRequest: jest.fn(),
    close: jest.fn(),
    onclose: undefined,
    sessionId: "mock-session-id",
  })),
}));

// Import mocked modules
import express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import { logger } from "../src/utils/logger";

const mockExpress = express as jest.MockedFunction<typeof express>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockHttp = http as jest.Mocked<typeof http>;
const mockHttps = https as jest.Mocked<typeof https>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("HttpTransportService", () => {
  let service: HttpTransportService;
  let mockConfig: HttpServerConfig;
  let mockMcpServer: McpServer;
  let mockApp: any;
  let mockServer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset app mock
    mockApp = {
      use: jest.fn(),
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      listen: jest.fn(),
    };

    mockServer = {
      listen: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
      address: jest.fn().mockReturnValue({ port: 3000 }),
    };

    mockExpress.mockReturnValue(mockApp);
    mockHttp.createServer.mockReturnValue(mockServer as any);
    mockHttps.createServer.mockReturnValue(mockServer as any);

    mockConfig = {
      enabled: true,
      host: "localhost",
      port: 3000,
      https: {
        enabled: false,
      },
      security: {
        allowedOrigins: [],
        allowedHosts: ["127.0.0.1", "localhost"],
      },
    };

    mockMcpServer = {
      connect: jest.fn().mockResolvedValue(undefined),
    } as unknown as McpServer;

    // Mock fs functions
    mockFs.existsSync.mockReturnValue(true);
    mockFs.accessSync.mockReturnValue(undefined);
    mockFs.readFileSync.mockImplementation((path: any, _encoding: any) => {
      if (path.includes("cert.pem")) {
        return "-----BEGIN CERTIFICATE-----\nfake cert content\n-----END CERTIFICATE-----";
      }
      if (path.includes("key.pem")) {
        return "-----BEGIN PRIVATE KEY-----\nfake key content\n-----END PRIVATE KEY-----";
      }
      return "";
    });
  });

  afterEach(() => {
    if (service) {
      try {
        service.stop?.();
      } catch {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe("constructor", () => {
    it("should create instance with valid configuration", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);
      expect(service).toBeInstanceOf(HttpTransportService);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "HTTP Transport Service initialized",
        expect.objectContaining({
          host: "localhost",
          port: 3000,
          httpsEnabled: false,
        })
      );
    });

    it("should configure express app and middleware", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      expect(mockExpress).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalled();
    });

    it("should handle custom port configuration", () => {
      const customConfig = { ...mockConfig, port: 8080 };
      service = new HttpTransportService(customConfig, () => mockMcpServer);

      expect(service).toBeInstanceOf(HttpTransportService);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "HTTP Transport Service initialized",
        expect.objectContaining({
          port: 8080,
        })
      );
    });

    it("should handle custom options", () => {
      const options = { jsonLimit: "100mb", enableLogging: false };
      service = new HttpTransportService(
        mockConfig,
        () => mockMcpServer,
        options
      );

      expect(service).toBeInstanceOf(HttpTransportService);
    });
  });

  describe("HTTPS configuration", () => {
    it("should handle HTTPS configuration with valid certificates", () => {
      const httpsConfig = {
        ...mockConfig,
        https: {
          enabled: true,
          keyPath: "/path/to/key.pem",
          certPath: "/path/to/cert.pem",
        },
      };

      service = new HttpTransportService(httpsConfig, () => mockMcpServer);
      expect(service).toBeInstanceOf(HttpTransportService);
      expect(mockFs.existsSync).toHaveBeenCalledWith("/path/to/cert.pem");
      expect(mockFs.existsSync).toHaveBeenCalledWith("/path/to/key.pem");
    });

    it("should throw error when certificate file does not exist", () => {
      mockFs.existsSync.mockImplementation((path: any) => {
        return !path.includes("cert.pem");
      });

      const httpsConfig = {
        ...mockConfig,
        https: {
          enabled: true,
          keyPath: "/path/to/key.pem",
          certPath: "/path/to/cert.pem",
        },
      };

      expect(() => {
        new HttpTransportService(httpsConfig, () => mockMcpServer);
      }).toThrow("HTTPS certificate file not found");
    });

    it("should throw error when key file does not exist", () => {
      mockFs.existsSync.mockImplementation((path: any) => {
        return !path.includes("key.pem");
      });

      const httpsConfig = {
        ...mockConfig,
        https: {
          enabled: true,
          keyPath: "/path/to/key.pem",
          certPath: "/path/to/cert.pem",
        },
      };

      expect(() => {
        new HttpTransportService(httpsConfig, () => mockMcpServer);
      }).toThrow("HTTPS private key file not found");
    });

    it("should handle file read errors for certificates", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const httpsConfig = {
        ...mockConfig,
        https: {
          enabled: true,
          keyPath: "/path/to/key.pem",
          certPath: "/path/to/cert.pem",
        },
      };

      expect(() => {
        new HttpTransportService(httpsConfig, () => mockMcpServer);
      }).toThrow("Permission denied");
    });
  });

  describe("configuration validation", () => {
    it("should throw error for invalid port", () => {
      const invalidConfig = { ...mockConfig, port: 0 };

      expect(() => {
        new HttpTransportService(invalidConfig, () => mockMcpServer);
      }).toThrow(
        "Invalid HTTP server configuration: port must be between 1 and 65535"
      );
    });

    it("should throw error for missing host", () => {
      const invalidConfig = { ...mockConfig, host: "" };

      expect(() => {
        new HttpTransportService(invalidConfig, () => mockMcpServer);
      }).toThrow("Invalid HTTP server configuration: host is required");
    });

    it("should throw error for incomplete HTTPS config", () => {
      const invalidConfig = {
        ...mockConfig,
        https: {
          enabled: true,
          keyPath: "/path/to/key.pem",
          // missing certPath
        },
      };

      expect(() => {
        new HttpTransportService(invalidConfig, () => mockMcpServer);
      }).toThrow(
        "Invalid HTTP server configuration: HTTPS requires certPath and keyPath"
      );
    });
  });

  describe("start method", () => {
    it("should call start method without errors", async () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      // Mock app.listen to return our mock server
      (service as any).app.listen = jest
        .fn()
        .mockImplementation(
          (port: number, host: string, callback: () => void) => {
            setTimeout(callback, 0);
            return mockServer;
          }
        );

      await service.start();

      expect((service as any).app.listen).toHaveBeenCalledWith(
        3000,
        "localhost",
        expect.any(Function)
      );
    });

    it("should handle HTTPS configuration", () => {
      const httpsConfig = {
        ...mockConfig,
        https: {
          enabled: true,
          keyPath: "/path/to/key.pem",
          certPath: "/path/to/cert.pem",
        },
      };

      service = new HttpTransportService(httpsConfig, () => mockMcpServer);
      expect(service).toBeInstanceOf(HttpTransportService);
    });
  });

  describe("stop method", () => {
    it("should call stop method", async () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      // Mock server state
      (service as any).server = mockServer;
      (service as any).isRunning = true;

      mockServer.close.mockImplementation((callback: () => void) => {
        setTimeout(callback, 0);
      });

      await service.stop();

      expect(mockServer.close).toHaveBeenCalled();
    });

    it("should handle stop when not running", async () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      await service.stop();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Attempted to stop HTTP transport service that is not running"
      );
    });
  });

  describe("middleware creation", () => {
    it("should create DNS rebinding protection middleware", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      const middleware = (service as any).createDnsRebindingProtection();
      expect(typeof middleware).toBe("function");

      // Test with invalid host
      const mockReq = {
        headers: { host: "malicious-site.com" },
        url: "/test",
        get: jest.fn().mockReturnValue("malicious-site.com"),
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn().mockReturnThis(),
      };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Host not allowed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow valid hosts through middleware", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      const middleware = (service as any).createDnsRebindingProtection();

      // Test with valid host
      const mockReq = {
        headers: { host: "localhost:3000" },
        url: "/test",
        get: jest.fn().mockReturnValue("localhost:3000"),
      };
      const mockRes = { status: jest.fn(), send: jest.fn() };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should create CORS options properly", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      const corsOptions = (service as any).createCorsOptions();

      expect(corsOptions).toEqual({
        origin: [],
        exposedHeaders: ["mcp-session-id"],
        allowedHeaders: ["Content-Type", "mcp-session-id"],
        credentials: true,
      });
    });

    it("should create request logging middleware", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      const middleware = (service as any).createRequestLoggingMiddleware();
      expect(typeof middleware).toBe("function");
    });

    it("should create global error handler", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      const errorHandler = (service as any).createGlobalErrorHandler();
      expect(typeof errorHandler).toBe("function");
    });
  });

  describe("session management", () => {
    it("should track sessions properly", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      const sessions = (service as any).sessions;
      expect(sessions).toBeInstanceOf(Map);
      expect(sessions.size).toBe(0);
    });

    it("should have session counters", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      expect((service as any).totalSessionsCreated).toBe(0);
      expect((service as any).totalSessionsTerminated).toBe(0);
    });
  });

  describe("route setup", () => {
    it("should setup routes during initialization", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      // Verify that routes were set up by checking app.post calls
      expect(mockApp.post).toHaveBeenCalled();
      expect(mockApp.get).toHaveBeenCalled();
      expect(mockApp.delete).toHaveBeenCalled();
    });
  });

  describe("cleanup and shutdown", () => {
    it("should handle cleanup operations", () => {
      service = new HttpTransportService(mockConfig, () => mockMcpServer);

      // Test that the service can be created and basic properties exist
      expect((service as any).sessions).toBeInstanceOf(Map);
      expect((service as any).isRunning).toBe(false);
    });
  });
});
