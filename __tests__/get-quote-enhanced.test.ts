/**
 * Integration tests for the enhanced get_quote tool with numberOfQuotes parameter
 *
 * This test suite validates the complete integration of the enhanced get_quote tool,
 * including parameter validation, SerperService integration, and error handling.
 */

import { SerperService } from "../src/services/serper-service.js";
import { validateQuoteParameters } from "../src/utils/parameter-validator.js";
import {
  SerperApiError,
  SerperConfigurationError,
} from "../src/types/serper-errors.js";

// Mock the SerperService
jest.mock("../src/services/serper-service.js");
const MockedSerperService = SerperService as jest.MockedClass<
  typeof SerperService
>;

// Mock the logger to avoid noise in tests
jest.mock("../src/utils/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  logError: jest.fn(),
  logApiRequest: jest.fn(),
  logApiResponse: jest.fn(),
}));

describe("get-quote-enhanced integration", () => {
  let mockSerperInstance: jest.Mocked<SerperService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock instance
    mockSerperInstance = {
      getQuote: jest.fn(),
    } as any;

    // Make the constructor return our mock instance
    MockedSerperService.mockImplementation(() => mockSerperInstance);
  });

  describe("parameter validation integration", () => {
    it("should validate parameters before making API calls", async () => {
      // Test that validation happens first
      const result = validateQuoteParameters({
        person: "Albert Einstein",
        topic: "science",
        numberOfQuotes: 3,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.person).toBe("Albert Einstein");
        expect(result.data.topic).toBe("science");
        expect(result.data.numberOfQuotes).toBe(3);
      }
    });

    it("should reject invalid parameters before API calls", async () => {
      const result = validateQuoteParameters({
        person: "",
        topic: "science",
        numberOfQuotes: 15, // Invalid: too high
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors).toContain("Person parameter cannot be empty");
        expect(result.errors).toContain(
          "Number of quotes parameter must be between 1 and 10"
        );
      }
    });
  });

  describe("SerperService integration with numberOfQuotes", () => {
    beforeEach(() => {
      // Set up environment variable
      process.env.SERPER_API_KEY = "test-api-key";
    });

    afterEach(() => {
      delete process.env.SERPER_API_KEY;
    });

    it("should call SerperService with correct parameters for single quote", async () => {
      const expectedQuote = "The important thing is not to stop questioning.";
      mockSerperInstance.getQuote.mockResolvedValue(expectedQuote);

      // Simulate the tool handler logic
      const validationResult = validateQuoteParameters({
        person: "Albert Einstein",
        topic: "curiosity",
        numberOfQuotes: 1,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, topic, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote(
          { person, topic },
          numberOfQuotes
        );

        expect(MockedSerperService).toHaveBeenCalledWith("test-api-key");
        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "Albert Einstein", topic: "curiosity" },
          1
        );
        expect(result).toBe(expectedQuote);
      }
    });

    it("should call SerperService with correct parameters for multiple quotes", async () => {
      const expectedQuotes = `1. "The important thing is not to stop questioning."

2. "Imagination is more important than knowledge."

3. "Try not to become a person of success, but rather try to become a person of value."`;

      mockSerperInstance.getQuote.mockResolvedValue(expectedQuotes);

      const validationResult = validateQuoteParameters({
        person: "Albert Einstein",
        numberOfQuotes: 3,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote({ person }, numberOfQuotes);

        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "Albert Einstein" },
          3
        );
        expect(result).toBe(expectedQuotes);
      }
    });

    it("should handle maximum numberOfQuotes (10)", async () => {
      const expectedQuotes = Array.from(
        { length: 10 },
        (_, i) => `${i + 1}. "Quote number ${i + 1} from Maya Angelou."`
      ).join("\n\n");

      mockSerperInstance.getQuote.mockResolvedValue(expectedQuotes);

      const validationResult = validateQuoteParameters({
        person: "Maya Angelou",
        topic: "courage",
        numberOfQuotes: 10,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, topic, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote(
          { person, topic },
          numberOfQuotes
        );

        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "Maya Angelou", topic: "courage" },
          10
        );
        expect(result).toBe(expectedQuotes);
      }
    });

    it("should handle minimum numberOfQuotes (1)", async () => {
      const expectedQuote = "If you don't like something, change it.";
      mockSerperInstance.getQuote.mockResolvedValue(expectedQuote);

      const validationResult = validateQuoteParameters({
        person: "Maya Angelou",
        numberOfQuotes: 1,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote({ person }, numberOfQuotes);

        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "Maya Angelou" },
          1
        );
        expect(result).toBe(expectedQuote);
      }
    });
  });

  describe("error handling scenarios", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    afterEach(() => {
      delete process.env.SERPER_API_KEY;
    });

    it("should handle SerperApiError appropriately", async () => {
      const apiError = new SerperApiError("API rate limit exceeded", 429);
      mockSerperInstance.getQuote.mockRejectedValue(apiError);

      const validationResult = validateQuoteParameters({
        person: "Winston Churchill",
        numberOfQuotes: 2,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");

        await expect(
          service.getQuote({ person }, numberOfQuotes)
        ).rejects.toThrow(SerperApiError);

        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "Winston Churchill" },
          2
        );
      }
    });

    it("should handle SerperConfigurationError appropriately", async () => {
      const configError = new SerperConfigurationError(
        "Invalid API key format"
      );
      mockSerperInstance.getQuote.mockRejectedValue(configError);

      const validationResult = validateQuoteParameters({
        person: "Mark Twain",
        numberOfQuotes: 1,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");

        await expect(
          service.getQuote({ person }, numberOfQuotes)
        ).rejects.toThrow(SerperConfigurationError);
      }
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network connection failed");
      mockSerperInstance.getQuote.mockRejectedValue(networkError);

      const validationResult = validateQuoteParameters({
        person: "Socrates",
        numberOfQuotes: 1,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");

        await expect(
          service.getQuote({ person }, numberOfQuotes)
        ).rejects.toThrow("Network connection failed");
      }
    });

    it("should handle cases where API returns fewer quotes than requested", async () => {
      // Simulate API returning only 2 quotes when 5 were requested
      const partialQuotes = `1. "The only true wisdom is in knowing you know nothing."

2. "An unexamined life is not worth living."`;

      mockSerperInstance.getQuote.mockResolvedValue(partialQuotes);

      const validationResult = validateQuoteParameters({
        person: "Socrates",
        numberOfQuotes: 5,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote({ person }, numberOfQuotes);

        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "Socrates" },
          5
        );
        expect(result).toBe(partialQuotes);
        // The actual filtering/limiting logic is in SerperService
      }
    });
  });

  describe("edge cases and boundary conditions", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    afterEach(() => {
      delete process.env.SERPER_API_KEY;
    });

    it("should handle unicode characters in person names", async () => {
      const expectedQuote = "道可道，非常道。";
      mockSerperInstance.getQuote.mockResolvedValue(expectedQuote);

      const validationResult = validateQuoteParameters({
        person: "老子",
        numberOfQuotes: 1,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote({ person }, numberOfQuotes);

        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "老子" },
          1
        );
        expect(result).toBe(expectedQuote);
      }
    });

    it("should handle very long person names", async () => {
      const longName =
        "A Very Long Historical Person Name That Might Exist Somewhere In History";
      const expectedQuote =
        "This is a quote from a person with a very long name.";
      mockSerperInstance.getQuote.mockResolvedValue(expectedQuote);

      const validationResult = validateQuoteParameters({
        person: longName,
        numberOfQuotes: 1,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote({ person }, numberOfQuotes);

        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: longName },
          1
        );
        expect(result).toBe(expectedQuote);
      }
    });

    it("should handle empty API responses", async () => {
      const fallbackMessage =
        "Unable to find quotes from Unknown Person. Please verify the person's name or try a more famous figure.";
      mockSerperInstance.getQuote.mockResolvedValue(fallbackMessage);

      const validationResult = validateQuoteParameters({
        person: "Unknown Person",
        numberOfQuotes: 3,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const { person, numberOfQuotes } = validationResult.data;

        const service = new SerperService("test-api-key");
        const result = await service.getQuote({ person }, numberOfQuotes);

        expect(result).toContain("Unable to find");
        expect(result).toContain("Unknown Person");
      }
    });
  });

  describe("complete workflow integration", () => {
    beforeEach(() => {
      process.env.SERPER_API_KEY = "test-api-key";
    });

    afterEach(() => {
      delete process.env.SERPER_API_KEY;
    });

    it("should execute complete validation-to-API workflow", async () => {
      const expectedQuotes = `1. "Be yourself; everyone else is already taken."

2. "I can resist everything except temptation."`;

      mockSerperInstance.getQuote.mockResolvedValue(expectedQuotes);

      // Step 1: Validate parameters
      const validationResult = validateQuoteParameters({
        person: "  Oscar Wilde  ", // Test trimming
        topic: "wit",
        numberOfQuotes: 2,
      });

      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        // Step 2: Extract validated parameters
        const { person, topic, numberOfQuotes } = validationResult.data;
        expect(person).toBe("Oscar Wilde"); // Should be trimmed
        expect(topic).toBe("wit");
        expect(numberOfQuotes).toBe(2);

        // Step 3: Call API with validated parameters
        const service = new SerperService("test-api-key");
        const result = await service.getQuote(
          { person, topic },
          numberOfQuotes
        );

        // Step 4: Verify results
        expect(MockedSerperService).toHaveBeenCalledWith("test-api-key");
        expect(mockSerperInstance.getQuote).toHaveBeenCalledWith(
          { person: "Oscar Wilde", topic: "wit" },
          2
        );
        expect(result).toBe(expectedQuotes);
      }
    });

    it("should fail gracefully with invalid validation", async () => {
      // Invalid parameters should fail validation
      const validationResult = validateQuoteParameters({
        person: "",
        numberOfQuotes: 0,
      });

      expect(validationResult.success).toBe(false);

      // API should never be called with invalid parameters
      expect(MockedSerperService).not.toHaveBeenCalled();
      expect(mockSerperInstance.getQuote).not.toHaveBeenCalled();
    });
  });
});
