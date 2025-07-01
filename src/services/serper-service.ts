/**
 * SerperService class for integrating with Serper.dev API
 *
 * This service handles quote retrieval from Serper.dev with proper error handling,
 * retry logic, and structured logging. It implements the patterns defined in the
 * project's Architecture Decision Records (ADRs).
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import {
  SerperApiError,
  SerperConfigurationError,
} from "../types/serper-errors.js";
import {
  SerperSearchRequest,
  SerperApiResponse,
  QuoteSearchParams,
} from "../types/serper-types.js";
// QuoteRequestParameters type is used implicitly in method signatures
import {
  logger,
  logApiRequest,
  logApiResponse,
  logError,
} from "../utils/logger.js";

/**
 * Service class for interacting with the Serper.dev API
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Comprehensive error handling and logging
 * - API key validation and secure handling
 * - Structured quote search and response parsing
 */
export class SerperService {
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = "https://google.serper.dev";

  /**
   * Creates a new SerperService instance
   *
   * @param apiKey - Serper.dev API key (required)
   * @throws {SerperConfigurationError} When API key is missing or invalid
   */
  constructor(apiKey: string) {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new SerperConfigurationError(
        "Serper API key is required and must be a non-empty string"
      );
    }

    this.apiKey = apiKey.trim();
    this.axiosInstance = this.createAxiosInstance();
    this.setupRetryLogic();
  }

  /**
   * Creates and configures the axios instance with proper headers and timeout
   *
   * @private
   * @returns {AxiosInstance} Configured axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000, // 10 second timeout
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        "User-Agent": "MCP-Quotes-Server/1.0.0",
      },
    });

    // Add request interceptor for logging
    instance.interceptors.request.use(
      (config) => {
        logApiRequest(
          `${config.baseURL}${config.url}`,
          config.method?.toUpperCase() || "UNKNOWN",
          config.data
        );
        return config;
      },
      (error) => {
        logError("Request interceptor error", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    instance.interceptors.response.use(
      (response) => {
        logApiResponse(
          response.config.url || "unknown",
          response.status,
          JSON.stringify(response.data).length
        );
        return response;
      },
      (error) => {
        if (error.response) {
          logApiResponse(error.config?.url || "unknown", error.response.status);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Sets up axios-retry with exponential backoff strategy
   *
   * @private
   */
  private setupRetryLogic(): void {
    axiosRetry(this.axiosInstance, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay, // 1s, 2s, 4s delays
      retryCondition: (error) => {
        // Retry on network errors and 5xx responses
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false)
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        logger.warn("API request retry", {
          retryCount,
          url: requestConfig.url,
          error: error.message,
        });
      },
    });
  }

  /**
   * Constructs search query for finding quotes about a person or topic
   *
   * @private
   * @param params - Search parameters containing person and optional topic
   * @returns {string} Optimized search query string
   */
  private constructSearchQuery(params: QuoteSearchParams): string {
    const { person, topic } = params;

    if (topic && topic.trim().length > 0) {
      return `"${person}" quotes about "${topic.trim()}"`;
    }

    return `"${person}" quotes famous sayings`;
  }

  /**
   * Parses Serper API response to extract the requested number of quotes
   *
   * @private
   * @param response - Raw Serper API response
   * @param searchParams - Original search parameters for context
   * @param numberOfQuotes - Number of quotes to extract (default: 1)
   * @returns {string} Extracted quotes or fallback message
   */
  private parseQuoteFromResponse(
    response: SerperApiResponse,
    searchParams: QuoteSearchParams,
    numberOfQuotes: number = 1
  ): string {
    const { person, topic } = searchParams;
    const foundQuotes: string[] = [];

    // Try to find quotes in organic results
    if (response.organic && response.organic.length > 0) {
      for (const result of response.organic) {
        // Stop if we've found enough quotes
        if (foundQuotes.length >= numberOfQuotes) {
          break;
        }

        // Look for quote patterns in snippets
        const snippet = result.snippet || "";

        // Common quote patterns to detect
        const quotePatterns = [
          /"([^"]+)"/g, // Text in quotes
          /([''])([^']+)\1/g, // Text in single quotes
          /^([^.!?]+[.!?])/, // First sentence
        ];

        for (const pattern of quotePatterns) {
          const matches = snippet.match(pattern);
          if (matches && matches.length > 0) {
            const potentialQuote = matches[0].replace(/['"]/g, "").trim();

            // Validate quote quality (reasonable length, contains meaningful content)
            if (potentialQuote.length > 10 && potentialQuote.length < 500) {
              // Check for duplicates before adding
              if (
                !foundQuotes.some(
                  (existing) =>
                    existing.toLowerCase() === potentialQuote.toLowerCase()
                )
              ) {
                foundQuotes.push(potentialQuote);
                logger.debug("Quote extracted from search results", {
                  person,
                  topic,
                  source: result.title,
                  quoteLength: potentialQuote.length,
                  quotesFound: foundQuotes.length,
                });

                // Stop if we've found enough quotes
                if (foundQuotes.length >= numberOfQuotes) {
                  break;
                }
              }
            }
          }
        }
      }
    }

    // Return found quotes or fallback message
    if (foundQuotes.length > 0) {
      logger.info("Quotes extraction completed", {
        person,
        topic,
        requestedCount: numberOfQuotes,
        foundCount: foundQuotes.length,
      });

      // Format the response based on number of quotes found
      if (foundQuotes.length === 1) {
        return foundQuotes[0]!; // We know it exists since length > 0
      } else {
        return foundQuotes
          .map((quote, index) => `${index + 1}. "${quote}"`)
          .join("\n\n");
      }
    }

    // Fallback if no good quotes found
    const requestedText =
      numberOfQuotes === 1 ? "a quote" : `${numberOfQuotes} quotes`;
    const fallbackMessage = topic
      ? `Unable to find ${requestedText} from ${person} about ${topic}. Try a different topic or check the spelling.`
      : `Unable to find ${requestedText} from ${person}. Please verify the person's name or try a more famous figure.`;

    logger.warn("No suitable quotes found in search results", {
      person,
      topic,
      numberOfQuotes,
      organicResultsCount: response.organic?.length || 0,
    });

    return fallbackMessage;
  }

  /**
   * Retrieves one or more quotes from the specified person, optionally about a specific topic
   *
   * @param params - Quote search parameters (legacy interface)
   * @param numberOfQuotes - Number of quotes to retrieve (1-10)
   * @returns {Promise<string>} The retrieved quotes or an appropriate message
   * @throws {SerperApiError} When API request fails
   * @throws {SerperConfigurationError} When parameters are invalid
   */
  async getQuote(
    params: QuoteSearchParams,
    numberOfQuotes: number = 1
  ): Promise<string> {
    const { person, topic } = params;

    // Validate required parameters
    if (!person || typeof person !== "string" || person.trim().length === 0) {
      throw new SerperConfigurationError(
        "Person parameter is required and must be a non-empty string"
      );
    }

    // Validate optional topic parameter
    if (topic !== undefined && typeof topic !== "string") {
      throw new SerperConfigurationError(
        "Topic parameter must be a string when provided"
      );
    }

    // Validate numberOfQuotes parameter
    if (
      !Number.isInteger(numberOfQuotes) ||
      numberOfQuotes < 1 ||
      numberOfQuotes > 10
    ) {
      throw new SerperConfigurationError(
        "Number of quotes parameter must be an integer between 1 and 10"
      );
    }

    const searchQuery = this.constructSearchQuery({
      person: person.trim(),
      topic,
    });

    const requestPayload: SerperSearchRequest = {
      q: searchQuery,
      gl: "us", // Geographic location
      hl: "en", // Language
      num: Math.max(10, numberOfQuotes * 2), // Request more results when looking for multiple quotes
    };

    try {
      logger.info("Starting quote search", {
        person: person.trim(),
        topic,
        numberOfQuotes,
        searchQuery,
      });

      const response: AxiosResponse<SerperApiResponse> =
        await this.axiosInstance.post("/search", requestPayload);

      if (!response.data) {
        throw new SerperApiError(
          "Empty response received from Serper API",
          200
        );
      }

      const quote = this.parseQuoteFromResponse(
        response.data,
        {
          person: person.trim(),
          topic,
        },
        numberOfQuotes
      );

      logger.info("Quote search completed successfully", {
        person: person.trim(),
        topic,
        numberOfQuotes,
        quoteLength: quote.length,
        successful: !quote.includes("Unable to find"),
      });

      return quote;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 0;
        const errorMessage = error.response?.data?.message || error.message;

        logError("Serper API request failed", error, {
          person: person.trim(),
          topic,
          numberOfQuotes,
          statusCode,
          apiErrorMessage: errorMessage,
        });

        throw new SerperApiError(
          `Failed to retrieve quote from Serper API: ${errorMessage}`,
          statusCode
        );
      }

      // Handle non-HTTP errors
      logError("Unexpected error during quote retrieval", error as Error, {
        person: person.trim(),
        topic,
        numberOfQuotes,
      });

      throw new SerperApiError(
        `Unexpected error during quote retrieval: ${(error as Error).message}`,
        0
      );
    }
  }
}
