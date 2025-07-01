/**
 * Unit tests for prompt template resource content and registration
 *
 * This test suite validates the prompt template resource structure against
 * ADR 004 specification and tests resource registration functionality.
 */

import {
  getPromptTemplateContent,
  PROMPT_TEMPLATE_CONTENT,
} from "../src/resources/prompt-template-content.js";
// PromptTemplateContent type is used implicitly in the resource content

describe("prompt-template-resource", () => {
  describe("PROMPT_TEMPLATE_CONTENT", () => {
    it("should export a constant with the correct structure", () => {
      expect(PROMPT_TEMPLATE_CONTENT).toBeDefined();
      expect(typeof PROMPT_TEMPLATE_CONTENT).toBe("object");
    });

    it("should have all required top-level properties", () => {
      expect(PROMPT_TEMPLATE_CONTENT).toHaveProperty("template");
      expect(PROMPT_TEMPLATE_CONTENT).toHaveProperty("parameters");
      expect(PROMPT_TEMPLATE_CONTENT).toHaveProperty("examples");
      expect(PROMPT_TEMPLATE_CONTENT).toHaveProperty("bestPractices");
    });

    describe("template property", () => {
      it("should have all required template variations", () => {
        const { template } = PROMPT_TEMPLATE_CONTENT;

        expect(template).toHaveProperty("basic");
        expect(template).toHaveProperty("withTopic");
        expect(template).toHaveProperty("withCount");
        expect(template).toHaveProperty("comprehensive");
      });

      it("should have correct template strings as defined in ADR 004", () => {
        const { template } = PROMPT_TEMPLATE_CONTENT;

        expect(template.basic).toBe("Get a quote from {person}");
        expect(template.withTopic).toBe(
          "Get a quote from {person} about {topic}"
        );
        expect(template.withCount).toBe(
          "Get {numberOfQuotes} quotes from {person}"
        );
        expect(template.comprehensive).toBe(
          "Get {numberOfQuotes} quotes from {person} about {topic}"
        );
      });

      it("should contain parameter placeholders in curly braces", () => {
        const { template } = PROMPT_TEMPLATE_CONTENT;

        expect(template.basic).toContain("{person}");
        expect(template.withTopic).toContain("{person}");
        expect(template.withTopic).toContain("{topic}");
        expect(template.withCount).toContain("{numberOfQuotes}");
        expect(template.withCount).toContain("{person}");
        expect(template.comprehensive).toContain("{numberOfQuotes}");
        expect(template.comprehensive).toContain("{person}");
        expect(template.comprehensive).toContain("{topic}");
      });
    });

    describe("parameters property", () => {
      it("should have all required parameter specifications", () => {
        const { parameters } = PROMPT_TEMPLATE_CONTENT;

        expect(parameters).toHaveProperty("person");
        expect(parameters).toHaveProperty("topic");
        expect(parameters).toHaveProperty("numberOfQuotes");
      });

      describe("person parameter", () => {
        it("should have correct specification", () => {
          const { person } = PROMPT_TEMPLATE_CONTENT.parameters;

          expect(person.type).toBe("string");
          expect(person.required).toBe(true);
          expect(person.description).toBe(
            "The name of the person to get quotes from"
          );
          expect(person.validation).toBe("Must not be empty");
        });
      });

      describe("topic parameter", () => {
        it("should have correct specification", () => {
          const { topic } = PROMPT_TEMPLATE_CONTENT.parameters;

          expect(topic.type).toBe("string");
          expect(topic.required).toBe(false);
          expect(topic.description).toBe("Optional topic to filter quotes by");
          expect(topic.validation).toBeUndefined();
        });
      });

      describe("numberOfQuotes parameter", () => {
        it("should have correct specification", () => {
          const { numberOfQuotes } = PROMPT_TEMPLATE_CONTENT.parameters;

          expect(numberOfQuotes.type).toBe("integer");
          expect(numberOfQuotes.required).toBe(true);
          expect(numberOfQuotes.description).toBe(
            "Number of quotes to retrieve"
          );
          expect(numberOfQuotes.validation).toBe(
            "Must be a positive integer between 1 and 10"
          );
        });
      });
    });

    describe("examples property", () => {
      it("should be an array with at least one example", () => {
        const { examples } = PROMPT_TEMPLATE_CONTENT;

        expect(Array.isArray(examples)).toBe(true);
        expect(examples.length).toBeGreaterThan(0);
      });

      it("should have examples with required structure", () => {
        const { examples } = PROMPT_TEMPLATE_CONTENT;

        examples.forEach((example, _index) => {
          expect(example).toHaveProperty("prompt");
          expect(example).toHaveProperty("parameters");
          expect(typeof example.prompt).toBe("string");
          expect(typeof example.parameters).toBe("object");

          // Each example should have person and numberOfQuotes
          expect(example.parameters).toHaveProperty("person");
          expect(example.parameters).toHaveProperty("numberOfQuotes");
          expect(typeof example.parameters.person).toBe("string");
          expect(typeof example.parameters.numberOfQuotes).toBe("number");
        });
      });

      it("should include the specific example from ADR 004", () => {
        const { examples } = PROMPT_TEMPLATE_CONTENT;

        const adr004Example = examples.find(
          (ex) =>
            ex.prompt === "Get 3 quotes from Albert Einstein about science" &&
            ex.parameters.person === "Albert Einstein" &&
            ex.parameters.topic === "science" &&
            ex.parameters.numberOfQuotes === 3
        );

        expect(adr004Example).toBeDefined();
      });

      it("should have examples covering different numberOfQuotes values", () => {
        const { examples } = PROMPT_TEMPLATE_CONTENT;

        const quoteCounts = examples.map((ex) => ex.parameters.numberOfQuotes);
        const uniqueCounts = [...new Set(quoteCounts)];

        // Should have variety in quote counts
        expect(uniqueCounts.length).toBeGreaterThan(1);

        // Should include boundary values (1 and higher numbers)
        expect(quoteCounts.some((count) => count === 1)).toBe(true);
        expect(quoteCounts.some((count) => count > 1)).toBe(true);
      });

      it("should have examples with and without topics", () => {
        const { examples } = PROMPT_TEMPLATE_CONTENT;

        const withTopic = examples.filter((ex) => ex.parameters.topic);
        const withoutTopic = examples.filter((ex) => !ex.parameters.topic);

        expect(withTopic.length).toBeGreaterThan(0);
        expect(withoutTopic.length).toBeGreaterThan(0);
      });

      it("should have valid numberOfQuotes in all examples", () => {
        const { examples } = PROMPT_TEMPLATE_CONTENT;

        examples.forEach((example) => {
          const { numberOfQuotes } = example.parameters;
          expect(numberOfQuotes).toBeGreaterThanOrEqual(1);
          expect(numberOfQuotes).toBeLessThanOrEqual(10);
          expect(Number.isInteger(numberOfQuotes)).toBe(true);
        });
      });
    });

    describe("bestPractices property", () => {
      it("should be an array with practical advice", () => {
        const { bestPractices } = PROMPT_TEMPLATE_CONTENT;

        expect(Array.isArray(bestPractices)).toBe(true);
        expect(bestPractices.length).toBeGreaterThan(0);
      });

      it("should have all strings as best practices", () => {
        const { bestPractices } = PROMPT_TEMPLATE_CONTENT;

        bestPractices.forEach((practice) => {
          expect(typeof practice).toBe("string");
          expect(practice.length).toBeGreaterThan(0);
        });
      });

      it("should include specific guidance from ADR 004", () => {
        const { bestPractices } = PROMPT_TEMPLATE_CONTENT;

        const practicesText = bestPractices.join(" ").toLowerCase();

        // Should mention key concepts
        expect(practicesText).toContain("specific");
        expect(practicesText).toContain("person");
        expect(practicesText).toContain("topic");
        expect(practicesText).toContain("1-10");
      });

      it("should provide actionable guidance", () => {
        const { bestPractices } = PROMPT_TEMPLATE_CONTENT;

        // Each practice should be reasonably descriptive
        bestPractices.forEach((practice) => {
          expect(practice.length).toBeGreaterThan(10);
          expect(practice.trim()).toBe(practice); // No leading/trailing whitespace
        });
      });
    });
  });

  describe("getPromptTemplateContent function", () => {
    it("should return the same content as the constant", () => {
      const result = getPromptTemplateContent();
      expect(result).toEqual(PROMPT_TEMPLATE_CONTENT);
    });

    it("should return a valid PromptTemplateContent object", () => {
      const result = getPromptTemplateContent();

      // Type structure validation
      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("template");
      expect(result).toHaveProperty("parameters");
      expect(result).toHaveProperty("examples");
      expect(result).toHaveProperty("bestPractices");
    });

    it("should return immutable content", () => {
      const result1 = getPromptTemplateContent();
      const result2 = getPromptTemplateContent();

      expect(result1).toEqual(result2);
      expect(result1).toBe(result2); // Should be the same reference for consistency
    });
  });

  describe("JSON serialization", () => {
    it("should serialize to valid JSON", () => {
      const content = getPromptTemplateContent();

      expect(() => {
        JSON.stringify(content);
      }).not.toThrow();
    });

    it("should deserialize back to equivalent object", () => {
      const content = getPromptTemplateContent();
      const serialized = JSON.stringify(content);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(content);
    });

    it("should produce readable JSON output", () => {
      const content = getPromptTemplateContent();
      const formatted = JSON.stringify(content, null, 2);

      // Should be properly formatted
      expect(formatted).toContain("{\n");
      expect(formatted).toContain("  ");
      expect(formatted.split("\n").length).toBeGreaterThan(10); // Multi-line
    });
  });

  describe("ADR 004 compliance", () => {
    it("should match the exact structure defined in ADR 004", () => {
      const content = getPromptTemplateContent();

      // Verify the structure matches exactly what's defined in the ADR
      expect(content.template.basic).toBe("Get a quote from {person}");
      expect(content.parameters.numberOfQuotes.validation).toBe(
        "Must be a positive integer between 1 and 10"
      );

      // Verify the specific example from ADR 004 is present
      const adr004Example = content.examples.find(
        (ex) => ex.prompt === "Get 3 quotes from Albert Einstein about science"
      );
      expect(adr004Example).toBeDefined();
      expect(adr004Example?.parameters.person).toBe("Albert Einstein");
      expect(adr004Example?.parameters.topic).toBe("science");
      expect(adr004Example?.parameters.numberOfQuotes).toBe(3);
    });

    it("should include all required best practices from ADR 004", () => {
      const { bestPractices } = getPromptTemplateContent();

      const expectedPractices = [
        "Use specific person names for better results",
        "Topics should be general concepts rather than very specific terms",
        "Request reasonable numbers of quotes (1-10) for optimal performance",
      ];

      expectedPractices.forEach((expected) => {
        expect(bestPractices).toContain(expected);
      });
    });

    it("should maintain backward compatibility", () => {
      const content = getPromptTemplateContent();

      // Core structure should remain stable
      expect(content).toHaveProperty("template.basic");
      expect(content).toHaveProperty("template.withTopic");
      expect(content).toHaveProperty("template.withCount");
      expect(content).toHaveProperty("template.comprehensive");

      expect(content).toHaveProperty("parameters.person.required");
      expect(content).toHaveProperty("parameters.topic.required");
      expect(content).toHaveProperty("parameters.numberOfQuotes.required");
    });
  });
});
