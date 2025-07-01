import express, { Request, Response } from "express";
import cors from "cors";
import https from "https";
import http from "http";
import fs from "fs";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../utils/logger.js";
import {
  HttpServerConfig,
  HttpTransportSession,
  HttpServerOptions,
  SessionStats,
  HttpTransportError,
  HttpTransportErrorType,
} from "../types/http-transport-types.js";

/**
 * HTTP Transport Service
 *
 * Provides HTTP/HTTPS communication for MCP server using StreamableHTTPServerTransport.
 * Manages sessions, handles security configurations, and provides RESTful endpoints
 * for MCP client communication.
 */
export class HttpTransportService {
  private app: express.Application;
  private server?: http.Server | https.Server;
  private sessions: Map<string, HttpTransportSession> = new Map();
  private config: HttpServerConfig;
  private options: HttpServerOptions;
  private mcpServerFactory: () => McpServer;
  private startTime: Date = new Date();
  private totalSessionsCreated: number = 0;
  private totalSessionsTerminated: number = 0;
  private isRunning: boolean = false;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  /**
   * Creates a new HTTP Transport Service instance
   *
   * @param config - HTTP server configuration
   * @param mcpServerFactory - Factory function to create new MCP server instances
   * @param options - Additional server options
   */
  constructor(
    config: HttpServerConfig,
    mcpServerFactory: () => McpServer,
    options: HttpServerOptions = {}
  ) {
    this.config = config;
    this.mcpServerFactory = mcpServerFactory;
    this.options = {
      jsonLimit: "50mb",
      enableLogging: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...options,
    };

    this.validateConfig();
    this.app = this.createExpressApp();
    this.setupRoutes();
    this.setupSessionCleanup();

    logger.info("HTTP Transport Service initialized", {
      host: config.host,
      port: config.port,
      httpsEnabled: config.https.enabled,
      allowedHosts: config.security.allowedHosts,
      allowedOrigins: config.security.allowedOrigins,
    });
  }

  /**
   * Validates the HTTP server configuration
   *
   * @throws Error if configuration is invalid
   */
  private validateConfig(): void {
    if (!this.config.port || this.config.port < 1 || this.config.port > 65535) {
      throw new Error(
        "Invalid HTTP server configuration: port must be between 1 and 65535"
      );
    }

    if (!this.config.host) {
      throw new Error("Invalid HTTP server configuration: host is required");
    }

    if (this.config.https.enabled) {
      if (!this.config.https.certPath || !this.config.https.keyPath) {
        throw new Error(
          "Invalid HTTP server configuration: HTTPS requires certPath and keyPath"
        );
      }

      // Validate certificate and key files
      this.validateHttpsCertificates();
    }
  }

  /**
   * Creates and configures the Express application
   *
   * @returns Configured Express application
   */
  private createExpressApp(): express.Application {
    const app = express();

    // Configure middleware
    app.use(express.json({ limit: this.options.jsonLimit }));

    // Add DNS rebinding protection middleware
    app.use(this.createDnsRebindingProtection());

    // Configure CORS
    const corsOptions = this.createCorsOptions();
    app.use(cors(corsOptions));

    // Add request logging middleware
    if (this.options.enableLogging) {
      app.use(this.createRequestLoggingMiddleware());
    }

    // Add global error handler (must be last)
    app.use(this.createGlobalErrorHandler());

    return app;
  }

  /**
   * Creates CORS configuration options
   *
   * @returns CORS options object
   */
  private createCorsOptions() {
    const { allowedOrigins } = this.config.security;

    return {
      origin: allowedOrigins.includes("*") ? true : allowedOrigins,
      exposedHeaders: ["mcp-session-id"],
      allowedHeaders: ["Content-Type", "mcp-session-id"],
      credentials: true,
    };
  }

  /**
   * Creates DNS rebinding protection middleware
   *
   * @returns Express middleware function for DNS rebinding protection
   */
  private createDnsRebindingProtection() {
    const { allowedHosts } = this.config.security;

    return (req: Request, res: Response, next: express.NextFunction) => {
      const host = req.get("Host");

      if (!host) {
        logger.warn("Request rejected: Missing Host header");
        res.status(400).json({
          error: "Bad Request",
          message: "Host header is required",
        });
        return;
      }

      // Extract hostname from host header (remove port if present)
      const hostname = host.split(":")[0];

      // Check if hostname is in allowed list
      if (
        hostname &&
        !allowedHosts.includes(hostname) &&
        !allowedHosts.includes("*")
      ) {
        logger.warn("Request rejected: Invalid host", {
          host: hostname,
          allowedHosts,
        });
        res.status(403).json({
          error: "Forbidden",
          message: "Host not allowed",
        });
        return;
      }

      next();
    };
  }

