import { main } from "./index.js";
import { logError } from "./utils/logger.js";

// Start the MCP server
main().catch((error) => {
  logError(
    "Failed to start server",
    error instanceof Error ? error : new Error(String(error))
  );
  process.exit(1);
});
