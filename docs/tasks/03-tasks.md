# Step 3 Tasks: Prompt Template Resource & Advanced Tool Features

## Overview
Implementation of the Prompt Template Resource and enhanced `get_quote` tool with comprehensive parameter validation, including the `numberOfQuotes` parameter.

## Task List

### 1. Core Implementation Tasks

#### 1.1 Create Prompt Template Resource Content
- **File**: `src/resources/prompt-template-content.ts`
- **Description**: Create a TypeScript module containing the structured prompt template content as defined in ADR 004
- **Acceptance Criteria**:
  - Export a constant containing the JSON structure as defined in ADR 004
  - Include all template variations (basic, withTopic, withCount, comprehensive)
  - Include parameter specifications with validation rules
  - Include practical examples and best practices
  - Follow TypeScript typing with proper interfaces
- **Dependencies**: None
- **Estimated Effort**: 1 hour

#### 1.2 Create Resource Registration Function
- **File**: `src/index.ts` (modify existing `registerTools` or create `registerResources`)
- **Description**: Add resource registration functionality to the main server setup
- **Acceptance Criteria**:
  - Create `registerResources(server: McpServer)` function following coding guidelines
  - Register the prompt template resource using `server.registerResource()`
  - Use URI `prompt-template://quote-request` as defined in ADR 004
  - Set appropriate title, description, and mimeType (`application/json`)
  - Return the structured JSON content from prompt-template-content.ts
  - Add comprehensive JSDoc comments
- **Dependencies**: Task 1.1
- **Estimated Effort**: 1 hour

#### 1.3 Enhance get_quote Tool with numberOfQuotes Parameter
- **File**: `src/index.ts` (modify existing `registerTools` function)
- **Description**: Update the existing `get_quote` tool to include the `numberOfQuotes` parameter
- **Acceptance Criteria**:
  - Add `numberOfQuotes` parameter to the tool's input schema using zod
  - Set as required integer parameter with proper description
  - Update tool description to mention the new parameter
  - Ensure parameter is passed to the SerperService
  - Maintain backward compatibility considerations
  - Follow existing error handling patterns
- **Dependencies**: Task 1.4
- **Estimated Effort**: 1 hour

#### 1.4 Implement Parameter Validation Logic
- **File**: `src/utils/parameter-validator.ts` (new file)
- **Description**: Create comprehensive parameter validation utilities
- **Acceptance Criteria**:
  - Create `validateQuoteParameters` function with proper TypeScript typing
  - Validate `person`: must be non-empty string, trim whitespace
  - Validate `topic`: optional string, trim whitespace if provided
  - Validate `numberOfQuotes`: must be positive integer between 1-10 (as per ADR 004)
  - Return structured validation results with specific error messages
  - Use proper error classes from existing error types
  - Add comprehensive JSDoc comments
  - Follow coding guidelines for naming and structure
- **Dependencies**: None
- **Estimated Effort**: 2 hours

#### 1.5 Update SerperService to Handle numberOfQuotes
- **File**: `src/services/serper-service.ts` (modify existing)
- **Description**: Enhance SerperService to properly handle the numberOfQuotes parameter
- **Acceptance Criteria**:
  - Update `getQuote` method signature to include optional `numberOfQuotes` parameter
  - Modify query construction to optimize for multiple quotes when requested
  - Implement logic to return exactly the requested number of quotes
  - Handle cases where API returns fewer quotes than requested
  - Add proper logging for numberOfQuotes parameter
  - Maintain existing retry logic from ADR 003
  - Update method JSDoc to reflect new parameter
- **Dependencies**: Task 1.4
- **Estimated Effort**: 2 hours

#### 1.6 Integrate Validation into Tool Handler
- **File**: `src/index.ts` (modify existing tool handler)
- **Description**: Integrate parameter validation into the get_quote tool handler
- **Acceptance Criteria**:
  - Call `validateQuoteParameters` before processing the request
  - Return appropriate MCP error responses for validation failures
  - Use `isError: true` flag for validation errors
  - Provide clear, user-friendly error messages
  - Log validation errors using existing logging strategy (ADR 002)
  - Maintain existing error handling patterns for API errors
