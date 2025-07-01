# Sub-task Plan: Core MCP Server Setup & Basic Tool Definition (Step 01)

This document outlines the detailed sub-tasks required to set up the core MCP server and define a basic `get_quote` tool, as per the scope and acceptance criteria in [`docs/plans/01-core-mcp-server-setup-basic-tool-definition.md`](docs/plans/01-core-mcp-server-setup-basic-tool-definition.md). All tasks adhere to the architectural guidelines in [`docs/guidelines/architecture.md`](docs/guidelines/architecture.md), coding guidelines in [`docs/guidelines/coding-guidelines.md`](docs/guidelines/coding-guidelines.md), and the architectural decision record [`docs/decisions/001-adr-code-formatting-and-linting.md`](docs/decisions/001-adr-code-formatting-and-linting.md).

## 1. Project Initialization & Dependencies

- **Task:** Initialize a new TypeScript project.
  - Create a `package.json` file with basic project information (name, version, description).
  - Initialize a `tsconfig.json` file with strict mode enabled, as per [`docs/guidelines/coding-guidelines.md`](docs/guidelines/coding-guidelines.md) (Section 1.6. Type Safety and TypeScript Best Practices).
  - Configure `tsconfig.json` to output to a `dist` directory.
- **Task:** Install necessary dependencies.
  - Install `@modelcontextprotocol/sdk` (TypeScript SDK for MCP) as a production dependency.
  - Install `typescript`, `ts-node`, `zod`, `@types/node`, `jest`, `ts-jest`, `@types/jest`, `prettier`, and `eslint` with `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` as development dependencies.
- **Task:** Configure `npm` scripts.
  - Add `start` script: `ts-node src/index.ts` (for development).
  - Add `build` script: `tsc` (for compilation).
  - Add `test` script: `jest`.
  - Add `lint` script: `eslint . --ext .ts`.
  - Add `format` script: `prettier --write .`.
- **Task:** Configure Prettier and ESLint.
  - Create a `.prettierrc` file for consistent code formatting, as per [`docs/decisions/001-adr-code-formatting-and-linting.md`](docs/decisions/001-adr-code-formatting-and-linting.md).
  - Create an `.eslintrc.js` file, extending `@typescript-eslint/recommended` and integrating Prettier, as per [`docs/decisions/001-adr-code-formatting-and-linting.md`](docs/decisions/001-adr-code-formatting-and-linting.md).
  - Add `.eslintignore` and `.prettierignore` to exclude `node_modules` and `dist` directories.

## 2. Core MCP Server Implementation

- **Task:** Create the main entry point.
  - Create `src/index.ts` as the main entry point for the MCP server, as per [`docs/guidelines/architecture.md`](docs/guidelines/architecture.md) (Section 3.2. Backend Folder Structure).
  - Import `McpServer` and `StdioServerTransport` from `@modelcontextprotocol/sdk/server/mcp.js` and `@modelcontextprotocol/sdk/server/stdio.js` respectively.
  - Instantiate `McpServer` with a `name` (e.g., "mcp-quotes-server") and `version` ("1.0.0").
  - Instantiate `StdioServerTransport`.
  - Connect the `McpServer` to the `StdioServerTransport`.
  - Add basic console logging for server startup.

## 3. Tool Definition (`get_quote`)

- **Task:** Define the `get_quote` tool.
  - Import `z` from `zod` for schema validation.
  - Register the `get_quote` tool using `server.registerTool()`.
  - Set the tool `name` to "get_quote".
  - Provide a `title` (e.g., "Get Quote") and `description` (e.g., "Retrieves a quote from a specified person or topic.").
  - Define the `inputSchema` using `zod`:
    - `person`: `z.string()` (required).
    - `topic`: `z.string().optional()` (optional).
  - Implement the tool handler function:
    - It should be an `async` function.
    - It should return a placeholder response: `{ content: [{ type: "text", text: "Hello from MCP!" }] }`.

## 4. Testing

- **Task:** Set up Jest for testing.
  - Create `jest.config.js` with `ts-jest` preset.
- **Task:** Implement a basic integration test for `get_quote`.
  - Create a test file (e.g., `src/index.test.ts`).
  - Write a test case to verify that the MCP server starts without errors.
  - Write a test case to simulate invoking the `get_quote` tool and assert that it returns "Hello from MCP!". This will require mocking the `StdioServerTransport` or using a test utility if available in the SDK. (Note: The MCP SDK documentation provides examples for client-side interaction, which can be adapted for testing server-side tool invocation).

## 5. Documentation

- **Task:** Update `README.md`.
  - Add a section for initial project setup, including `npm install` instructions.
  - Add commands to build (`npm run build`) and run (`npm start`) the basic MCP server.
  - Provide an example of how to invoke the `get_quote` tool using a hypothetical MCP client, showing expected input and the "Hello from MCP!" output.
