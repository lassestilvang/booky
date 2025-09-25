const {
  mockChromeApis,
  mockExtensionStorage,
  mockNetworkFailures,
} = require("../../fixtures/extension/mocks");

describe("Background Script Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock fetch globally
    global.fetch = jest.fn();

    // Setup chrome storage mock
    chrome.storage.local.get.mockImplementation((keys) => {
      const result = {};
      keys.forEach((key) => {
        if (key === "authToken") {
          result[key] = mockExtensionStorage.auth.token;
        }
      });
      return Promise.resolve(result);
    });

    chrome.storage.local.set.mockResolvedValue();

    // Load the background script
    require("../../../extension/background.js");
  });

  describe("Authentication", () => {
    describe("checkAuth", () => {
      test("should return authenticated true when token exists", async () => {
        const mockSendResponse = jest.fn();

        // Call the message listener using the helper
        triggerChromeMessage({ action: "checkAuth" }, {}, mockSendResponse);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({ authenticated: true });
      });

      test("should return authenticated false when no token", async () => {
        chrome.storage.local.get.mockResolvedValue({});

        const mockSendResponse = jest.fn();

        triggerChromeMessage({ action: "checkAuth" }, {}, mockSendResponse);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({ authenticated: false });
      });

      test("should handle storage errors gracefully", async () => {
        chrome.storage.local.get.mockRejectedValue(new Error("Storage error"));

        const mockSendResponse = jest.fn();

        triggerChromeMessage({ action: "checkAuth" }, {}, mockSendResponse);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({ authenticated: false });
      });
    });

    describe("login", () => {
      test("should successfully authenticate with email/password and store token", async () => {
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ token: "new_jwt_token" }),
        });

        const mockSendResponse = jest.fn();
        const loginData = {
          email: "user@example.com",
          password: "password123",
        };

        triggerChromeMessage(
          { action: "login", data: loginData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledWith(
          "http://localhost:3000/v1/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: "user@example.com",
              password: "password123",
            }),
          }
        );
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          authToken: "new_jwt_token",
        });
        expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      });

      test("should handle login failure", async () => {
        global.fetch.mockResolvedValue({
          ok: false,
          json: jest.fn().mockResolvedValue({ message: "Invalid credentials" }),
        });

        const mockSendResponse = jest.fn();
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        const loginData = {
          email: "user@example.com",
          password: "wrongpassword",
        };

        triggerChromeMessage(
          { action: "login", data: loginData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Invalid credentials",
        });

        consoleSpy.mockRestore();
      });
    });

    describe("logout", () => {
      test("should successfully clear stored token", async () => {
        const mockSendResponse = jest.fn();

        triggerChromeMessage({ action: "logout" }, {}, mockSendResponse);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(chrome.storage.local.remove).toHaveBeenCalledWith(["authToken"]);
        expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      });

      test("should handle logout failure", async () => {
        chrome.storage.local.remove.mockRejectedValue(
          new Error("Storage error")
        );

        const mockSendResponse = jest.fn();
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        triggerChromeMessage({ action: "logout" }, {}, mockSendResponse);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleSpy).toHaveBeenCalledWith(
          "Logout failed:",
          expect.any(Error)
        );
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Storage error",
        });

        consoleSpy.mockRestore();
      });
    });
  });

  describe("Collections", () => {
    describe("getCollections", () => {
      beforeEach(() => {
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockExtensionStorage.collections),
        });
      });

      test("should fetch and return collections successfully", async () => {
        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "getCollections" },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledWith(
          "http://localhost:3000/v1/collections",
          {
            headers: {
              Authorization: `Bearer ${mockExtensionStorage.auth.token}`,
            },
          }
        );
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: true,
          collections: mockExtensionStorage.collections,
        });
      });

      test("should handle unauthenticated requests", async () => {
        chrome.storage.local.get.mockResolvedValue({});

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "getCollections" },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Not authenticated",
        });
      });

      test("should handle API errors", async () => {
        global.fetch.mockResolvedValue({
          ok: false,
          statusText: "Internal Server Error",
        });

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "getCollections" },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Failed to fetch collections",
        });
      });

      test("should handle network failures", async () => {
        global.fetch.mockRejectedValue(new Error("Network error"));

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "getCollections" },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Network error",
        });
      });
    });
  });

  describe("Bookmarks", () => {
    describe("saveBookmark", () => {
      const bookmarkData = {
        url: "https://example.com",
        title: "Test Page",
        notes: "Test notes",
        collectionId: "1",
      };

      beforeEach(() => {
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: "new_bookmark_id" }),
        });
      });

      test("should save bookmark successfully", async () => {
        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveBookmark", data: bookmarkData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledWith(
          "http://localhost:3000/v1/bookmarks",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${mockExtensionStorage.auth.token}`,
            },
            body: JSON.stringify({
              url: bookmarkData.url,
              collectionId: bookmarkData.collectionId,
              notes: bookmarkData.notes,
            }),
          }
        );
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: true,
          id: "new_bookmark_id",
        });
      });

      test("should handle unauthenticated save attempts", async () => {
        chrome.storage.local.get.mockResolvedValue({});

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveBookmark", data: bookmarkData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Not authenticated",
        });
      });

      test("should handle API save failures", async () => {
        global.fetch.mockResolvedValue({
          ok: false,
        });

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveBookmark", data: bookmarkData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Failed to save bookmark",
        });
      });

      test("should handle network errors during save", async () => {
        global.fetch.mockRejectedValue(new Error("Network timeout"));

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveBookmark", data: bookmarkData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Network timeout",
        });
      });
    });
  });

  describe("Highlights", () => {
    describe("saveHighlight", () => {
      const highlightData = {
        url: "https://example.com",
        text: "Selected text to highlight",
        notes: "Highlight notes",
        collectionId: "1",
      };

      beforeEach(() => {
        global.fetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ id: "bookmark_id" }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ id: "highlight_id" }),
          });
      });

      test("should save bookmark first, then highlight", async () => {
        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveHighlight", data: highlightData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledTimes(2);

        // First call should be bookmark creation
        expect(global.fetch).toHaveBeenNthCalledWith(
          1,
          "http://localhost:3000/v1/bookmarks",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${mockExtensionStorage.auth.token}`,
            },
            body: JSON.stringify({
              url: highlightData.url,
              collectionId: highlightData.collectionId,
              notes: highlightData.notes,
            }),
          }
        );

        // Second call should be highlight creation
        expect(global.fetch).toHaveBeenNthCalledWith(
          2,
          "http://localhost:3000/v1/highlights",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${mockExtensionStorage.auth.token}`,
            },
            body: JSON.stringify({
              bookmarkId: "bookmark_id",
              text: highlightData.text,
            }),
          }
        );

        expect(mockSendResponse).toHaveBeenCalledWith({
          success: true,
          highlightId: "highlight_id",
        });
      });

      test("should handle bookmark creation failure", async () => {
        global.fetch.mockResolvedValueOnce({
          ok: false,
        });

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveHighlight", data: highlightData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledTimes(1); // Only bookmark creation attempted
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Failed to save bookmark",
        });
      });

      test("should handle highlight creation failure after bookmark success", async () => {
        global.fetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ id: "bookmark_id" }),
          })
          .mockResolvedValueOnce({
            ok: false,
          });

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveHighlight", data: highlightData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Failed to save highlight",
        });
      });

      test("should handle unauthenticated highlight save", async () => {
        chrome.storage.local.get.mockResolvedValue({});

        const mockSendResponse = jest.fn();

        triggerChromeMessage(
          { action: "saveHighlight", data: highlightData },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockSendResponse).toHaveBeenCalledWith({
          success: false,
          error: "Not authenticated",
        });
      });
    });
  });

  describe("Offline Scenarios", () => {
    test("should handle network timeouts", async () => {
      global.fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: false }), 100)
          )
      );

      const mockSendResponse = jest.fn();

      triggerChromeMessage({ action: "getCollections" }, {}, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch collections",
      });
    });

    test("should handle DNS resolution failures", async () => {
      global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const mockSendResponse = jest.fn();

      triggerChromeMessage(
        { action: "saveBookmark", data: { url: "https://example.com" } },
        {},
        mockSendResponse
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch",
      });
    });
  });

  describe("Edge Cases", () => {
    test("should handle malformed request data", async () => {
      const mockSendResponse = jest.fn();

      triggerChromeMessage(
        { action: "saveBookmark", data: null },
        {},
        mockSendResponse
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should still attempt to access token and fail gracefully
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Not authenticated",
      });
    });

    test("should handle unknown actions", async () => {
      const mockSendResponse = jest.fn();

      triggerChromeMessage({ action: "unknownAction" }, {}, mockSendResponse);

      // Unknown actions are not handled, so sendResponse should not be called
      expect(mockSendResponse).not.toHaveBeenCalled();
    });

    test("should handle concurrent requests", async () => {
      const responses = [];
      const mockSendResponse1 = jest.fn((response) => responses.push(response));
      const mockSendResponse2 = jest.fn((response) => responses.push(response));

      // Send two concurrent requests
      triggerChromeMessage({ action: "checkAuth" }, {}, mockSendResponse1);

      triggerChromeMessage({ action: "checkAuth" }, {}, mockSendResponse2);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(responses).toHaveLength(2);
      expect(responses[0]).toEqual({ authenticated: true });
      expect(responses[1]).toEqual({ authenticated: true });
    });
  });
});
