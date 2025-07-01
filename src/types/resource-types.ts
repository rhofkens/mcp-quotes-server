/**
 * TypeScript interfaces for prompt template resource structure
 *
 * These types define the structure of the Prompt Template Resource
 * as specified in ADR 004: Prompt Template Resource Structure
 */

/**
 * Parameter specification for the prompt template
 *
 * Defines the structure of parameter definitions including validation rules
 */
export interface ParameterSpecification {
  /** The parameter type */
  readonly type: string;
  /** Whether the parameter is required */
  readonly required: boolean;
  /** Description of the parameter */
  readonly description: string;
  /** Optional validation rules */
  readonly validation?: string;
}

/**
 * Usage example for the prompt template
 *
 * Provides concrete examples of how to use the template
 */
export interface UsageExample {
  /** The example prompt text */
  readonly prompt: string;
  /** The parameters used in this example */
  readonly parameters: {
    readonly person: string;
    readonly topic?: string;
    readonly numberOfQuotes: number;
  };
}

/**
 * Template variations for different use cases
 *
 * Defines different template formats for various scenarios
 */
export interface TemplateVariations {
  /** Basic template with just person */
  readonly basic: string;
  /** Template with person and topic */
  readonly withTopic: string;
  /** Template with person and number of quotes */
  readonly withCount: string;
  /** Comprehensive template with all parameters */
  readonly comprehensive: string;
}

/**
 * Complete prompt template resource content structure
 *
 * This interface defines the complete JSON structure for the prompt template resource
 * as defined in ADR 004
 */
export interface PromptTemplateContent {
  /** Template variations for different scenarios */
  readonly template: TemplateVariations;
  /** Parameter specifications with validation rules */
  readonly parameters: {
    readonly person: ParameterSpecification;
    readonly topic: ParameterSpecification;
    readonly numberOfQuotes: ParameterSpecification;
  };
  /** Usage examples showing real-world scenarios */
  readonly examples: readonly UsageExample[];
  /** Best practices for effective quote requests */
  readonly bestPractices: readonly string[];
}
