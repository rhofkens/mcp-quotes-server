/**
 * Unit tests for parameter validation logic
 *
 * This test suite provides comprehensive coverage of the validateQuoteParameters
 * function, testing all validation scenarios including edge cases and boundary conditions.
 */

import { validateQuoteParameters } from "../src/utils/parameter-validator.js";
// Validation types are used implicitly through validateQuoteParameters return type

describe("parameter-validator", () => {
  describe("validateQuoteParameters", () => {
    describe("valid parameter combinations", () => {
      it("should validate valid parameters with all fields", () => {
        const result = validateQuoteParameters({
          person: "Albert Einstein",
          topic: "science",
          numberOfQuotes: 5,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.person).toBe("Albert Einstein");
          expect(result.data.topic).toBe("science");
          expect(result.data.numberOfQuotes).toBe(5);
        }
      });

      it("should validate valid parameters without topic", () => {
        const result = validateQuoteParameters({
          person: "Maya Angelou",
          topic: undefined,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.person).toBe("Maya Angelou");
          expect(result.data.topic).toBeUndefined();
          expect(result.data.numberOfQuotes).toBe(1);
        }
      });

      it("should validate with minimum numberOfQuotes (1)", () => {
        const result = validateQuoteParameters({
          person: "Winston Churchill",
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.numberOfQuotes).toBe(1);
        }
      });

      it("should validate with maximum numberOfQuotes (10)", () => {
        const result = validateQuoteParameters({
          person: "Mark Twain",
          numberOfQuotes: 10,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.numberOfQuotes).toBe(10);
        }
      });

      it("should trim whitespace from person parameter", () => {
        const result = validateQuoteParameters({
          person: "  Nelson Mandela  ",
          numberOfQuotes: 3,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.person).toBe("Nelson Mandela");
        }
      });

      it("should trim whitespace from topic parameter", () => {
        const result = validateQuoteParameters({
          person: "Gandhi",
          topic: "  peace  ",
          numberOfQuotes: 2,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.topic).toBe("peace");
        }
      });

      it("should handle empty topic string as undefined", () => {
        const result = validateQuoteParameters({
          person: "Socrates",
          topic: "   ",
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.topic).toBeUndefined();
        }
      });
    });

    describe("invalid person parameter", () => {
      it("should reject null person", () => {
        const result = validateQuoteParameters({
          person: null,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain("Person parameter is required");
        }
      });

      it("should reject undefined person", () => {
        const result = validateQuoteParameters({
          person: undefined,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain("Person parameter is required");
        }
      });

      it("should reject non-string person", () => {
        const result = validateQuoteParameters({
          person: 123,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain("Person parameter must be a string");
        }
      });

      it("should reject empty string person", () => {
        const result = validateQuoteParameters({
          person: "",
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain("Person parameter cannot be empty");
        }
      });

      it("should reject whitespace-only person", () => {
        const result = validateQuoteParameters({
          person: "   ",
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain("Person parameter cannot be empty");
        }
      });
    });

    describe("invalid numberOfQuotes parameter", () => {
      it("should reject null numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Plato",
          numberOfQuotes: null,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter is required"
          );
        }
      });

      it("should reject undefined numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Aristotle",
          numberOfQuotes: undefined,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter is required"
          );
        }
      });

      it("should reject non-number numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Confucius",
          numberOfQuotes: "5",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be a number"
          );
        }
      });

      it("should reject zero numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Buddha",
          numberOfQuotes: 0,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be between 1 and 10"
          );
        }
      });

      it("should reject negative numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Lao Tzu",
          numberOfQuotes: -1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be between 1 and 10"
          );
        }
      });

      it("should reject numberOfQuotes greater than 10", () => {
        const result = validateQuoteParameters({
          person: "Sun Tzu",
          numberOfQuotes: 11,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be between 1 and 10"
          );
        }
      });

      it("should reject non-integer numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Voltaire",
          numberOfQuotes: 5.5,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be an integer"
          );
        }
      });

      it("should reject NaN numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Descartes",
          numberOfQuotes: NaN,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be an integer"
          );
        }
      });
    });

    describe("invalid topic parameter", () => {
      it("should reject non-string topic when provided", () => {
        const result = validateQuoteParameters({
          person: "Shakespeare",
          topic: 123,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Topic parameter must be a string when provided"
          );
        }
      });

      it("should accept null topic", () => {
        const result = validateQuoteParameters({
          person: "Homer",
          topic: null,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.topic).toBeUndefined();
        }
      });
    });

    describe("multiple validation errors", () => {
      it("should return all validation errors when multiple parameters are invalid", () => {
        const result = validateQuoteParameters({
          person: "",
          topic: 123,
          numberOfQuotes: -1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toHaveLength(3);
          expect(result.errors).toContain("Person parameter cannot be empty");
          expect(result.errors).toContain(
            "Topic parameter must be a string when provided"
          );
          expect(result.errors).toContain(
            "Number of quotes parameter must be between 1 and 10"
          );
        }
      });

      it("should return multiple person-related errors", () => {
        const result = validateQuoteParameters({
          person: null,
          numberOfQuotes: "invalid",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors).toContain("Person parameter is required");
          expect(result.errors).toContain(
            "Number of quotes parameter must be a number"
          );
        }
      });
    });

    describe("edge cases and boundary conditions", () => {
      it("should handle very long person names", () => {
        const longName = "A".repeat(1000);
        const result = validateQuoteParameters({
          person: longName,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.person).toBe(longName);
        }
      });

      it("should handle very long topic names", () => {
        const longTopic = "philosophy".repeat(100);
        const result = validateQuoteParameters({
          person: "Nietzsche",
          topic: longTopic,
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.topic).toBe(longTopic);
        }
      });

      it("should handle unicode characters in person name", () => {
        const result = validateQuoteParameters({
          person: "老子",
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.person).toBe("老子");
        }
      });

      it("should handle unicode characters in topic", () => {
        const result = validateQuoteParameters({
          person: "Confucius",
          topic: "智慧",
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.topic).toBe("智慧");
        }
      });

      it("should handle mixed whitespace in person name", () => {
        const result = validateQuoteParameters({
          person: "\t  Rumi  \n",
          numberOfQuotes: 1,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.person).toBe("Rumi");
        }
      });

      it("should handle Infinity as numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Pascal",
          numberOfQuotes: Infinity,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be an integer"
          );
        }
      });

      it("should handle -Infinity as numberOfQuotes", () => {
        const result = validateQuoteParameters({
          person: "Spinoza",
          numberOfQuotes: -Infinity,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toContain(
            "Number of quotes parameter must be an integer"
          );
        }
      });
    });
  });
});
