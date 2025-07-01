/**
 * Custom error classes for Serper.dev API integration
 *
 * This module defines custom error types that provide specific context
 * for different failure scenarios when interacting with the serper.dev API.
 */

/**
 * Custom error class for Serper.dev API-related errors
 *
 * This error is thrown when API calls to serper.dev fail due to network issues,
 * server errors, or invalid responses from the API.
 */
export class SerperApiError extends Error {
  public readonly statusCode?: number;
  public readonly response?: any;

  /**
   * Creates a new SerperApiError instance
   *
   * @param message - Human-readable error message describing the failure
   * @param statusCode - Optional HTTP status code from the failed API request
   * @param response - Optional raw response data from the failed API request
   */
  constructor(message: string, statusCode?: number, response?: any) {
    super(message);
    this.name = "SerperApiError";
    this.statusCode = statusCode;
    this.response = response;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SerperApiError.prototype);
  }
}

/**
 * Custom error class for Serper.dev configuration-related errors
 *
 * This error is thrown when there are issues with the configuration
 * required for serper.dev integration, such as missing API keys.
 */
export class SerperConfigurationError extends Error {
  /**
   * Creates a new SerperConfigurationError instance
   *
   * @param message - Human-readable error message describing the configuration issue
   */
  constructor(message: string) {
    super(message);
    this.name = "SerperConfigurationError";

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SerperConfigurationError.prototype);
  }
}
