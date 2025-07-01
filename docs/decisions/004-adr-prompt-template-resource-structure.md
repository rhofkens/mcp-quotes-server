# ADR 004: Prompt Template Resource Structure for Quote Generation

## Status
Accepted

## Context
For Step 3 (Prompt Template Resource & Advanced Tool Features), we need to define and expose a "Prompt Template Resource" via the MCP SDK. This resource should provide a structured template for generating prompts related to quotes, ensuring consistent interaction with the `get_quote` tool. The step plan requires the resource to be accessible by users or AI models to understand the expected format for quote-related prompts.

## Decision
We will implement the Prompt Template Resource with the following structure:

1. **Resource URI**: `prompt-template://quote-request` - A static resource URI for easy access
2. **Content Format**: JSON structure containing:
   - Template examples for different quote request scenarios
   - Parameter descriptions and validation rules
   - Usage examples with expected outputs
3. **Resource Content**: A structured JSON object that includes:
   - `template`: Sample prompt formats for quote requests
   - `parameters`: Detailed parameter specifications including validation rules
   - `examples`: Real-world usage examples
   - `bestPractices`: Guidelines for effective quote requests

## Implementation Structure
```json
{
  "template": {
    "basic": "Get a quote from {person}",
    "withTopic": "Get a quote from {person} about {topic}",
    "withCount": "Get {numberOfQuotes} quotes from {person}",
    "comprehensive": "Get {numberOfQuotes} quotes from {person} about {topic}"
  },
  "parameters": {
    "person": {
      "type": "string",
      "required": true,
      "description": "The name of the person to get quotes from",
      "validation": "Must not be empty"
    },
    "topic": {
      "type": "string",
      "required": false,
      "description": "Optional topic to filter quotes by"
    },
    "numberOfQuotes": {
      "type": "integer",
      "required": true,
      "description": "Number of quotes to retrieve",
      "validation": "Must be a positive integer between 1 and 10"
    }
  },
  "examples": [
    {
      "prompt": "Get 3 quotes from Albert Einstein about science",
      "parameters": {
        "person": "Albert Einstein",
        "topic": "science",
        "numberOfQuotes": 3
      }
    }
  ],
  "bestPractices": [
    "Use specific person names for better results",
    "Topics should be general concepts rather than very specific terms",
    "Request reasonable numbers of quotes (1-10) for optimal performance"
  ]
}
```

## Rationale
- **JSON Format**: Provides structured, parseable data that both humans and AI models can easily understand
- **Comprehensive Coverage**: Includes all current and planned parameters for the `get_quote` tool
- **Educational Value**: Serves as documentation for proper tool usage
- **Extensibility**: Structure can be easily extended when new parameters or features are added
- **Static Resource**: Simple implementation without requiring complex templating or dynamic generation

## Consequences
- **Positive**: 
  - Clear documentation of tool expectations and validation rules
  - Reduces user errors by providing clear usage guidelines
  - Serves as living documentation that can be programmatically accessed
  - Supports both human users and AI model interactions
- **Negative**: 
  - Requires manual updates when tool parameters change
  - Additional maintenance overhead for keeping resource content in sync with actual tool implementation

## Implementation Notes
- Register as a static resource using `server.registerResource()`
- Content should be kept in sync with actual tool validation logic
- Consider adding version information for future compatibility