  /**
   * Validates HTTPS certificate and key files
   *
   * @throws Error if certificate files are invalid or inaccessible
   */
  private validateHttpsCertificates(): void {
    if (!this.config.https.enabled) return;

    const { certPath, keyPath } = this.config.https;

    try {
      // Check if certificate files exist and are accessible
      if (!fs.existsSync(certPath!)) {
        throw new Error(`HTTPS certificate file not found: ${certPath}`);
      }

      if (!fs.existsSync(keyPath!)) {
        throw new Error(`HTTPS private key file not found: ${keyPath}`);
      }

      // Try to read the files to ensure they're accessible
      const cert = fs.readFileSync(certPath!, "utf8");
      const key = fs.readFileSync(keyPath!, "utf8");

      // Basic validation that files contain certificate/key content
      if (!cert.includes("-----BEGIN CERTIFICATE-----")) {
        throw new Error(`Invalid certificate file format: ${certPath}`);
      }

      if (!key.includes("-----BEGIN") || !key.includes("PRIVATE KEY-----")) {
        throw new Error(`Invalid private key file format: ${keyPath}`);
      }

      logger.info("HTTPS certificates validated successfully");
    } catch (error) {
      logger.error("HTTPS certificate validation failed", { error });
      throw error;
    }
  }

  /**
   * Creates request logging middleware
   *
   * @returns Express middleware function for request logging
   */
  private createRequestLoggingMiddleware() {
    return (req: Request, res: Response, next: express.NextFunction) => {
      const startTime = Date.now();
      const requestId = randomUUID();

      // Add request ID to headers for tracking
      res.setHeader("x-request-id", requestId);

      logger.info("HTTP request started", {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        sessionId: req.headers["mcp-session-id"],
        ip: req.ip,
      });

      // Log response when finished
      res.on("finish", () => {
        const duration = Date.now() - startTime;

        logger.info("HTTP request completed", {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          sessionId: req.headers["mcp-session-id"],
        });
      });

      next();
    };
  }

  /**
   * Creates global error handler middleware
   *
   * @returns Express error handler middleware
   */
  private createGlobalErrorHandler() {
    return (
      error: Error,
      req: Request,
      res: Response,
      next: express.NextFunction
    ) => {
      const requestId = res.get("x-request-id") || "unknown";

      logger.error("Unhandled HTTP error", {
        requestId,
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        sessionId: req.headers["mcp-session-id"],
      });

      // Don't send error response if headers already sent
      if (res.headersSent) {
        return next(error);
      }

      this.sendError(res, {
        type: HttpTransportErrorType.TRANSPORT_INIT_ERROR,
        statusCode: 500,
        message: "Internal Server Error",
        context: {
          requestId,
          error: error.message,
        },
      });
    };
  }

  /**
   * Sets up HTTP routes for MCP communication
   */
  private setupRoutes(): void {
    // Main MCP endpoint for client-to-server communication
    this.app.post("/mcp", this.handleMcpPost.bind(this));

    // MCP endpoint for server-to-client notifications via SSE
    this.app.get("/mcp", this.handleMcpGet.bind(this));

    // MCP endpoint for session termination
    this.app.delete("/mcp", this.handleMcpDelete.bind(this));

    // Health check endpoint
    this.app.get("/health", this.handleHealthCheck.bind(this));

    // Session statistics endpoint
    this.app.get("/sessions", this.handleSessionsEndpoint.bind(this));
  }

