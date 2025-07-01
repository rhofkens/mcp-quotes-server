# Step 2: Serper.dev Integration & Quote Retrieval Logic - Implementation Tasks

## Overview
This document contains the detailed sub-tasks for implementing serper.dev API integration and quote retrieval logic for the MCP Quotes Server, as defined in [`docs/plans/02-serper-dev-integration-quote-retrieval-logic.md`](../plans/02-serper-dev-integration-quote-retrieval-logic.md).

## Prerequisites
- Step 1 (Core MCP Server Setup) must be completed
- Environment variable `SERPER_API_KEY` must be available for testing

## Sub-Tasks (Ordered for Sequential Execution)

### 1. Dependencies and Configuration Setup

#### 1.1 Install Required Dependencies
- **Action**: Install production dependencies for HTTP client, logging, and retry mechanisms
- **Commands**:
  ```bash
  npm install axios axios-retry winston
  npm install --save-dev @types/node
  ```
- **Rationale**: Based on ADR 001 (axios), ADR 002 (winston), ADR 003 (axios-retry)
- **Validation**: Dependencies appear in [`package.json`](../../package.json) under `dependencies`

#### 1.2 Update .gitignore for Log Files
- **Action**: Add log files to `.gitignore` to prevent sensitive information leakage
- **File**: [`.gitignore`](../../.gitignore)
- **Content to Add**:
  ```
  # Log files
  *.log
  combined.log
  errors.log
  ```
- **Rationale**: Based on ADR 002 (logging strategy) security considerations

### 2. TypeScript Interfaces and Types

#### 2.1 Create Serper.dev API Types
- **Action**: Define TypeScript interfaces for serper.dev API request and response structures
- **File**: [`src/types/serper-types.ts`](../../src/types/serper-types.ts)
- **Required Interfaces**:
  ```typescript
  export interface SerperSearchRequest {
    q: string;
    gl?: string;
    hl?: string;
    num?: number;
  }

  export interface SerperSearchResult {
    organic?: Array<{
      title: string;
      snippet: string;
      link: string;
    }>;
    knowledgeGraph?: {
      title: string;
      description: string;
    };
  }

  export interface SerperApiResponse {
    organic: SerperSearchResult['organic'];
    knowledgeGraph: SerperSearchResult['knowledgeGraph'];
  }

  export interface QuoteSearchParams {
    person: string;
    topic?: string;
  }
  ```
- **Compliance**: Follow coding guidelines (PascalCase for interfaces, explicit types)

#### 2.2 Create Custom Error Classes
- **Action**: Define custom error classes for serper.dev integration
- **File**: [`src/types/serper-errors.ts`](../../src/types/serper-errors.ts)
- **Required Classes**:
  ```typescript
  export class SerperApiError extends Error {
    constructor(message: string, public statusCode?: number, public response?: any) {
      super(message);
      this.name = 'SerperApiError';
    }
  }

  export class SerperConfigurationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SerperConfigurationError';
    }
  }
  ```
- **Compliance**: Follow coding guidelines (custom error classes for application-level errors)

### 3. Logging Configuration

#### 3.1 Create Winston Logger Configuration
- **Action**: Implement Winston logging configuration according to ADR 002
- **File**: [`src/utils/logger.ts`](../../src/utils/logger.ts)
- **Implementation**:
  ```typescript
  import winston from 'winston';

  export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'errors.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

  // Helper function to safely log without sensitive data
  export const logApiRequest = (url: string, method: string, params: any) => {
    logger.info('API Request', {
      url: url.replace(/[?&]key=[^&]*/, '?key=***'), // Mask API key
      method,
      params: { ...params, key: undefined } // Remove key from logged params
    });
  };
  ```
- **Compliance**: ADR 002 requirements (file-only, structured format, sensitive data protection)

### 4. Serper.dev Service Implementation

