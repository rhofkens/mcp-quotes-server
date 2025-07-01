# Step 4 Implementation Tasks: Streamable HTTP Support for MCP Server

## Overview
Implement streamable HTTP communication for the MCP Quotes Server alongside existing stdio transport, following ADR 005 HTTP Transport Implementation Strategy.

## Sub-Tasks

### 1. Environment Configuration Setup
**Objective**: Create environment variable configuration system for HTTP transport settings

**Tasks**:
- [ ] **1.1** Create [`src/config/environment-config.ts`](src/config/environment-config.ts) to centralize environment variable parsing
  - Parse `MCP_HTTP_ENABLED`, `MCP_HTTP_PORT`, `MCP_HTTP_HOST` variables
  - Parse `MCP_HTTPS_ENABLED`, `MCP_HTTPS_CERT_PATH`, `MCP_HTTPS_KEY_PATH` variables  
  - Parse `MCP_HTTP_ALLOWED_HOSTS`, `MCP_HTTP_ALLOWED_ORIGINS` for security
  - Provide typed configuration object with defaults
  - Add JSDoc documentation for all configuration options
  - Use zod schema validation for environment variables

**Acceptance Criteria**: Configuration module exports typed interface with all HTTP settings, defaults to stdio-only mode

### 2. HTTP Server Dependencies
**Objective**: Add required dependencies for HTTP transport implementation

**Tasks**:
- [ ] **2.1** Install Express.js and related dependencies
  - Add `express` as production dependency
  - Add `@types/express` as development dependency
  - Add `cors` for CORS handling
  - Add `@types/cors` for TypeScript support
  - Update [`package.json`](package.json) and run `npm install`

**Acceptance Criteria**: All HTTP-related dependencies installed and available for import

### 3. HTTP Transport Service Implementation
**Objective**: Create HTTP server service using StreamableHTTPServerTransport

**Tasks**:
- [ ] **3.1** Create [`src/services/http-transport-service.ts`](src/services/http-transport-service.ts)
  - Import `StreamableHTTPServerTransport` from MCP SDK
  - Import Express.js and required middleware
  - Implement session management using Map storage for active transports
  - Create Express app with JSON parsing middleware  
  - Configure CORS with `mcp-session-id` header exposure
  - Add DNS rebinding protection configuration
  - Use Winston logger consistent with ADR 002 (file-only logging)
  
- [ ] **3.2** Implement HTTP request handlers in http-transport-service
  - **POST /mcp**: Handle client-to-server MCP requests with session management
  - **GET /mcp**: Handle server-to-client SSE notifications  
  - **DELETE /mcp**: Handle session termination
  - Follow MCP SDK patterns from context7 documentation
  - Include proper error handling with MCP-compliant JSON-RPC error responses
  - Log all HTTP transport events using Winston logger
  
- [ ] **3.3** Add HTTPS support in http-transport-service
  - Check `MCP_HTTPS_ENABLED` environment variable
  - Load certificate and key files when HTTPS enabled
  - Use `https.createServer()` with Express app
  - Fallback to HTTP when HTTPS not configured
  - Log server startup mode (HTTP vs HTTPS)

**Acceptance Criteria**: HTTP transport service successfully handles MCP requests, manages sessions, supports both HTTP and HTTPS modes

### 4. Dual Transport Integration  
**Objective**: Modify main server to support both stdio and HTTP transports simultaneously

**Tasks**:
- [ ] **4.1** Refactor [`src/index.ts`](src/index.ts) for dual transport support
  - Extract server creation logic into reusable function
  - Create `createMcpServer()` function that registers tools and resources
  - Ensure server instance can be used by multiple transports
  - Maintain existing `main()` function for stdio transport
  - Add JSDoc documentation for new functions

- [ ] **4.2** Create HTTP server startup function in [`src/index.ts`](src/index.ts)
  - Add `startHttpServer()` async function 
  - Use environment configuration to determine HTTP settings
  - Create new MCP server instance for HTTP transport
  - Initialize HTTP transport service with server instance
  - Start Express server on configured host/port
  - Log HTTP server startup with connection details
  - Handle HTTP server startup errors gracefully

- [ ] **4.3** Update main execution logic in [`src/index.ts`](src/index.ts)
  - Check `MCP_HTTP_ENABLED` environment variable
  - Conditionally start HTTP server when enabled
  - Always start stdio server (backwards compatibility)
  - Handle parallel transport startup
  - Log active transport modes on startup
  - Ensure clean shutdown handling for both transports

**Acceptance Criteria**: Server supports both stdio and HTTP transports simultaneously, stdio remains default behavior, HTTP enabled via environment variable

### 5. Type Definitions
**Objective**: Create TypeScript type definitions for HTTP transport functionality

**Tasks**:
- [ ] **5.1** Create [`src/types/http-transport-types.ts`](src/types/http-transport-types.ts)
  - Define `HttpServerConfig` interface for environment configuration
  - Define `HttpTransportSession` interface for session management
  - Define `HttpServerOptions` interface for Express server options
  - Export all types with JSDoc documentation
  - Follow coding guidelines naming conventions (PascalCase for interfaces)

**Acceptance Criteria**: All HTTP transport types properly defined and exported

### 6. Basic HTTP Transport Testing
**Objective**: Create basic unit tests for HTTP transport functionality

**Tasks**:
- [ ] **6.1** Create [`__tests__/http-transport-service.test.ts`](--tests--/http-transport-service.test.ts)
  - Test HTTP server startup and shutdown (basic functionality)
  - Test environment configuration loading
  - Test error handling for invalid configurations
  - Use Jest testing framework consistent with existing tests
  - Focus on unit testing, not integration testing