- **Dependencies**: Tasks 1.4, 1.5
- **Estimated Effort**: 1 hour

#### 1.7 Update Main Server Setup
- **File**: `src/index.ts` (modify existing `main` function)
- **Description**: Update the main server initialization to register both tools and resources
- **Acceptance Criteria**:
  - Call both `registerTools(server)` and `registerResources(server)` functions
  - Maintain existing server setup patterns
  - Update function JSDoc comments
  - Ensure proper error handling during startup
  - Log successful resource registration
- **Dependencies**: Task 1.2
- **Estimated Effort**: 0.5 hours

### 2. Testing Tasks

#### 2.1 Unit Tests for Parameter Validation
- **File**: `__tests__/parameter-validator.test.ts` (new file)
- **Description**: Comprehensive unit tests for parameter validation logic
- **Acceptance Criteria**:
  - Test valid parameter combinations
  - Test invalid `person` parameter (empty, whitespace-only, null)
  - Test invalid `numberOfQuotes` parameter (zero, negative, too large, non-integer)
  - Test optional `topic` parameter handling
  - Test edge cases and boundary conditions
  - Achieve >70% code coverage for validation logic
  - Use Jest framework following existing test patterns
  - Include descriptive test names and assertions
- **Dependencies**: Task 1.4
- **Estimated Effort**: 2 hours

#### 2.2 Unit Tests for Prompt Template Resource
- **File**: `__tests__/prompt-template-resource.test.ts` (new file)
- **Description**: Unit tests for prompt template resource content and registration
- **Acceptance Criteria**:
  - Test resource content structure matches ADR 004 specification
  - Test all required fields are present in the JSON structure
  - Test parameter specifications are complete and accurate
  - Test examples are valid and realistic
  - Verify resource registration returns proper MCP resource response
  - Use existing test utilities and patterns
- **Dependencies**: Tasks 1.1, 1.2
- **Estimated Effort**: 1.5 hours

#### 2.3 Integration Tests for Enhanced get_quote Tool
- **File**: `__tests__/get-quote-enhanced.test.ts` (new file)
- **Description**: Integration tests for the enhanced get_quote tool with numberOfQuotes
- **Acceptance Criteria**:
  - Test tool with various numberOfQuotes values (1, 3, 5, 10)
  - Test validation error scenarios
  - Test successful quote retrieval with exact count matching
  - Test error handling when API returns fewer quotes than requested
  - Mock SerperService appropriately using existing patterns
  - Test integration with parameter validation
  - Follow existing integration test patterns
- **Dependencies**: Tasks 1.3, 1.4, 1.5, 1.6
- **Estimated Effort**: 2 hours

#### 2.4 Update Existing Tests
- **File**: `__tests__/index.test.ts` (modify existing)
- **Description**: Update existing server tests to account for new resource registration
- **Acceptance Criteria**:
  - Update server initialization tests to include resource registration
  - Verify both tools and resources are properly registered
  - Update any existing get_quote tool tests to handle new parameter
  - Maintain existing test coverage levels
  - Ensure all tests pass with new changes
- **Dependencies**: Tasks 1.2, 1.3, 1.7
- **Estimated Effort**: 1 hour

### 3. Type Definition Tasks

#### 3.1 Create Resource Content Types
- **File**: `src/types/resource-types.ts` (new file)
- **Description**: TypeScript interfaces for prompt template resource structure
- **Acceptance Criteria**:
  - Create `PromptTemplateContent` interface matching ADR 004 structure
  - Create `ParameterSpecification` interface for parameter definitions
  - Create `UsageExample` interface for example structures
  - Use proper TypeScript typing with readonly properties where appropriate
  - Export all interfaces for use in other modules
  - Add comprehensive JSDoc comments
  - Follow coding guidelines for interface naming (PascalCase)
- **Dependencies**: None
- **Estimated Effort**: 1 hour

#### 3.2 Update Validation Types
- **File**: `src/types/validation-types.ts` (new file)
- **Description**: TypeScript interfaces for parameter validation
- **Acceptance Criteria**:
  - Create `ValidationResult` interface with success/error states
  - Create `QuoteRequestParameters` interface for validated parameters
  - Create specific error type interfaces for different validation failures
  - Use discriminated unions for type safety
  - Export all types for use in validation logic
  - Add comprehensive JSDoc comments
