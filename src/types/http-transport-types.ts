import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**
 * HTTP server configuration interface
 *
 * Defines the structure for HTTP transport server configuration options.
 * Used to configure Express server settings, HTTPS options, and security parameters.
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
 * HTTP transport session interface
 *
 * Represents an active HTTP transport session with its associated metadata.
 * Used for session management and tracking active connections.
 */
export interface HttpTransportSession {
  /** Unique session identifier */
  sessionId: string;
  /** StreamableHTTPServerTransport instance for this session */
  transport: StreamableHTTPServerTransport;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
}

/**
 * HTTP server options interface
 *
 * Configuration options for the Express server instance.
 * Includes middleware settings and transport-specific options.
 */
export interface HttpServerOptions {
  /** JSON payload size limit */
  jsonLimit?: string;
  /** Enable request logging */
  enableLogging?: boolean;
  /** Custom middleware functions */
  middleware?: Array<(req: any, res: any, next: any) => void>;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
}

/**
 * Session management statistics interface
 *
 * Provides metrics about active HTTP transport sessions.
 * Used for monitoring and debugging session lifecycle.
 */
export interface SessionStats {
  /** Total number of active sessions */
  activeSessions: number;
  /** Total sessions created since server start */
  totalSessionsCreated: number;
  /** Total sessions terminated since server start */
  totalSessionsTerminated: number;
  /** Average session duration in milliseconds */
  averageSessionDuration: number;
}

/**
 * HTTP transport error types
 *
 * Enumeration of possible HTTP transport error categories.
 * Used for error classification and handling.
 */
export enum HttpTransportErrorType {
  /** Invalid session ID provided */
  INVALID_SESSION = "INVALID_SESSION",
  /** Session not found */
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  /** HTTPS configuration error */
  HTTPS_CONFIG_ERROR = "HTTPS_CONFIG_ERROR",
  /** Express server startup error */
  SERVER_STARTUP_ERROR = "SERVER_STARTUP_ERROR",
  /** Transport initialization error */
  TRANSPORT_INIT_ERROR = "TRANSPORT_INIT_ERROR",
  /** Session timeout error */
  SESSION_TIMEOUT = "SESSION_TIMEOUT",
}

/**
 * HTTP transport error interface
 *
 * Structured error information for HTTP transport operations.
 * Provides consistent error handling across the HTTP transport layer.
 */
export interface HttpTransportError extends Error {
  /** Error type classification */
  type: HttpTransportErrorType;
  /** HTTP status code to return */
  statusCode: number;
  /** Additional error context */
  context?: Record<string, any>;
  /** Session ID if applicable */
  sessionId?: string;
}