  /**
   * Handles POST requests for MCP communication
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  private async handleMcpPost(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.sessions.has(sessionId)) {
        // Reuse existing session
        const session = this.sessions.get(sessionId)!;
        transport = session.transport;
        session.lastActivity = new Date();

        logger.debug("Reusing existing session", { sessionId });
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // Create new session for initialization request
        transport = await this.createNewSession();

        logger.debug("Created new session for initialization", {
          sessionId: transport.sessionId,
        });
      } else {
        // Invalid request
        this.sendError(res, {
          type: HttpTransportErrorType.SESSION_NOT_FOUND,
          statusCode: 400,
          message: "Bad Request: No valid session ID provided",
        });
        return;
      }

      // Handle the request through the transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error("Error handling MCP POST request", { error });
      this.sendError(res, {
        type: HttpTransportErrorType.TRANSPORT_INIT_ERROR,
        statusCode: 500,
        message: "Internal server error",
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Handles GET requests for server-to-client notifications
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  private async handleMcpGet(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (!sessionId || !this.sessions.has(sessionId)) {
        this.sendError(res, {
          type: HttpTransportErrorType.SESSION_NOT_FOUND,
          statusCode: 400,
          message: "Invalid or missing session ID",
        });
        return;
      }

      const session = this.sessions.get(sessionId)!;
      session.lastActivity = new Date();

      await session.transport.handleRequest(req, res);

      logger.debug("Handled SSE request", { sessionId });
    } catch (error) {
      logger.error("Error handling MCP GET request", { error });
      this.sendError(res, {
        type: HttpTransportErrorType.TRANSPORT_INIT_ERROR,
        statusCode: 500,
        message: "Internal server error",
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Handles DELETE requests for session termination
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  private async handleMcpDelete(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (!sessionId || !this.sessions.has(sessionId)) {
        this.sendError(res, {
          type: HttpTransportErrorType.SESSION_NOT_FOUND,
          statusCode: 400,
          message: "Invalid or missing session ID",
        });
        return;
      }

      const session = this.sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);

      // Clean up session
      this.terminateSession(sessionId);

      logger.info("Session terminated", { sessionId });
    } catch (error) {
      logger.error("Error handling MCP DELETE request", { error });
      this.sendError(res, {
        type: HttpTransportErrorType.TRANSPORT_INIT_ERROR,
        statusCode: 500,
        message: "Internal server error",
        context: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Handles health check requests
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  private handleHealthCheck(req: Request, res: Response): void {
    const stats = this.getStats();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      ...stats,
    });
  }

  /**
   * Handles session statistics requests
   *
   * @param req - Express request object
   * @param res - Express response object
   */
  private handleSessionsEndpoint(req: Request, res: Response): void {
    const sessionStats = this.getSessionStats();
    res.json(sessionStats);
  }

