# Coding Guidelines: MCP Quotes Server

This document outlines the coding guidelines for the MCP Quotes Server project, focusing on TypeScript and the Model Context Protocol TypeScript SDK. These guidelines are intended to promote consistency, readability, maintainability, and best practices across the codebase.

## 1. Framework-Specific Guidelines (TypeScript & MCP TypeScript SDK)

### 1.1. Naming Conventions

- **Variables and Functions:** Use `camelCase`.
  - Example: `function calculateQuote(items: number[]): number`
- **Classes and Interfaces:** Use `PascalCase`.
  - Example: `class QuoteService`, `interface QuoteRequest`
- **Files:** Use `kebab-case`.
  - Example: `quote-service.ts`, `mcp-handler.ts`

### 1.2. Module Structure and Organization

- **Feature-Based:** Organize code primarily by feature. Each feature should reside in its own directory, containing all related components (e.g., handlers, services, types).
  - Example:
    ```
    src/
    ├── handlers/
    │   └── get-quote-handler.ts
    ├── services/
    │   └── quote-service.ts
    ├── types/
    │   └── quote-types.ts
    └── index.ts
    ```

### 1.3. Error Handling Patterns

- **`try/catch`:** Use `try/catch` blocks for handling synchronous and asynchronous errors.
- **Custom Errors:** Define custom error classes for specific application-level errors to provide more context and enable granular error handling.
- **Error Logging:** Log errors with sufficient detail (e.g., stack traces, relevant context) using the MCP logging capabilities where appropriate.

### 1.4. Use of Specific Language Features

- **`async/await`:** Prefer `async/await` for asynchronous operations over raw Promises for improved readability and easier error handling.
- **Generics:** Utilize generics to create reusable and type-safe components and functions.
- **Modern TypeScript Features:** Embrace modern TypeScript features that enhance code quality and developer experience, ensuring compatibility with the project's TypeScript version.

### 1.5. MCP SDK Usage Patterns

- **Tool Definition:** Use the `mcp.tool()` method for defining and registering MCP tools. Ensure clear `name`, `description`, and `inputSchema` are provided for each tool to facilitate LLM understanding and usage.
- **Request/Response Handling:** Follow the SDK's recommended patterns for handling incoming MCP requests and formatting responses, including proper error reporting within tool results (`isError: true`).
- **Type Safety:** Leverage the SDK's provided types and schemas to ensure strong type safety when interacting with MCP messages and tool arguments.

### 1.6. Type Safety and TypeScript Best Practices

- **Strict Mode:** Maintain TypeScript's strict mode (`"strict": true` in `tsconfig.json`) to enforce strong type checking and prevent common errors.
- **Explicit Types:** Prefer explicit type annotations for variables, function parameters, and return types, especially for public APIs and complex data structures.
- **Interfaces vs. Types:** Use interfaces for defining object shapes and classes, and type aliases for unions, intersections, and primitive type aliases.
- **Avoid `any`:** Minimize the use of the `any` type. If necessary, provide a clear justification and consider a more specific type assertion or a narrower type.

### 1.7. Code Readability and Maintainability

- **Commenting:**
  - Use JSDoc-style comments for functions, classes, interfaces, and complex logic to explain purpose, parameters, return values, and potential side effects.
  - Add inline comments for non-obvious code sections.
- **Function Size:** Keep functions small and focused on a single responsibility. Aim for functions that fit on a single screen.
- **Code Formatting:** Adhere to consistent code formatting. (Specific tools like Prettier or ESLint with formatting rules can be integrated for automated enforcement).
- **Consistency:** Maintain consistency in coding style, patterns, and conventions throughout the codebase.

## 2. General Coding Practices

### 2.1. Code Formatting

- **Automated Formatting:** Use an automated code formatter (e.g., Prettier, configured via `.prettierrc` and integrated into the development workflow) to ensure consistent code style across the project.
- **Linting:** Utilize ESLint with a recommended configuration (e.g., `@typescript-eslint/recommended`) to enforce coding standards and identify potential issues.

### 2.2. Commenting Guidelines

- **Purpose:** Comments should explain _why_ the code does something, rather than _what_ it does (which should be clear from the code itself).
- **Public APIs:** All exported functions, classes, and interfaces should have comprehensive JSDoc comments.
- **Complex Logic:** Comment complex algorithms or business logic.
- **TODOs/FIXMEs:** Use `TODO` comments for planned work and `FIXME` for known issues that need immediate attention.

### 2.3. Version Control Strategy

- **Branching Model:** Follow a Gitflow-like or Trunk-Based Development model (specify which one is preferred for the project).
- **Branch Naming:** Use clear and consistent branch naming conventions (e.g., `feature/add-quote-tool`, `bugfix/fix-mcp-connection`).
- **Commit Messages:** Write concise and descriptive commit messages following a conventional commit format (e.g., `feat: add new quote generation tool`, `fix: resolve connection issue in stdio transport`).

### 2.4. Error Handling Philosophy and Logging Practices

- **Centralized Logging:** Implement a centralized logging mechanism.
- **Log Levels:** Use appropriate log levels (DEBUG, INFO, WARN, ERROR, FATAL) for different types of messages.
- **Context:** Include sufficient context in log messages to aid debugging (e.g., request IDs, relevant parameters).
- **Sensitive Data:** Ensure sensitive information is never logged.

### 2.5. Principles for Writing Readable, Maintainable, and Testable Code

- **DRY (Don't Repeat Yourself):** Avoid code duplication by abstracting common logic into reusable functions or modules.
- **KISS (Keep It Simple, Stupid):** Prefer simple, straightforward solutions over overly complex ones.
- **Single Responsibility Principle:** Each module, class, or function should have one clear responsibility.
- **Dependency Injection:** Use dependency injection where appropriate to improve testability and modularity.
- **Testability:** Write code that is easy to test. Avoid global state and tightly coupled components.
- **Immutability:** Favor immutable data structures where possible to reduce side effects and make code easier to reason about.