#### 4.1 Create Axios Instance with Configuration
- **Action**: Create configured axios instance for serper.dev API calls
- **File**: [`src/services/serper-service.ts`](../../src/services/serper-service.ts) (partial implementation)
- **Implementation**:
  ```typescript
  import axios, { AxiosInstance } from 'axios';
  import axiosRetry from 'axios-retry';
  import { logger, logApiRequest } from '../utils/logger.js';
  import { SerperConfigurationError } from '../types/serper-errors.js';

  class SerperService {
    private axiosInstance: AxiosInstance;
    private readonly apiKey: string;

    constructor() {
      this.apiKey = process.env.SERPER_API_KEY || '';
      if (!this.apiKey) {
        throw new SerperConfigurationError('SERPER_API_KEY environment variable is required');
      }

      this.axiosInstance = axios.create({
        baseURL: 'https://google.serper.dev',
        timeout: 10000,
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      this.setupRetryMechanism();
      this.setupInterceptors();
    }

    private setupRetryMechanism(): void {
      axiosRetry(this.axiosInstance, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error) => {
          return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                 (error.response?.status >= 500) ||
                 (error.response?.status === 429);
        },
        onRetry: (retryCount, error) => {
          logger.warn(`Retrying serper.dev API call (attempt ${retryCount}):`, {
            error: error.message,
            status: error.response?.status
          });
        }
      });
    }

    private setupInterceptors(): void {
      this.axiosInstance.interceptors.request.use((config) => {
        logApiRequest(config.url || '', config.method?.toUpperCase() || 'GET', config.data);
        return config;
      });
    }
  }
  ```
- **Compliance**: ADR 001 (axios), ADR 003 (retry strategy), coding guidelines (class naming, async/await)

#### 4.2 Implement Search Query Construction
- **Action**: Add method to construct search queries from person and topic parameters
- **File**: [`src/services/serper-service.ts`](../../src/services/serper-service.ts) (continuation)
- **Implementation**:
  ```typescript
  private buildSearchQuery(person: string, topic?: string): string {
    // Construct search query to find quotes
    const baseQuery = `"${person}" quotes`;
    return topic ? `${baseQuery} "${topic}"` : baseQuery;
  }

  private buildSearchRequest(person: string, topic?: string): SerperSearchRequest {
    return {
      q: this.buildSearchQuery(person, topic),
      num: 10, // Request more results to have options for parsing
      gl: 'us', // Country
      hl: 'en'  // Language
    };
  }
  ```
- **Compliance**: Private methods, explicit typing, JSDoc required in next sub-task

