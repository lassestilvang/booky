import { createClient } from "redis";

// Mock redis
jest.mock("redis");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Redis Client", () => {
  let mockClient: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockClient = {
      on: jest.fn(),
    };
    mockCreateClient.mockReturnValue(mockClient);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should create redis client with correct URL", () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    // Import after setting env
    require("../../../src/redis");

    expect(mockCreateClient).toHaveBeenCalledWith({
      url: "redis://localhost:6379",
    });
  });

  it("should set up error event handler", () => {
    require("../../../src/redis");

    expect(mockClient.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("should log errors when error event is emitted", () => {
    require("../../../src/redis");

    const errorHandler = mockClient.on.mock.calls.find(
      (call) => call[0] === "error"
    )[1];
    const testError = new Error("Connection failed");

    errorHandler(testError);

    expect(consoleSpy).toHaveBeenCalledWith("Redis Client Error", testError);
  });
});
