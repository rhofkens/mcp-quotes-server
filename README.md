# MCP Quotes Server

[![CI](https://github.com/rhofkens/mcp-quotes-server/workflows/CI/badge.svg)](https://github.com/rhofkens/mcp-quotes-server/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=flat&logo=eslint&logoColor=white)](https://eslint.org/)
[![Jest](https://img.shields.io/badge/-jest-%23C21325?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-blue)](https://github.com/modelcontextprotocol)
[![Serper.dev](https://img.shields.io/badge/API-Serper.dev-green)](https://serper.dev)

A Model Context Protocol (MCP) server that provides quotes based on user requests. This server demonstrates the basic implementation of an MCP server using TypeScript and the official MCP SDK.

## Features

- **MCP Protocol Compliance**: Implements the Model Context Protocol for seamless integration with MCP clients
- **Dual Transport Support**: Supports both stdio and HTTP/HTTPS transports for flexible deployment
- **Real Quote Retrieval**: Integrates with Serper.dev API to retrieve real quotes from specified persons or topics
- **Multiple Quote Support**: Request 1-10 quotes at once with automatic formatting
- **Prompt Template Resources**: Provides MCP resources with structured prompt templates for quote requests
- **Parameter Validation**: Comprehensive input validation with detailed error messages
- **Robust Error Handling**: Comprehensive error handling with retry logic and exponential backoff
- **Structured Logging**: File-based logging with Winston for monitoring and debugging
- **Security Features**: DNS rebinding protection, CORS configuration, and HTTPS support
- **Session Management**: HTTP session tracking with automatic cleanup and statistics
- **TypeScript**: Built with TypeScript for type safety and modern development practices
- **Flexible Transport**: Uses standard input/output or HTTP/HTTPS for communication with MCP clients

## Prerequisites

- Node.js (version 18 or higher)
- npm (Node Package Manager)
- Serper.dev API key (required for quote retrieval functionality)

## Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd mcp-quotes-server
```

2. Install dependencies:

```bash
npm install
```

3. Configure your Serper.dev API key:

Set the `SERPER_API_KEY` environment variable with your API key from [serper.dev](https://serper.dev):

```bash
export SERPER_API_KEY="your-serper-api-key-here"
```

You can also create a `.env` file in the project root:

```bash
echo "SERPER_API_KEY=your-serper-api-key-here" > .env
```

## HTTP Transport Configuration

This server supports both stdio and HTTP transports. By default, it uses stdio transport for backwards compatibility. To enable HTTP transport, configure the following environment variables:

### Environment Variables

| Variable                   | Description                                                | Default                 | Required         |
| -------------------------- | ---------------------------------------------------------- | ----------------------- | ---------------- |
| `MCP_HTTP_ENABLED`         | Enable HTTP transport                                      | `false`                 | No               |
| `MCP_HTTP_PORT`            | HTTP server port                                           | `3000`                  | No               |
| `MCP_HTTP_HOST`            | HTTP server host                                           | `localhost`             | No               |
| `MCP_HTTP_ALLOWED_ORIGINS` | Comma-separated CORS origins                               | `http://localhost:3000` | No               |
| `MCP_HTTP_ALLOWED_HOSTS`   | Comma-separated allowed hosts for DNS rebinding protection | `localhost`             | No               |
| `MCP_HTTPS_ENABLED`        | Enable HTTPS (requires certificates)                       | `false`                 | No               |
| `MCP_HTTPS_CERT_PATH`      | Path to SSL certificate file                               | -                       | If HTTPS enabled |
| `MCP_HTTPS_KEY_PATH`       | Path to SSL private key file                               | -                       | If HTTPS enabled |

### Basic HTTP Configuration

To run the server with HTTP transport:

```bash
# Enable HTTP transport on default port 3000
export MCP_HTTP_ENABLED=true
npm start
```

Or with custom configuration:

```bash
# Custom HTTP configuration
export MCP_HTTP_ENABLED=true
export MCP_HTTP_PORT=8080
export MCP_HTTP_HOST=0.0.0.0
export MCP_HTTP_ALLOWED_ORIGINS="https://example.com,https://app.example.com"
export MCP_HTTP_ALLOWED_HOSTS="localhost,127.0.0.1,example.com"
npm start
```

### HTTPS Configuration

For production deployments with HTTPS:

```bash
# HTTPS configuration
export MCP_HTTP_ENABLED=true
export MCP_HTTPS_ENABLED=true
export MCP_HTTPS_CERT_PATH="/path/to/certificate.pem"
export MCP_HTTPS_KEY_PATH="/path/to/private-key.pem"
export MCP_HTTP_ALLOWED_ORIGINS="https://yourapp.com"
export MCP_HTTP_ALLOWED_HOSTS="yourapp.com"
npm start
```

### Security Features

#### DNS Rebinding Protection

The server automatically validates the `Host` header against allowed hosts to prevent DNS rebinding attacks.

#### CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured to only allow requests from specified origins.

#### Session Management

HTTP transport uses session-based communication with automatic cleanup of inactive sessions.

### HTTP Endpoints

When HTTP transport is enabled, the server exposes the following endpoints:

- `POST /mcp` - Main MCP communication endpoint
- `GET /mcp` - Server-to-client notifications via Server-Sent Events
- `DELETE /mcp` - Session termination
- `GET /health` - Health check endpoint
- `GET /sessions` - Session statistics (for monitoring)

## Development Setup

### Building the Project

To compile the TypeScript code to JavaScript:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript files.

### Running the Server

To start the MCP server, you have several options:

**Option 1 - Using npm start (Recommended for development):**

```bash
npm start
```

**Option 2 - Using compiled JavaScript (Recommended for MCP inspector):**

```bash
npm run build
node dist/start.js
```

**Option 3 - Using ts-node directly:**

```bash
npx ts-node src/start.ts
```

The server will start and listen for MCP connections via stdio transport.

**For MCP Inspector Testing:**
Use any of the above commands in your MCP client configuration. The most reliable option for MCP inspector is `node dist/start.js` after building the project.

### Running Tests

To run the test suite:

```bash
npm test
```

To run tests with coverage:

```bash
npm test -- --coverage
```

### Code Quality

To run linting checks:

```bash
npm run lint
```

To format code:

```bash
npm run format
```

## Usage

## Usage

### Available Tools

#### `get_quote`

Retrieves real quotes from a specified person or topic using the Serper.dev API. Enhanced with support for requesting multiple quotes at once.

**Parameters:**

- `person` (required): The name of the person to get a quote from
- `topic` (optional): The topic or subject for the quote
- `numberOfQuotes` (optional): Number of quotes to retrieve (1-10, defaults to 1)

**Example Usage with MCP Client:**

```typescript
// Example 1: Single quote request
const result = await client.callTool({
  name: "get_quote",
  arguments: {
    person: "Albert Einstein",
    topic: "science",
  },
});

// Expected response (real quote from Serper.dev):
{
  content: [
    {
      type: "text",
      text: "Science without religion is lame, religion without science is blind.",
    },
  ];
}

// Example 2: Multiple quotes request
const multipleQuotes = await client.callTool({
  name: "get_quote",
  arguments: {
    person: "Maya Angelou",
    numberOfQuotes: 3,
  },
});

// Expected response (formatted multiple quotes):
{
  content: [
    {
      type: "text",
      text: `1. "If you don't like something, change it. If you can't change it, change your attitude."

2. "There is no greater agony than bearing an untold story inside you."

3. "Try to be a rainbow in someone's cloud."`,
    },
  ];
}
```

**Parameter Validation:**

The tool includes comprehensive parameter validation:

- **Person validation**: Ensures person name is provided and not empty
- **Topic validation**: Optional string parameter
- **NumberOfQuotes validation**: Must be between 1 and 10 if provided
- **Detailed error messages**: Clear feedback for invalid parameters

**Error Handling:**

The tool provides comprehensive error handling:

- **Configuration errors**: Missing or invalid API key
- **API errors**: Rate limiting, authentication failures, network issues
- **Validation errors**: Invalid parameter values with detailed messages
- **Fallback messages**: When no suitable quotes are found

**Logging:**

All API requests and responses are logged to files for monitoring:

- `combined.log`: All log entries
- `errors.log`: Error-level messages only

### Available Resources

#### `prompt-template://quote-request`

Provides a structured prompt template for quote requests that follows MCP resource standards.

**Usage with MCP Client:**

```typescript
// List available resources
const resources = await client.listResources();

// Access the prompt template resource
const template = await client.readResource({
  uri: "prompt-template://quote-request",
});

// The resource contains structured information about:
// - Parameter specifications (person, topic, numberOfQuotes)
// - Usage examples and best practices
// - Input validation requirements
```

**Resource Content Structure:**

```json
{
  "name": "Prompt Template for Quote Requests",
  "description": "A structured template for requesting quotes from famous people with specific topics and quantities.",
  "parameters": [
    {
      "name": "person",
      "type": "string",
      "required": true,
      "description": "The name of the person to get quotes from"
    },
    {
      "name": "topic",
      "type": "string",
      "required": false,
      "description": "Optional topic to filter quotes by"
    },
    {
      "name": "numberOfQuotes",
      "type": "number",
      "required": false,
      "description": "Number of quotes to retrieve (1 to 10)"
    }
  ],
  "examples": [
    {
      "title": "Single Quote Request",
      "parameters": {
        "person": "Albert Einstein",
        "topic": "imagination"
      }
    },
    {
      "title": "Multiple Quotes Request",
      "parameters": {
        "person": "Maya Angelou",
        "numberOfQuotes": 5
      }
    }
  ]
}
```

### MCP Client Integration

#### Stdio Transport (Default)

To use this server with an MCP client via stdio transport:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create transport that runs this server
const transport = new StdioClientTransport({
  command: "npm",
  args: ["start"],
  cwd: "/path/to/mcp-quotes-server",
});

// Create and connect client
const client = new Client({
  name: "example-client",
  version: "1.0.0",
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log("Available tools:", tools);

// Call the get_quote tool
const result = await client.callTool({
  name: "get_quote",
  arguments: {
    person: "Shakespeare",
    topic: "love",
  },
});

console.log("Quote result:", result);
```

#### HTTP Transport

To use this server with HTTP transport:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Create HTTP transport
const transport = new StreamableHTTPClientTransport({
  baseUrl: "http://localhost:3000",
});

// Create and connect client
const client = new Client({
  name: "example-http-client",
  version: "1.0.0",
});

await client.connect(transport);

// Use the same API as stdio transport
const tools = await client.listTools();
const result = await client.callTool({
  name: "get_quote",
  arguments: {
    person: "Einstein",
    topic: "imagination",
  },
});
```

#### HTTPS Transport

For secure HTTPS connections:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Create HTTPS transport
const transport = new StreamableHTTPClientTransport({
  baseUrl: "https://your-mcp-server.com",
  headers: {
    Authorization: "Bearer your-auth-token",
  },
});

const client = new Client({
  name: "secure-client",
  version: "1.0.0",
});

await client.connect(transport);
```

## MCP Inspector Tool Usage

### Quick Setup (Recommended)

The easiest way to test this MCP server is using the published NPM package:

1. Install the MCP Inspector globally:

```bash
npm install -g @modelcontextprotocol/inspector
```

2. Start the MCP Inspector:

```bash
mcp-inspector
```

3. In the MCP Inspector interface:
   - **Transport Type**: STDIO
   - **Command**: `npx`
   - **Arguments**: `@rhofkens/mcp-quotes-server@0.1.3`
   - Click "Connect"

### Alternative: Local Development Setup

If you want to test with local code changes:

1. Install the MCP Inspector globally:

```bash
npm install -g @modelcontextprotocol/inspector
```

2. Build the project:

```bash
npm run build
```

3. Start the MCP Inspector:

```bash
mcp-inspector
```

4. In the MCP Inspector interface:
   - Set the command to: `node`
   - Set the arguments to: `dist/start.js`
   - Set the working directory to your project path
   - Click "Connect"

### Testing with MCP Inspector

Once connected, you can:

- **List Tools**: View available tools including `get_quote`
- **Test get_quote Tool**:
  - Select the `get_quote` tool
  - Provide parameters like `{"person": "Einstein", "topic": "science"}`
  - Execute and view results
- **List Resources**: View available resources including `prompt-template://quote-request`
- **Test Resources**: Access and view the prompt template resource content

### Common MCP Inspector Issues

- **Connection Issues**: Ensure the server builds successfully with `npm run build`
- **Tool Errors**: Check that `SERPER_API_KEY` environment variable is set
- **Resource Errors**: Verify the resource URI format is correct

## Claude Desktop Integration

### Configuration

To use this MCP server with Claude Desktop, you need to configure it in your Claude Desktop settings:

1. **Open Claude Desktop Configuration**:
   - On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - On Windows: `%APPDATA%/Claude/claude_desktop_config.json`
   - On Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add Server Configuration**:

```json
{
  "mcpServers": {
    "quotes-server": {
      "command": "node",
      "args": ["dist/start.js"],
      "cwd": "/path/to/your/mcp-quotes-server",
      "env": {
        "SERPER_API_KEY": "your-serper-api-key-here"
      }
    }
  }
}
```

### Alternative Configuration with npm

If you prefer to use npm:

```json
{
  "mcpServers": {
    "quotes-server": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/path/to/your/mcp-quotes-server",
      "env": {
        "SERPER_API_KEY": "your-serper-api-key-here"
      }
    }
  }
}
```

### Using the Server in Claude Desktop

After configuration and restarting Claude Desktop:

1. **Verify Connection**: Look for the MCP server icon in Claude Desktop
2. **Use the get_quote Tool**: Type messages like:
   - "Get me a quote from Einstein about science"
   - "Find 3 quotes from Maya Angelou"
   - "Get quotes about leadership from Winston Churchill"

3. **Access Resources**: The prompt template resource will be available for structured requests

### Troubleshooting Claude Desktop Integration

- **Server Not Appearing**: Check the configuration file syntax and restart Claude Desktop
- **Tool Not Working**: Verify the SERPER_API_KEY is correctly set in the environment
- **Path Issues**: Use absolute paths in the configuration

## Troubleshooting

### Common Issues and Solutions

#### 1. API Key Problems

**Issue**: `Error: Missing or invalid Serper API key`

**Solutions**:

- Verify your API key is valid at [serper.dev](https://serper.dev)
- Check the environment variable is set: `echo $SERPER_API_KEY`
- For `.env` file, ensure no spaces around the `=` sign
- Restart your terminal/IDE after setting environment variables

#### 2. Build and Installation Issues

**Issue**: `npm install` fails or TypeScript compilation errors

**Solutions**:

- Ensure Node.js version 18+ is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript version compatibility: `npm list typescript`

#### 3. MCP Connection Issues

**Issue**: MCP clients cannot connect to the server

**Solutions**:

- Verify the server builds successfully: `npm run build`
- Test the server directly: `node dist/start.js`
- Check for port conflicts if using HTTP transport
- Ensure proper permissions for the executable

#### 4. Quote Retrieval Issues

**Issue**: No quotes returned or API errors

**Solutions**:

- Verify API key is correctly configured
- Check network connectivity
- Try different person names or topics
- Review logs in `combined.log` for detailed error information
- Ensure the person name is spelled correctly and is well-known

#### 5. HTTP Transport Issues

**Issue**: HTTP server not starting or connection refused

**Solutions**:

- Check port availability: `lsof -i :3000` (replace 3000 with your port)
- Verify environment variables are set correctly
- Check firewall settings
- Ensure CORS origins are properly configured
- For HTTPS, verify certificate paths are correct

#### 6. Testing and Coverage Issues

**Issue**: Tests failing or coverage not meeting requirements

**Solutions**:

- Run tests individually to identify specific failures: `npm test -- --testNamePattern="specific test"`
- Check test environment variables are set
- Verify mock data is properly configured
- Review test logs for specific error messages

#### 7. Logging Issues

**Issue**: Log files not created or logs not appearing

**Solutions**:

- Check write permissions in the project directory
- Verify Winston configuration in `src/utils/logger.ts`
- Ensure the log directory exists and is writable
- Check for disk space issues

### Getting Help

If you continue to experience issues:

1. **Check the logs**: Review `combined.log` and `errors.log` for detailed error information
2. **Review the documentation**: Ensure you're following the setup steps correctly
3. **Check GitHub Issues**: Look for similar issues in the project repository
4. **Create a detailed issue report**: Include error messages, logs, and system information

## Project Structure

```
mcp-quotes-server/
├── src/
│   ├── index.ts                        # Main server entry point
│   ├── start.ts                        # Server startup script
│   ├── services/
│   │   ├── serper-service.ts           # Serper.dev API integration
│   │   └── http-transport-service.ts   # HTTP transport service
│   ├── types/
│   │   ├── serper-types.ts             # Serper API TypeScript interfaces
│   │   ├── serper-errors.ts            # Custom error classes
│   │   ├── resource-types.ts           # MCP resource TypeScript interfaces
│   │   ├── validation-types.ts         # Parameter validation types
│   │   └── http-transport-types.ts     # HTTP transport TypeScript interfaces
│   ├── config/
│   │   └── environment-config.ts       # Environment configuration parsing
│   ├── resources/
│   │   └── prompt-template-content.ts  # Prompt template resource content
│   └── utils/
│       ├── logger.ts                   # Winston logging configuration
│       └── parameter-validator.ts      # Input parameter validation
├── __tests__/
│   ├── serper-service.test.ts          # SerperService unit tests
│   ├── mcp-tool-integration.test.ts    # MCP tool integration tests
│   ├── index.test.ts                   # Main server functionality tests
│   ├── parameter-validator.test.ts     # Parameter validation tests
│   ├── prompt-template-resource.test.ts # Resource content tests
│   └── get-quote-enhanced.test.ts      # Enhanced tool integration tests
├── dist/                               # Compiled JavaScript (after build)
├── coverage/                           # Test coverage reports
├── docs/                               # Project documentation
│   ├── decisions/                      # Architecture Decision Records
│   ├── guidelines/                     # Development guidelines
│   ├── plans/                          # Implementation plans
│   └── tasks/                          # Detailed task specifications
├── combined.log                        # Winston log file (all entries)
├── errors.log                          # Winston log file (errors only)
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
├── jest.config.js                      # Jest test configuration
├── .eslintrc.js                       # ESLint configuration
├── .prettierrc                        # Prettier configuration
└── README.md                          # This file
```

## Development

### Architecture

This MCP server follows a monolithic TypeScript architecture as outlined in the project guidelines. The server:

1. Creates an `McpServer` instance with name and version
2. Registers tools using `server.registerTool()`
3. Uses `StdioServerTransport` for communication
4. Provides type-safe tool definitions with Zod schemas

### Adding New Tools

To add a new tool:

1. Register the tool using `server.registerTool()`
2. Define the input schema using Zod
3. Implement the async handler function
4. Add corresponding tests

Example:

```typescript
server.registerTool(
  "new_tool",
  {
    title: "New Tool",
    description: "Description of the new tool",
    inputSchema: {
      param1: z.string(),
      param2: z.number().optional(),
    },
  },
  async ({ param1, param2 }) => {
    // Tool implementation
    return {
      content: [
        {
          type: "text",
          text: `Result: ${param1}`,
        },
      ],
    };
  }
);
```

### Working with Resources

To access MCP resources in your applications:

```typescript
// List all available resources
const resources = await client.listResources();
console.log("Available resources:", resources);

// Read the prompt template resource
const promptTemplate = await client.readResource({
  uri: "prompt-template://quote-request",
});

// Parse the JSON content
const templateData = JSON.parse(promptTemplate.contents[0].text);
console.log("Template parameters:", templateData.parameters);
```

## Current Status

This is **Step 04** of the MCP Quotes Server implementation. The current version provides:

- ✅ Basic MCP server setup with stdio transport
- ✅ **Dual transport support (stdio and HTTP/HTTPS)**
- ✅ `get_quote` tool registration and discovery
- ✅ **Serper.dev API integration for real quote retrieval**
- ✅ **Enhanced get_quote tool with numberOfQuotes parameter (1-10 quotes)**
- ✅ **Prompt template resources following MCP standards**
- ✅ **Comprehensive parameter validation with detailed error messages**
- ✅ **Comprehensive error handling and retry logic**
- ✅ **File-based logging with Winston**
- ✅ **HTTP transport with session management**
- ✅ **Security features (DNS rebinding protection, CORS, HTTPS)**
- ✅ **Environment-based configuration**
- ✅ **Comprehensive unit and integration tests (>70% coverage)**
- ✅ TypeScript configuration and build system
- ✅ Testing infrastructure with Jest
- ✅ Code quality tools (ESLint, Prettier)

## Roadmap

Future steps will include:

- Additional quote sources and providers
- Enhanced quote filtering and categorization
- Advanced resource templates
- Deployment automation and containerization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
