/**
 * Parameter validation utilities for quote requests
 *
 * This module provides comprehensive validation for quote request parameters,
 * ensuring data integrity and proper error handling throughout the application.
 */

import {
  ValidationResult,
  ValidationSuccess,
  ValidationError,
  QuoteRequestParameters,
  RawQuoteRequestParameters,
} from "../types/validation-types.js";
import { logger } from "./logger.js";

/**
 * Validates and sanitizes quote request parameters
 *
 * This function performs comprehensive validation of all parameters required
 * for quote requests, including type checking, range validation, and sanitization.
 *
 * @param rawParams - The raw parameters to validate
 * @returns ValidationResult containing either validated parameters or error details
 *
 * @example
 * ```typescript
 * const result = validateQuoteParameters({
 *   person: "Albert Einstein",
 *   topic: "science",
 *   numberOfQuotes: 5
 * });
 *
 * if (result.success) {
 *   console.log("Validated params:", result.data);
 * } else {
 *   console.error("Validation errors:", result.errors);
 * }
 * ```
 */
export function validateQuoteParameters(
  rawParams: RawQuoteRequestParameters
): ValidationResult {
  logger.debug("Starting parameter validation", { rawParams });

  const errors: string[] = [];
  let person: string | undefined;
  let topic: string | undefined;
  let numberOfQuotes: number | undefined;

  // Validate person parameter
  const personValidation = validatePersonParameter(rawParams.person);
  if (personValidation.success) {
    person = personValidation.value;
  } else {
    errors.push(...personValidation.errors);
  }

  // Validate topic parameter (optional)
  const topicValidation = validateTopicParameter(rawParams.topic);
  if (topicValidation.success) {
    topic = topicValidation.value;
  } else {
    errors.push(...topicValidation.errors);
  }

  // Validate numberOfQuotes parameter
  const numberOfQuotesValidation = validateNumberOfQuotesParameter(
    rawParams.numberOfQuotes
  );
  if (numberOfQuotesValidation.success) {
    numberOfQuotes = numberOfQuotesValidation.value;
  } else {
    errors.push(...numberOfQuotesValidation.errors);
  }

  // Return validation result
  if (errors.length > 0) {
    logger.debug("Parameter validation failed", { errors, rawParams });
    return {
      success: false,
      errors,
    } as ValidationError;
  }

  const validatedParams: QuoteRequestParameters = {
    person: person!,
    topic,
    numberOfQuotes: numberOfQuotes!,
  };

  logger.debug("Parameter validation succeeded", { validatedParams });
  return {
    success: true,
    data: validatedParams,
  } as ValidationSuccess;
}

/**
 * Internal validation result for individual parameters
 */
interface ParameterValidationResult<T> {
  success: boolean;
  value?: T;
  errors: string[];
}

/**
 * Validates the person parameter
 *
 * @param person - The raw person parameter
 * @returns Validation result with sanitized value or errors
 */
function validatePersonParameter(
  person: unknown
): ParameterValidationResult<string> {
  // Check if person is provided
  if (person === null || person === undefined) {
    return {
      success: false,
      errors: ["Person parameter is required"],
    };
  }

  // Check if person is a string
  if (typeof person !== "string") {
    return {
      success: false,
      errors: ["Person parameter must be a string"],
    };
  }

  // Trim whitespace
  const trimmedPerson = person.trim();

  // Check if person is empty after trimming
  if (trimmedPerson.length === 0) {
    return {
      success: false,
      errors: ["Person parameter cannot be empty"],
    };
  }

  return {
    success: true,
    value: trimmedPerson,
    errors: [],
  };
}

/**
 * Validates the topic parameter (optional)
 *
 * @param topic - The raw topic parameter
 * @returns Validation result with sanitized value or errors
 */
function validateTopicParameter(
  topic: unknown
): ParameterValidationResult<string | undefined> {
  // Topic is optional, so undefined is valid
  if (topic === null || topic === undefined) {
    return {
      success: true,
      value: undefined,
      errors: [],
    };
  }

  // Check if topic is a string
  if (typeof topic !== "string") {
    return {
      success: false,
      errors: ["Topic parameter must be a string when provided"],
    };
  }

  // Trim whitespace
  const trimmedTopic = topic.trim();

  // If topic becomes empty after trimming, treat as undefined
  if (trimmedTopic.length === 0) {
    return {
      success: true,
      value: undefined,
      errors: [],
    };
  }

  return {
    success: true,
    value: trimmedTopic,
    errors: [],
  };
}

/**
 * Validates the numberOfQuotes parameter
 *
 * @param numberOfQuotes - The raw numberOfQuotes parameter
 * @returns Validation result with validated value or errors
 */
function validateNumberOfQuotesParameter(
  numberOfQuotes: unknown
): ParameterValidationResult<number> {
  // Check if numberOfQuotes is provided
  if (numberOfQuotes === null || numberOfQuotes === undefined) {
    return {
      success: false,
      errors: ["Number of quotes parameter is required"],
    };
  }

  // Check if numberOfQuotes is a number
  if (typeof numberOfQuotes !== "number") {
    return {
      success: false,
      errors: ["Number of quotes parameter must be a number"],
    };
  }

  // Check if numberOfQuotes is an integer
  if (!Number.isInteger(numberOfQuotes)) {
    return {
      success: false,
      errors: ["Number of quotes parameter must be an integer"],
    };
  }

  // Check if numberOfQuotes is in valid range (1-10 as per ADR 004)
  if (numberOfQuotes < 1 || numberOfQuotes > 10) {
    return {
      success: false,
      errors: ["Number of quotes parameter must be between 1 and 10"],
    };
  }

  return {
    success: true,
    value: numberOfQuotes,
    errors: [],
  };
}
