/**
 * TypeScript interfaces for parameter validation
 *
 * These types define the structure for parameter validation results and
 * quote request parameters used throughout the validation system.
 */

/**
 * Base validation result interface
 */
interface BaseValidationResult {
  /** Whether the validation succeeded */
  readonly success: boolean;
}

/**
 * Successful validation result
 */
export interface ValidationSuccess extends BaseValidationResult {
  readonly success: true;
  /** The validated and sanitized parameters */
  readonly data: QuoteRequestParameters;
}

/**
 * Failed validation result
 */
export interface ValidationError extends BaseValidationResult {
  readonly success: false;
  /** Array of validation error messages */
  readonly errors: readonly string[];
  /** The field that caused the validation error */
  readonly field?: string;
}

/**
 * Discriminated union for validation results
 *
 * Uses TypeScript's discriminated unions for type safety
 */
export type ValidationResult = ValidationSuccess | ValidationError;

/**
 * Validated quote request parameters
 *
 * Represents the clean, validated parameters ready for use
 */
export interface QuoteRequestParameters {
  /** The person to get quotes from (required, non-empty, trimmed) */
  readonly person: string;
  /** Optional topic to filter quotes by (trimmed if provided) */
  readonly topic?: string;
  /** Number of quotes to retrieve (1-10, integer) */
  readonly numberOfQuotes: number;
}

/**
 * Raw quote request parameters before validation
 *
 * Represents the input parameters before validation and sanitization
 */
export interface RawQuoteRequestParameters {
  /** The person parameter (may be empty, untrimmed, or invalid) */
  readonly person: unknown;
  /** Optional topic parameter (may be invalid type) */
  readonly topic?: unknown;
  /** Number of quotes parameter (may be invalid type or range) */
  readonly numberOfQuotes: unknown;
}

/**
 * Specific validation error types for different failure scenarios
 */
export interface PersonValidationError extends ValidationError {
  readonly field: "person";
  readonly errorType: "empty" | "whitespace_only" | "invalid_type";
}

export interface TopicValidationError extends ValidationError {
  readonly field: "topic";
  readonly errorType: "invalid_type";
}

export interface NumberOfQuotesValidationError extends ValidationError {
  readonly field: "numberOfQuotes";
  readonly errorType: "invalid_type" | "out_of_range" | "not_integer";
}

/**
 * Union type for all specific validation errors
 */
export type SpecificValidationError =
  | PersonValidationError
  | TopicValidationError
  | NumberOfQuotesValidationError;
