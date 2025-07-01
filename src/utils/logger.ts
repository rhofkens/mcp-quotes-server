/**
 * Winston logging configuration for MCP Quotes Server
 *
 * This module provides centralized logging functionality with file-only transports
 * to avoid interfering with MCP stdio communication. It includes sensitive data
 * protection and structured JSON logging.
 */

import winston from "winston";

/**
 * Main Winston logger instance configured for file-only output
 *
 * Features:
 * - File-only transports (no console output to avoid MCP stdio interference)
 * - JSON format for structured logging
 * - Separate error log file for error-level messages
 * - Timestamp and stack trace support
 */
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "errors.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

/**
 * Helper function to safely log API requests without exposing sensitive data
 *
 * This function automatically masks API keys and other sensitive information
 * from URLs and request parameters to prevent security leaks in log files.
 *
 * @param url - The API endpoint URL being called
 * @param method - HTTP method (GET, POST, etc.)
 * @param params - Request parameters object
 */
export const logApiRequest = (
  url: string,
  method: string,
  params: any
): void => {
  logger.info("API Request", {
    url: url.replace(/[?&]key=[^&]*/, "?key=***"), // Mask API key in URL
    method,
    params: { ...params, key: undefined }, // Remove key from logged params
  });
};

/**
 * Helper function to safely log API responses without exposing sensitive data
 *
 * @param url - The API endpoint URL that was called
 * @param statusCode - HTTP status code from the response
 * @param responseSize - Size of the response (optional)
 */
export const logApiResponse = (
  url: string,
  statusCode: number,
  responseSize?: number
): void => {
  logger.info("API Response", {
    url: url.replace(/[?&]key=[^&]*/, "?key=***"), // Mask API key in URL
    statusCode,
    responseSize,
  });
};

/**
 * Helper function to log errors with proper context
 *
 * @param message - Error message
 * @param error - Error object
 * @param context - Additional context information
 */
export const logError = (
  message: string,
  error: Error,
  context?: Record<string, any>
): void => {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    name: error.name,
    ...context,
  });
};