- **Dependencies**: None
- **Estimated Effort**: 0.5 hours

### 4. Documentation Tasks

#### 4.1 Update Main README.md
- **File**: `README.md` (modify existing)
- **Description**: Update project documentation to reflect new features
- **Acceptance Criteria**:
  - Add section about Prompt Template Resource with access examples
  - Update get_quote tool examples to show numberOfQuotes parameter usage
  - Add examples of parameter validation error messages
  - Include MCP resource access examples (`mcp.readResource()`)
  - Update tool usage examples with various numberOfQuotes values
  - Maintain existing documentation structure and style
  - Include clear code examples following documentation patterns
- **Dependencies**: All implementation tasks
- **Estimated Effort**: 1.5 hours

#### 4.2 Add JSDoc Comments to New Functions
- **File**: All modified/new source files
- **Description**: Ensure all new functions have comprehensive JSDoc comments
- **Acceptance Criteria**:
  - Add JSDoc to all new exported functions and classes
  - Include parameter descriptions, return value descriptions
  - Include usage examples where appropriate
  - Document any thrown exceptions
  - Follow existing JSDoc patterns in the codebase
  - Use proper JSDoc tags (@param, @returns, @throws, @example)
- **Dependencies**: All implementation tasks
- **Estimated Effort**: 1 hour

#### 4.3 Update API Documentation Examples
- **File**: `docs/api-examples.md` (new file if it doesn't exist)
- **Description**: Create or update API usage examples
- **Acceptance Criteria**:
  - Provide complete examples of accessing the prompt template resource
  - Show various get_quote tool invocations with numberOfQuotes
  - Include error handling examples
  - Show proper MCP client usage patterns
  - Include both successful and error scenarios
  - Follow documentation best practices
- **Dependencies**: All implementation tasks
- **Estimated Effort**: 1 hour

### 5. Quality Assurance Tasks

#### 5.1 Code Review Checklist
- **Description**: Ensure all code changes meet quality standards
- **Acceptance Criteria**:
  - All new code follows coding guidelines (naming conventions, formatting)
  - All functions have appropriate error handling
  - All new code has comprehensive test coverage (>90%)
  - All JSDoc comments are complete and accurate
  - No eslint warnings or errors
  - All tests pass (npm test)
  - Code follows existing architectural patterns
- **Dependencies**: All implementation and testing tasks
- **Estimated Effort**: 1 hour

#### 5.2 Integration Testing
- **Description**: End-to-end testing of the complete feature
- **Acceptance Criteria**:
  - Test complete MCP server startup with both tools and resources
  - Verify prompt template resource is accessible via MCP
  - Test get_quote tool with various numberOfQuotes values
  - Test error scenarios work correctly
  - Verify logging works as expected
  - Test with real Serper.dev API (if API key available)
  - Document any issues found and ensure they are resolved
- **Dependencies**: All implementation tasks
- **Estimated Effort**: 1.5 hours

## Task Dependencies Summary

```
1.1 → 1.2 → 1.7
1.4 → 1.3, 1.5, 1.6
1.5 → 1.6
1.2, 1.3, 1.6, 1.7 → 2.4
1.1, 1.2 → 2.2
1.4 → 2.1
1.3, 1.4, 1.5, 1.6 → 2.3
All implementation → 4.1, 4.2, 4.3, 5.1, 5.2
```

## Total Estimated Effort
- **Implementation**: 9 hours
- **Testing**: 6.5 hours  
- **Documentation**: 3.5 hours
- **Quality Assurance**: 2.5 hours
- **Total**: 21.5 hours

## Success Criteria
- Prompt template resource is successfully registered and accessible via MCP
- get_quote tool accepts and properly handles numberOfQuotes parameter
- Comprehensive parameter validation with clear error messages
- All acceptance criteria from step plan are met
- Code coverage remains above 70% (architecture requirement)
- All tests pass
- Documentation is complete and accurate