  /**
   * Creates a new MCP session with transport
   *
   * @returns New StreamableHTTPServerTransport instance
   */
  private async createNewSession(): Promise<StreamableHTTPServerTransport> {
    // Create a new MCP server instance for this session to avoid conflicts
    const mcpServer = this.mcpServerFactory();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        const session: HttpTransportSession = {
          sessionId,
          transport,
          createdAt: new Date(),
          lastActivity: new Date(),
        };

        this.sessions.set(sessionId, session);
        this.totalSessionsCreated++;

        logger.debug("Session initialized and stored", { sessionId });
      },
      // DNS rebinding protection will be added in security implementation task
      // enableDnsRebindingProtection: true,
      // allowedHosts: this.config.security.allowedHosts,
      // allowedOrigins: this.config.security.allowedOrigins,
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        this.terminateSession(transport.sessionId);
      }
    };

    // Connect the new MCP server instance to the transport
    await mcpServer.connect(transport);

    return transport;
  }

  /**
   * Terminates a session and cleans up resources
   *
   * @param sessionId - Session ID to terminate
   */
  private terminateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.transport.close();
      this.sessions.delete(sessionId);
      this.totalSessionsTerminated++;

      logger.debug("Session cleaned up", {
        sessionId,
        activeSessions: this.sessions.size,
      });
    }
  }

  /**
   * Sets up periodic session cleanup for expired sessions
   */
  private setupSessionCleanup(): void {
    const cleanupInterval = Math.min(
      this.options.sessionTimeout! / 4,
      5 * 60 * 1000
    ); // Max 5 minutes

    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const expiredSessions: string[] = [];

      for (const [sessionId, session] of this.sessions.entries()) {
        const timeSinceLastActivity =
          now.getTime() - session.lastActivity.getTime();
        if (timeSinceLastActivity > this.options.sessionTimeout!) {
          expiredSessions.push(sessionId);
        }
      }

      expiredSessions.forEach((sessionId) => {
        logger.info("Session expired, cleaning up", { sessionId });
        this.terminateSession(sessionId);
      });

      if (expiredSessions.length > 0) {
        logger.debug("Session cleanup completed", {
          expiredSessions: expiredSessions.length,
          activeSessions: this.sessions.size,
        });
      }
    }, cleanupInterval);
  }

  /**
   * Sends an error response
   *
   * @param res - Express response
   * @param error - Error information
   */
  private sendError(res: Response, error: Partial<HttpTransportError>): void {
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: error.message || "Internal server error",
          data: error.context,
        },
        id: null,
      });
    }
  }

  /**
   * Gets session statistics
   *
   * @returns Session statistics
   */
  public getSessionStats(): SessionStats {
    const now = new Date();
    let totalDuration = 0;
    let sessionsWithDuration = 0;

    for (const session of this.sessions.values()) {
      const duration = now.getTime() - session.createdAt.getTime();
      totalDuration += duration;
      sessionsWithDuration++;
    }

    return {
      activeSessions: this.sessions.size,
      totalSessionsCreated: this.totalSessionsCreated,
      totalSessionsTerminated: this.totalSessionsTerminated,
      averageSessionDuration:
        sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0,
    };
  }

  /**
   * Gets comprehensive service statistics and current status
   *
   * @returns Service statistics object
   */
  public getStats() {
    return {
      isRunning: this.isRunning,
      activeSessions: this.sessions.size,
      totalSessionsCreated: this.totalSessionsCreated,
      totalSessionsTerminated: this.totalSessionsTerminated,
      uptime: this.isRunning ? Date.now() - this.startTime.getTime() : 0,
      port: this.config.port,
      host: this.config.host,
      https: this.config.https.enabled,
    };
  }

  /**
   * Starts the HTTP server
   *
   * @returns Promise that resolves when server is listening
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("HTTP transport service is already running");
    }

    return new Promise((resolve, reject) => {
      try {
        if (this.config.https.enabled) {
          this.startHttpsServer(resolve, reject);
        } else {
          this.startHttpServer(resolve, reject);
        }
      } catch (error) {
        logger.error("Failed to start HTTP server", { error });
        reject(error);
      }
    });
  }

  /**
   * Starts HTTP server
   *
   * @param resolve - Promise resolve callback
   * @param reject - Promise reject callback
   */
  private startHttpServer(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    this.server = this.app.listen(this.config.port, this.config.host, () => {
      this.isRunning = true;
      this.startTime = new Date();
      logger.info("HTTP transport service started", {
        host: this.config.host,
        port: this.config.port,
        protocol: "http",
      });
      resolve();
    });

    this.server.on("error", (error: Error) => {
      logger.error("HTTP server error", { error });
      reject(error);
    });
  }

  /**
   * Starts HTTPS server
   *
   * @param resolve - Promise resolve callback
   * @param reject - Promise reject callback
   */
  private startHttpsServer(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    try {
      this.validateHttpsConfig();

      const httpsOptions = {
        cert: fs.readFileSync(this.config.https.certPath!),
        key: fs.readFileSync(this.config.https.keyPath!),
      };

      this.server = https.createServer(httpsOptions, this.app);

      this.server.listen(this.config.port, this.config.host, () => {
        this.isRunning = true;
        this.startTime = new Date();
        logger.info("HTTPS transport service started", {
          host: this.config.host,
          port: this.config.port,
          protocol: "https",
          certPath: this.config.https.certPath,
        });
        resolve();
      });

      this.server.on("error", (error: Error) => {
        logger.error("HTTPS server error", { error });
        reject(error);
      });
    } catch (error) {
      logger.error("HTTPS server startup failed", { error });
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Validates HTTPS configuration
   *
   * @throws Error if HTTPS configuration is invalid
   */
  private validateHttpsConfig(): void {
    if (!this.config.https.certPath || !this.config.https.keyPath) {
      throw new Error("HTTPS requires both certPath and keyPath");
    }

    try {
      fs.accessSync(this.config.https.certPath, fs.constants.R_OK);
      fs.accessSync(this.config.https.keyPath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`HTTPS certificate files not accessible: ${error}`);
    }
  }

  /**
   * Stops the HTTP server
   *
   * @returns Promise that resolves when server is stopped
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server || !this.isRunning) {
        logger.warn(
          "Attempted to stop HTTP transport service that is not running"
        );
        resolve();
        return;
      }

      // Clear cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
      }

      // Close all active sessions
      for (const [sessionId, session] of this.sessions.entries()) {
        try {
          session.transport.close();
          this.sessions.delete(sessionId);
          this.totalSessionsTerminated++;
        } catch (error) {
          logger.warn("Error closing session during shutdown", {
            sessionId,
            error,
          });
        }
      }

      // Close the server
      this.server.close(() => {
        this.isRunning = false;
        logger.info("HTTP transport service stopped");
        resolve();
      });
    });
  }
}
