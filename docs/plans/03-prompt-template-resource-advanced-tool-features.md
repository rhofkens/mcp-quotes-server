# Detailed Plan: Prompt Template Resource & Advanced Tool Features

## 1. Detailed Scope

- **Features:**
  - Define and expose the "Prompt Template Resource" via the MCP SDK. This resource will provide a structured template for generating prompts related to quotes.
  - Enhance the `get_quote` tool to correctly handle the `numberOfQuotes` parameter, ensuring the tool returns the specified quantity of quotes.
  - Implement comprehensive parameter validation for all `get_quote` tool inputs: `person`, `topic`, and `numberOfQuotes`.
- **User Stories (referencing PRD):**
  - The "Prompt Template Resource" can be accessed by users or AI models to understand the expected format for quote-related prompts, ensuring consistent interaction with the tool (PRD section 5.2).
  - The tool successfully returns quotes for the specified person and topic. The number of quotes matches the request (partial fulfillment of PRD User Story 2).
- **Tasks:**
  - Register a new MCP resource using `mcp.resource()` for the prompt template, specifying its URI and content.
  - Modify the `get_quote` tool's input schema to include `numberOfQuotes` as a required integer parameter.
  - Update the `get_quote` tool's handler logic to:
    - Validate `numberOfQuotes` (e.g., must be a positive integer).
    - Limit the number of quotes returned from `serper.dev` to `numberOfQuotes`.
    - Implement validation for `person` (e.g., must not be empty).
    - Implement validation for `topic` (optional, but ensure it's a string if provided).
- **Sub-tasks:**
  - Design the exact structure and content of the prompt template (e.g., a JSON object or Markdown string).
  - Add unit tests specifically for the input validation logic within the `get_quote` tool handler.
- **Excluded:**
  - Dynamic generation of prompts based on the template content.
  - Any form of versioning or complex management for the prompt template resource.

## 2. Detailed Acceptance Criteria

- The "Prompt Template Resource" is successfully registered and accessible via MCP (e.g., using `mcp.list_resources()` and `mcp.access_resource()`).
- The content retrieved from the "Prompt Template Resource" matches the predefined structured template.
- Invoking the `get_quote` tool with a valid `numberOfQuotes` parameter returns precisely the requested number of quotes (assuming `serper.dev` provides enough results).
- The `get_quote` tool gracefully handles and reports errors via MCP when:
  - `numberOfQuotes` is not a positive integer.
  - `person` is an empty string or missing.
- Unit tests confirm the correct behavior of input validation for all parameters.
- Integration tests verify that the `get_quote` tool correctly processes `numberOfQuotes` and that parameter validation functions as expected, returning appropriate error messages for invalid inputs.

## 3. Detailed Documentation Tasks

- Update the main `README.md` to include:
  - Instructions and examples for accessing the "Prompt Template Resource" via MCP.
  - Enhanced examples of `get_quote` tool invocation, demonstrating the use of the `numberOfQuotes` parameter.
  - Examples showcasing the error messages returned by the `get_quote` tool for invalid input parameters.
- Add JSDoc comments for the new resource definition and any updated logic within the `get_quote` tool handler.