- [ ] **6.2** Create [`__tests__/dual-transport-startup.test.ts`](--tests--/dual-transport-startup.test.ts)
  - Test server startup with HTTP enabled/disabled
  - Test environment variable parsing
  - Mock Express server for isolated testing
  - Basic validation that both transport modes can be initialized

**Note**: Comprehensive integration testing will be performed manually using the MCP Inspector tool

**Acceptance Criteria**: Basic HTTP transport functionality tested, server startup scenarios covered, tests pass consistently

### 7. Security Implementation
**Objective**: Implement security features as defined in ADR 005

**Tasks**:
- [ ] **7.1** Add DNS rebinding protection to HTTP transport service
  - Enable `enableDnsRebindingProtection: true` in StreamableHTTPServerTransport
  - Configure `allowedHosts` from `MCP_HTTP_ALLOWED_HOSTS` environment variable
  - Configure `allowedOrigins` from `MCP_HTTP_ALLOWED_ORIGINS` environment variable  
  - Default to localhost-only access when not configured
  - Log security configuration on startup

- [ ] **7.2** Add HTTPS certificate validation
  - Validate certificate and key file paths exist when HTTPS enabled
  - Check file permissions and readability
  - Validate certificate format (basic validation)
  - Provide clear error messages for HTTPS configuration issues
  - Log HTTPS certificate information on startup (without sensitive data)

**Acceptance Criteria**: DNS rebinding protection active, HTTPS properly configured when enabled, security settings logged appropriately

### 8. Error Handling and Logging
**Objective**: Implement comprehensive error handling and logging for HTTP transport

**Tasks**:
- [ ] **8.1** Add HTTP-specific error handling
  - Handle Express server startup errors
  - Handle MCP transport connection errors  
  - Handle session management errors
  - Handle HTTPS certificate loading errors
  - Return proper HTTP status codes for different error types
  - Use Winston logger consistent with ADR 002 logging strategy

- [ ] **8.2** Add HTTP transport logging
  - Log HTTP server startup/shutdown events
  - Log session creation/termination events
  - Log MCP request/response handling (without sensitive data)
  - Log transport-specific errors with context
  - Log security-related events (rejected requests, etc.)
  - Follow existing log levels and format from logger utility

**Acceptance Criteria**: All HTTP transport errors handled gracefully, comprehensive logging without stdio interference

### 9. Documentation Updates
**Objective**: Update README.md with HTTP configuration instructions per step plan requirements

**Tasks**:
- [ ] **9.1** Update [`README.md`](README.md) with HTTP support section
  - Add "HTTP Transport Configuration" section
  - Document all environment variables with examples
  - Provide HTTP and HTTPS setup instructions
  - Include examples of MCP client connections via HTTP  
  - Add troubleshooting section for common HTTP issues
  - Document security considerations and best practices
  - Include examples for both development and production configurations

- [ ] **9.2** Update [`README.md`](README.md) usage examples
  - Add HTTP server startup examples
  - Show how to test HTTP endpoints
  - Provide curl examples for MCP HTTP requests
  - Document how to use with MCP Inspector over HTTP
  - Update existing examples to mention dual transport support

**Acceptance Criteria**: README.md clearly explains HTTP configuration, includes practical examples, covers security considerations

### 10. Integration and Acceptance Testing
**Objective**: Validate all acceptance criteria from step plan

**Tasks**:
- [ ] **10.1** Test HTTP server startup
  - Verify server starts successfully with `MCP_HTTP_ENABLED=true`
  - Verify server starts on configured port and host
  - Verify HTTPS mode works with valid certificates
  - Verify stdio mode still works when HTTP disabled
  - Test error handling for invalid configurations

- [ ] **10.2** Test MCP functionality via HTTP
  - Verify [`get_quote`](src/index.ts:34) tool accessible via HTTP POST requests
  - Verify [`prompt-template`](src/index.ts:198) resource accessible via HTTP
  - Test session management with multiple concurrent clients
  - Test SSE notifications work correctly
  - Compare HTTP responses with stdio responses for consistency

- [ ] **10.3** Test environment variable control
  - Verify all documented environment variables affect server behavior
  - Test default values work correctly
  - Test invalid values are handled gracefully
  - Test HTTPS configuration via environment variables
  - Test security settings via environment variables

- [ ] **10.4** Test stdio compatibility
  - Verify stdio transport still works when HTTP enabled
  - Verify stdio transport works when HTTP disabled
  - Test both transports can run simultaneously
  - Verify no interference between transport modes
  - Test logging works correctly for both transports

**Acceptance Criteria**: All acceptance criteria from step plan validated, HTTP server starts successfully, tools and resources accessible via HTTP, environment variables control settings, stdio continues working

## Quality Gates

- [ ] All code follows TypeScript coding guidelines (camelCase, PascalCase, kebab-case conventions)
- [ ] All functions have JSDoc documentation
- [ ] Winston logging used consistently (file-only, no console output)
- [ ] Error handling follows established patterns from existing codebase
- [ ] Basic unit tests cover core HTTP transport functionality
- [ ] All environment variables validated and documented
- [ ] Security best practices implemented (DNS rebinding protection, HTTPS support)
- [ ] Backwards compatibility maintained (stdio still default)

## Dependencies on Previous Steps
- Step 1: Core MCP server setup and tool definitions ✅
- Step 2: Serper.dev integration with axios/retry (provides tools to expose via HTTP) ✅  
- Step 3: Prompt template resource (provides resources to expose via HTTP) ✅

## Success Metrics
- HTTP server starts without errors
- MCP tools accessible via both stdio and HTTP
- MCP resources accessible via both stdio and HTTP  
- Environment variables control all HTTP settings
- Documentation covers HTTP setup completely
- Test coverage meets 70% target
- No regressions in stdio functionality