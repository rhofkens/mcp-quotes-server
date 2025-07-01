# ADR 005: HTTP Transport Implementation Strategy for MCP Server

## Status
Accepted

## Context
For Step 4 (Streamable HTTP Support for MCP Server), we need to implement HTTP/HTTPS communication alongside the existing stdio transport. The MCP TypeScript SDK provides `StreamableHTTPServerTransport` (protocol version 2025-03-26) as the modern approach. We need to decide how to:

1. Support both stdio and HTTP transports simultaneously
2. Configure HTTP server settings via environment variables
3. Handle session management for HTTP connections
4. Maintain backwards compatibility with stdio mode

The existing architecture uses a monolithic TypeScript application with stdio-only communication.

## Decision
We will implement a **dual transport strategy** with the following design:

1. **Transport Selection**: 
   - Default to stdio transport (existing behavior)
   - Enable HTTP transport when `MCP_HTTP_ENABLED=true` environment variable is set
   - Support both transports running simultaneously

2. **HTTP Server Implementation**:
   - Use Express.js for HTTP server implementation
   - Integrate `StreamableHTTPServerTransport` with session management
   - Support both GET (SSE notifications) and POST (client requests) endpoints

3. **Environment Variable Configuration**:
   ```
   MCP_HTTP_ENABLED=true|false     # Enable/disable HTTP transport
   MCP_HTTP_PORT=3000              # HTTP server port (default: 3000)
   MCP_HTTP_HOST=localhost         # HTTP server host (default: localhost)
   MCP_HTTPS_ENABLED=false         # Enable HTTPS (default: false)
   MCP_HTTPS_CERT_PATH=            # Path to HTTPS certificate
   MCP_HTTPS_KEY_PATH=             # Path to HTTPS private key
   ```

4. **Session Management**: 
   - Use stateful session management with `mcp-session-id` headers
   - Generate session IDs using `crypto.randomUUID()`
   - Store active transports in memory (suitable for single-instance deployment)

5. **Security Considerations**:
   - Enable DNS rebinding protection by default
   - Allow configuration of `allowedHosts` and `allowedOrigins` via environment variables
   - Use HTTPS in production environments

## Implementation Architecture
```typescript
// Main server can run both transports
if (process.env.MCP_HTTP_ENABLED === 'true') {
  await startHttpServer();
}
await startStdioServer(); // Always available
```

## Rationale
- **Backwards Compatibility**: Stdio remains the default, ensuring existing integrations continue working
- **Flexibility**: Environment variables allow easy configuration without code changes
- **Modern Protocol**: Uses the latest StreamableHTTP transport (2025-03-26)
- **Session Management**: Stateful sessions provide better user experience for HTTP clients
- **Security**: DNS rebinding protection and HTTPS support address common security concerns

## Consequences
- **Positive**: 
  - Maintains full backwards compatibility with stdio transport
  - Enables modern HTTP-based MCP client integrations
  - Environment-driven configuration for easy deployment
  - Follows MCP SDK best practices for HTTP transport
  - Supports both development (HTTP) and production (HTTPS) scenarios

- **Negative**: 
  - Increased complexity with dual transport management
  - Additional dependencies (Express.js)
  - Memory usage for session storage (limitation for horizontal scaling)
  - More configuration options to document and maintain

## Implementation Notes
- Express.js will be added as a production dependency
- HTTP server startup will be conditional based on environment variables
- Session storage will use in-memory Map for simplicity
- CORS configuration will expose `mcp-session-id` header for browser compatibility