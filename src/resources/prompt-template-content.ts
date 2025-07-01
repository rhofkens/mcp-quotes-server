/**
 * Prompt Template Resource Content
 *
 * This module contains the structured prompt template content as defined in ADR 004.
 * It provides template variations, parameter specifications, usage examples, and best practices
 * for effective quote requests using the get_quote tool.
 */

import { PromptTemplateContent } from "../types/resource-types.js";

/**
 * Complete prompt template resource content structure
 *
 * This constant contains the JSON structure that will be exposed via the MCP resource
 * at URI: prompt-template://quote-request
 *
 * @see ADR 004: Prompt Template Resource Structure for Quote Generation
 */
export const PROMPT_TEMPLATE_CONTENT: PromptTemplateContent = {
  template: {
    basic: "Get a quote from {person}",
    withTopic: "Get a quote from {person} about {topic}",
    withCount: "Get {numberOfQuotes} quotes from {person}",
    comprehensive: "Get {numberOfQuotes} quotes from {person} about {topic}",
  },
  parameters: {
    person: {
      type: "string",
      required: true,
      description: "The name of the person to get quotes from",
      validation: "Must not be empty",
    },
    topic: {
      type: "string",
      required: false,
      description: "Optional topic to filter quotes by",
    },
    numberOfQuotes: {
      type: "integer",
      required: true,
      description: "Number of quotes to retrieve",
      validation: "Must be a positive integer between 1 and 10",
    },
  },
  examples: [
    {
      prompt: "Get 3 quotes from Albert Einstein about science",
      parameters: {
        person: "Albert Einstein",
        topic: "science",
        numberOfQuotes: 3,
      },
    },
    {
      prompt: "Get 5 quotes from Maya Angelou about courage",
      parameters: {
        person: "Maya Angelou",
        topic: "courage",
        numberOfQuotes: 5,
      },
    },
    {
      prompt: "Get 1 quote from Winston Churchill",
      parameters: {
        person: "Winston Churchill",
        numberOfQuotes: 1,
      },
    },
    {
      prompt: "Get 10 quotes from Mark Twain about life",
      parameters: {
        person: "Mark Twain",
        topic: "life",
        numberOfQuotes: 10,
      },
    },
  ],
  bestPractices: [
    "Use specific person names for better results",
    "Topics should be general concepts rather than very specific terms",
    "Request reasonable numbers of quotes (1-10) for optimal performance",
    "Consider the context when selecting topics - broader topics yield more results",
    "Historical figures and well-known personalities typically have more available quotes",
    "When no topic is specified, you'll get a broader range of quotes from the person",
  ],
} as const;

/**
 * Get the prompt template resource content
 *
 * This function returns the complete prompt template content structure.
 * It's provided as a function to allow for future extensibility (e.g., dynamic content generation).
 *
 * @returns The complete prompt template resource content
 */
export function getPromptTemplateContent(): PromptTemplateContent {
  return PROMPT_TEMPLATE_CONTENT;
}