#### 4.3 Implement API Call Method
- **Action**: Add method to make API calls to serper.dev
- **File**: [`src/services/serper-service.ts`](../../src/services/serper-service.ts) (continuation)
- **Implementation**:
  ```typescript
  private async makeSearchRequest(searchRequest: SerperSearchRequest): Promise<SerperApiResponse> {
    try {
      const response = await this.axiosInstance.post('/search', searchRequest);
      logger.info('Serper.dev API call successful', { 
        resultCount: response.data.organic?.length || 0 
      });
      return response.data;
    } catch (error: any) {
      logger.error('Serper.dev API call failed', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw new SerperApiError(
        `API call failed: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
  }
  ```
- **Compliance**: Error handling patterns, async/await, logging requirements

#### 4.4 Implement Response Parsing Logic
- **Action**: Add method to parse API response and extract quotes
- **File**: [`src/services/serper-service.ts`](../../src/services/serper-service.ts) (continuation)
- **Implementation**:
  ```typescript
  private parseQuotesFromResponse(response: SerperApiResponse, person: string): string[] {
    const quotes: string[] = [];
    
    // Extract quotes from organic search results
    if (response.organic) {
      for (const result of response.organic) {
        const extractedQuotes = this.extractQuotesFromText(result.snippet, person);
        quotes.push(...extractedQuotes);
        
        if (result.title.includes('"') && result.title.toLowerCase().includes(person.toLowerCase())) {
          const titleQuote = this.cleanQuoteText(result.title);
          if (titleQuote) quotes.push(titleQuote);
        }
      }
    }

    // Extract from knowledge graph if available
    if (response.knowledgeGraph?.description) {
      const kgQuotes = this.extractQuotesFromText(response.knowledgeGraph.description, person);
      quotes.push(...kgQuotes);
    }

    // Remove duplicates and return
    return [...new Set(quotes)].filter(quote => quote.length > 10);
  }

  private extractQuotesFromText(text: string, person: string): string[] {
    const quotes: string[] = [];
    
    // Pattern to match quoted text
    const quoteRegex = /"([^"]+)"/g;
    let match;
    
    while ((match = quoteRegex.exec(text)) !== null) {
      const quote = match[1].trim();
      if (quote.length > 10 && !quote.toLowerCase().includes('read more')) {
        quotes.push(this.cleanQuoteText(quote));
      }
    }
    
    return quotes.filter(Boolean);
  }

  private cleanQuoteText(quote: string): string {
    return quote
      .replace(/^["']+|["']+$/g, '') // Remove surrounding quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  ```
- **Compliance**: Private methods, explicit return types, helper functions

#### 4.5 Implement Public getQuote Method
- **Action**: Add main public method for quote retrieval
- **File**: [`src/services/serper-service.ts`](../../src/services/serper-service.ts) (continuation)
- **Implementation**:
  ```typescript
  /**
   * Retrieves quotes for a specific person and optional topic
   * @param person - The person to find quotes for (required)
   * @param topic - Optional topic to narrow down the search
   * @returns Promise<string[]> - Array of quote strings
   * @throws SerperApiError - When API call fails
   * @throws SerperConfigurationError - When configuration is invalid
   */
  public async getQuote(person: string, topic?: string): Promise<string[]> {
    if (!person || person.trim().length === 0) {
      throw new Error('Person parameter is required and cannot be empty');
    }

    logger.info('Starting quote search', { person, topic });

    try {
      const searchRequest = this.buildSearchRequest(person, topic);
      const response = await this.makeSearchRequest(searchRequest);
      const quotes = this.parseQuotesFromResponse(response, person);

      logger.info('Quote search completed', { 
        person, 
        topic, 
        quotesFound: quotes.length 
      });

      return quotes;
    } catch (error) {
      logger.error('Quote search failed', { person, topic, error: (error as Error).message });
      throw error;
    }
  }
  ```
- **Compliance**: JSDoc comments, explicit types, error handling, logging

#### 4.6 Export Service Instance
- **Action**: Export singleton instance of SerperService
- **File**: [`src/services/serper-service.ts`](../../src/services/serper-service.ts) (end of file)
- **Implementation**:
  ```typescript
  // Export singleton instance
  export const serperService = new SerperService();
  ```
- **Compliance**: Export pattern for services

### 5. Update MCP Tool Handler

#### 5.1 Update get_quote Tool Implementation
- **Action**: Update the existing get_quote tool handler to use serperService
- **File**: [`src/index.ts`](../../src/index.ts) (update existing tool registration)
- **Implementation**:
  ```typescript
  import { z } from "zod";
  import { serperService } from "./services/serper-service.js";
  import { logger } from "./utils/logger.js";

  // Update the existing get_quote tool registration
  server.registerTool(
    "get_quote",
    {
      title: "Get Quote",
      description: "Retrieves quotes from a specific person, optionally filtered by topic",
      inputSchema: {
        person: z.string().min(1, "Person name is required"),
        topic: z.string().optional()
      }
    },
    async ({ person, topic }) => {
      try {
        logger.info('get_quote tool called', { person, topic });
        
        const quotes = await serperService.getQuote(person, topic);
        
        if (quotes.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No quotes found for ${person}${topic ? ` about ${topic}` : ''}.`
            }]
          };
        }

        // Return all found quotes as formatted text
        const formattedQuotes = quotes
          .slice(0, 5) // Limit to first 5 quotes
          .map((quote, index) => `${index + 1}. "${quote}"`)
          .join('\n\n');

        return {
          content: [{
            type: "text",
            text: `Quotes from ${person}${topic ? ` about ${topic}` : ''}:\n\n${formattedQuotes}`
          }]
        };

      } catch (error: any) {
        logger.error('get_quote tool error', { 
          person, 
          topic, 
          error: error.message,
          stack: error.stack 
        });

        return {
          content: [{
            type: "text", 
            text: `Error retrieving quotes: ${error.message || 'Unknown error occurred'}`
          }],
          isError: true
        };
      }
    }
  );
  ```
- **Compliance**: MCP SDK patterns, error handling, logging, zod validation

### 6. Testing Implementation

#### 6.1 Create Unit Tests for SerperService
- **Action**: Create comprehensive unit tests for the serperService module
- **File**: [`src/services/serper-service.test.ts`](../../src/services/serper-service.test.ts)
- **Test Coverage**:
  - Constructor with valid/invalid API key
  - Search query construction with/without topic
  - API response parsing with various response formats
  - Error handling for different failure scenarios
  - Retry mechanism behavior
- **Implementation Pattern**:
  ```typescript
  import { jest } from '@jest/globals';
  import axios from 'axios';
  import { serperService } from './serper-service.js';
  
  // Mock axios and environment variables
  jest.mock('axios');
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  describe('SerperService', () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = 'test-api-key';
      jest.clearAllMocks();
    });

    describe('getQuote', () => {
      test('should return quotes for valid person', async () => {
        // Mock successful API response
        mockedAxios.create.mockReturnValue({
          post: jest.fn().mockResolvedValue({
            data: {
              organic: [
                { title: 'Test Quote', snippet: '"This is a test quote"' }
              ]
            }
          })
        } as any);

        const quotes = await serperService.getQuote('Test Person');
        expect(quotes).toHaveLength(1);
        expect(quotes[0]).toBe('This is a test quote');
      });
      
      // Additional test cases...
    });
  });
  ```
- **Compliance**: Jest testing framework, 70% coverage target

#### 6.2 Create Integration Tests for get_quote Tool
- **Action**: Create integration tests for the MCP tool functionality
- **File**: [`src/index.test.ts`](../../src/index.test.ts) (add to existing test file)
- **Test Coverage**:
  - End-to-end tool execution with mocked serper.dev API
  - Error handling and MCP error response format
  - Input validation (required person parameter)
  - Response formatting and structure
- **Implementation Pattern**:
  ```typescript
  describe('get_quote tool integration', () => {
    test('should handle successful quote retrieval', async () => {
      // Mock serperService
      const mockGetQuote = jest.fn().mockResolvedValue(['Test quote']);
      jest.doMock('./services/serper-service.js', () => ({
        serperService: { getQuote: mockGetQuote }
      }));

      // Test tool execution
      const result = await server.callTool('get_quote', { person: 'Test Person' });
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Test quote');
    });

    test('should handle API errors gracefully', async () => {
      const mockGetQuote = jest.fn().mockRejectedValue(new Error('API Error'));
      jest.doMock('./services/serper-service.js', () => ({
        serperService: { getQuote: mockGetQuote }
      }));

      const result = await server.callTool('get_quote', { person: 'Test Person' });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error retrieving quotes');
    });
  });
  ```
- **Compliance**: Integration testing approach, error scenario coverage

#### 6.3 Verify Code Coverage
- **Action**: Run tests and verify 70% code coverage target is met
- **Commands**:
  ```bash
  npm test -- --coverage
  ```
- **Validation**: Coverage report shows ≥70% for all new modules
- **Remediation**: Add additional test cases if coverage is below target

### 7. Documentation Updates

#### 7.1 Update README.md with Serper.dev Setup
- **Action**: Add serper.dev configuration instructions to main README
- **File**: [`README.md`](../../README.md)
- **Content to Add**:
  ```markdown
  ## Environment Setup

  ### Serper.dev API Configuration

  1. Sign up for a free account at [serper.dev](https://serper.dev)
  2. Obtain your API key from the dashboard
  3. Set the environment variable:
     ```bash
     export SERPER_API_KEY=your_api_key_here
     ```
  4. For persistent setup, add to your shell profile (`.bashrc`, `.zshrc`, etc.)

  ### Usage Examples

  The `get_quote` tool accepts the following parameters:
  - `person` (required): The person to find quotes for
  - `topic` (optional): Optional topic to narrow down the search

  Example usage:
  ```json
  {
    "name": "get_quote",
    "arguments": {
      "person": "Albert Einstein",
      "topic": "science"
    }
  }
  ```

  ### API Limitations

  - Rate limit: 2,500 searches per month (free tier)
  - Rate limit: 100 searches per hour
  - Quote availability depends on search results from Google
  ```
- **Compliance**: Clear setup instructions, usage examples, limitations documentation

#### 7.2 Add JSDoc Comments to All New Functions
- **Action**: Ensure all exported functions and classes have comprehensive JSDoc comments
- **Files**: All files created in previous sub-tasks
- **Requirements**:
  - Function purpose and behavior
  - Parameter descriptions with types
  - Return value descriptions
  - Exception/error conditions
  - Usage examples where helpful
- **Validation**: ESLint rules should pass for documentation requirements

### 8. Final Integration and Validation

#### 8.1 Manual Testing with MCP Inspector
- **Action**: Test the implementation using MCP Inspector tool
- **Commands**:
  ```bash
  npm run build
  npx @modelcontextprotocol/inspector dist/start.js
  ```
- **Test Cases**:
  - Valid person without topic
  - Valid person with topic  
  - Invalid/empty person parameter
  - Network error simulation (temporarily invalid API key)
- **Validation**: All test cases return appropriate responses via MCP protocol

#### 8.2 Verify Log File Generation
- **Action**: Confirm Winston logging is working correctly
- **Validation**: 
  - `combined.log` file is created and contains info-level logs
  - `errors.log` file is created and contains error-level logs
  - API keys are masked in log entries
  - Log format is JSON and includes timestamps

#### 8.3 Integration with Existing Codebase
- **Action**: Ensure new code integrates properly with Step 1 implementation
- **Validation**:
  - Server starts without errors
  - Both placeholder and serper.dev functionality work
  - No conflicts with existing MCP tool definitions

## Acceptance Criteria Validation

Upon completion of all sub-tasks, verify these acceptance criteria are met:

- ✅ The `get_quote` tool successfully makes requests to the serper.dev API
- ✅ Quotes returned by the API are correctly parsed and returned as MCP tool results
- ✅ The `SERPER_API_KEY` is successfully read from environment variables
- ✅ Invalid or missing API key returns appropriate error message via MCP
- ✅ Network errors and API failures are gracefully handled with informative error messages
- ✅ Unit tests cover the serperService module including query construction, response parsing, and error handling
- ✅ Integration tests verify end-to-end get_quote tool interaction with mocked serper.dev API

## Dependencies Between Sub-Tasks

- Sub-tasks 1.1-1.2 must be completed before any implementation tasks
- Sub-task 2.x must be completed before 4.x (types needed for service implementation)
- Sub-task 3.1 must be completed before 4.1 (logging needed in service)
- Sub-tasks 4.1-4.6 must be completed sequentially (service implementation dependencies)
- Sub-task 5.1 requires completion of 4.6 (service must exist to be imported)
- Sub-tasks 6.1-6.2 require completion of 4.6 and 5.1 (code must exist to test)
- Sub-task 8.x requires completion of all previous tasks (final validation)

## Notes for Implementation Coder

- Follow the established coding patterns from Step 1
- Ensure all error handling follows MCP protocol requirements (`isError: true`)
- Test thoroughly with both valid and invalid API keys
- Pay attention to rate limiting to avoid exhausting API quotas during development
- Consider adding debug-level logging for development troubleshooting