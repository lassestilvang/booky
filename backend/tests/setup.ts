import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: "../.env.test" });

// Mock database
jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock Redis
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  })),
}));

// Mock MeiliSearch
jest.mock("meilisearch", () => ({
  MeiliSearch: jest.fn(() => ({
    index: jest.fn(() => ({
      addDocuments: jest.fn(),
      search: jest.fn(),
      deleteDocument: jest.fn(),
    })),
  })),
}));

// Mock BullMQ
jest.mock("bullmq", () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-token"),
  verify: jest.fn(),
}));
