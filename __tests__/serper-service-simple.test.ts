import { jest } from "@jest/globals";
import axios from "axios";
import { SerperService } from "../src/services/serper-service";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios instance
const mockAxiosInstance = {
  post: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

describe("SerperService Coverage Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should test private constructSearchQuery method", () => {
    const service = new SerperService("test-api-key");
    const query = (service as any).constructSearchQuery({ person: "Einstein" });
    expect(query).toContain("Einstein");
    expect(query).toContain("quotes");
  });

  it("should test constructSearchQuery with topic", () => {
    const service = new SerperService("test-api-key");
    const query = (service as any).constructSearchQuery({
      person: "Einstein",
      topic: "science",
    });
    expect(query).toContain("Einstein");
    expect(query).toContain("science");
    expect(query).toContain("quotes");
  });

  it("should test parseQuoteFromResponse method", () => {
    const service = new SerperService("test-api-key");
    const mockResponse = {
      organic: [
        {
          title: "Einstein Quote",
          snippet: '"Imagination is more important than knowledge."',
          link: "https://example.com",
        },
      ],
    };

    const result = (service as any).parseQuoteFromResponse(
      mockResponse,
      "Einstein"
    );
    expect(result).toBe("Imagination is more important than knowledge.");
  });

  it("should test parseQuoteFromResponse with no results", () => {
    const service = new SerperService("test-api-key");
    const mockResponse = {
      organic: [],
    };

    const result = (service as any).parseQuoteFromResponse(
      mockResponse,
      "Einstein"
    );
    expect(result).toContain("Unable to find");
  });

  it("should test private setupAxiosInstance method coverage", () => {
    // This test ensures the private setupAxiosInstance method is called during construction
    const service = new SerperService("test-api-key");
    expect(service).toBeInstanceOf(SerperService);
  });

  it("should test setupInterceptors method coverage", () => {
    // This test ensures the private setupInterceptors method is called during construction
    const service = new SerperService("test-api-key");
    expect(service).toBeInstanceOf(SerperService);
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });
});
