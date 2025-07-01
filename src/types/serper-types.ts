/**
 * TypeScript interfaces for Serper.dev API integration
 *
 * This module defines the type definitions for interacting with the serper.dev API,
 * including request/response structures and internal quote search parameters.
 */

/**
 * Interface for Serper.dev search request parameters
 */
export interface SerperSearchRequest {
  /** Search query string */
  q: string;
  /** Country code for search localization (e.g., 'us', 'uk') */
  gl?: string;
  /** Language code for search results (e.g., 'en', 'es') */
  hl?: string;
  /** Number of search results to return */
  num?: number;
}

/**
 * Interface for individual search result items from Serper.dev
 */
export interface SerperSearchResult {
  /** Organic search results array */
  organic?: Array<{
    /** Title of the search result */
    title: string;
    /** Snippet/description of the search result */
    snippet: string;
    /** URL link to the search result */
    link: string;
  }>;
  /** Knowledge graph information if available */
  knowledgeGraph?: {
    /** Title from knowledge graph */
    title: string;
    /** Description from knowledge graph */
    description: string;
  };
}

/**
 * Interface for complete Serper.dev API response
 */
export interface SerperApiResponse {
  /** Organic search results */
  organic: SerperSearchResult["organic"];
  /** Knowledge graph data */
  knowledgeGraph: SerperSearchResult["knowledgeGraph"];
}

/**
 * Interface for quote search parameters used internally by the quote service
 */
export interface QuoteSearchParams {
  /** The person to search quotes for (required) */
  person: string;
  /** Optional topic to narrow down the quote search */
  topic?: string;
}
