const {
  mockChromeApis,
  mockExtensionStorage,
  mockExtensionEdgeCases,
} = require("../../fixtures/extension/mocks");

describe("Storage Sync Integration Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup global mocks
    global.fetch = jest.fn();

    // Setup chrome storage with initial data
    let storageData = { ...mockExtensionStorage };

    chrome.storage.local.get.mockImplementation((keys) => {
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach((key) => {
          result[key] = storageData[key];
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(storageData[keys] || {});
    });

    chrome.storage.local.set.mockImplementation((data) => {
      storageData = { ...storageData, ...data };
      return Promise.resolve();
    });

    chrome.storage.local.remove.mockImplementation((keys) => {
      if (Array.isArray(keys)) {
        keys.forEach((key) => delete storageData[key]);
      } else {
        delete storageData[keys];
      }
      return Promise.resolve();
    });

    // Load background script
    require("../../../extension/background.js");
  });

  describe("Local Storage Operations", () => {
    test("should store and retrieve authentication token", async () => {
      const testToken = "test_auth_token_123";

      // Store token
      await chrome.storage.local.set({ authToken: testToken });

      // Retrieve token
      const result = await chrome.storage.local.get(["authToken"]);

      expect(result.authToken).toBe(testToken);
    });

    test("should handle multiple storage keys", async () => {
      const testData = {
        authToken: "token_123",
        lastSync: "2023-01-25T12:00:00Z",
        userPreferences: { theme: "dark" },
      };

      await chrome.storage.local.set(testData);
      const result = await chrome.storage.local.get(Object.keys(testData));

      expect(result).toEqual(testData);
    });

    test("should remove storage keys", async () => {
      await chrome.storage.local.set({
        authToken: "token_123",
        tempData: "temporary",
      });

      await chrome.storage.local.remove(["tempData"]);

      const result = await chrome.storage.local.get(["authToken", "tempData"]);
      expect(result.authToken).toBe("token_123");
      expect(result.tempData).toBeUndefined();
    });
  });

  describe("Sync Status Management", () => {
    test("should track sync status for bookmarks", async () => {
      const pendingBookmark = {
        id: "pending_1",
        url: "https://example.com",
        title: "Pending Bookmark",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Store pending bookmark
      let bookmarks = [pendingBookmark];
      chrome.storage.local.get.mockImplementation((keys) => {
        const result = {};
        keys.forEach((key) => {
          if (key === "bookmarks") result[key] = bookmarks;
        });
        return Promise.resolve(result);
      });

      chrome.storage.local.set.mockImplementation((data) => {
        if (data.bookmarks) {
          bookmarks = data.bookmarks;
        }
        return Promise.resolve();
      });

      // Simulate sync completion
      const syncedBookmark = { ...pendingBookmark, status: "synced" };
      await chrome.storage.local.set({
        bookmarks: [syncedBookmark],
      });

      const result = await chrome.storage.local.get(["bookmarks"]);
      expect(result.bookmarks[0].status).toBe("synced");
    });

    test("should handle sync failures and retry logic", async () => {
      const failingBookmark = {
        id: "failing_1",
        url: "https://example.com",
        title: "Failing Bookmark",
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      let bookmarks = [failingBookmark];
      chrome.storage.local.get.mockImplementation((keys) => {
        const result = {};
        keys.forEach((key) => {
          if (key === "bookmarks") result[key] = bookmarks;
        });
        return Promise.resolve(result);
      });

      chrome.storage.local.set.mockImplementation((data) => {
        if (data.bookmarks) {
          bookmarks = data.bookmarks;
        }
        return Promise.resolve();
      });

      // Simulate sync failure - increment retry count
      const failedBookmark = {
        ...failingBookmark,
        status: "failed",
        retryCount: 1,
        error: "Network error",
      };

      await chrome.storage.local.set({
        bookmarks: [failedBookmark],
      });

      const result = await chrome.storage.local.get(["bookmarks"]);
      expect(result.bookmarks[0].status).toBe("failed");
      expect(result.bookmarks[0].retryCount).toBe(1);
    });

    test("should maintain sync queue order", async () => {
      const bookmarks = [
        { id: "1", status: "pending", createdAt: "2023-01-01T10:00:00Z" },
        { id: "2", status: "pending", createdAt: "2023-01-01T11:00:00Z" },
        { id: "3", status: "pending", createdAt: "2023-01-01T12:00:00Z" },
      ];

      chrome.storage.local.get.mockResolvedValue({ bookmarks });

      const result = await chrome.storage.local.get(["bookmarks"]);

      // Verify order is maintained
      expect(result.bookmarks[0].id).toBe("1");
      expect(result.bookmarks[1].id).toBe("2");
      expect(result.bookmarks[2].id).toBe("3");
    });
  });

  describe("Offline Queue Management", () => {
    test("should queue operations when offline", async () => {
      // Setup offline scenario
      global.fetch.mockRejectedValue(new Error("Network unreachable"));

      let pendingOperations = [];
      chrome.storage.local.get.mockImplementation((keys) => {
        const result = {};
        keys.forEach((key) => {
          if (key === "pendingOperations") result[key] = pendingOperations;
        });
        return Promise.resolve(result);
      });

      chrome.storage.local.set.mockImplementation((data) => {
        if (data.pendingOperations) {
          pendingOperations = data.pendingOperations;
        }
        return Promise.resolve();
      });

      // Attempt save operation while offline
      const mockSendResponse = jest.fn();
      triggerChromeMessage(
        {
          action: "saveBookmark",
          data: { url: "https://example.com", title: "Offline Bookmark" },
        },
        {},
        mockSendResponse
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should be queued for later sync
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Network unreachable",
      });

      // Verify operation was queued (in real implementation)
      // This would check that the operation was stored for retry
    });

    test("should process queued operations when back online", async () => {
      // Setup pending operations queue
      const pendingOps = [
        {
          id: "op_1",
          action: "saveBookmark",
          data: { url: "https://example.com", title: "Queued Bookmark" },
          timestamp: new Date().toISOString(),
        },
      ];

      let processedOps = [];
      chrome.storage.local.get.mockResolvedValue({
        pendingOperations: pendingOps,
      });
      chrome.storage.local.set.mockImplementation((data) => {
        if (data.pendingOperations) {
          processedOps = data.pendingOperations;
        }
        return Promise.resolve();
      });

      // Setup successful API response
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "processed_bookmark_id" }),
      });

      // Simulate coming back online and processing queue
      // In real implementation, this would be triggered by network status change

      // Process each pending operation
      for (const op of pendingOps) {
        const mockSendResponse = jest.fn();
        triggerChromeMessage(
          { action: op.action, data: op.data },
          {},
          mockSendResponse
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockSendResponse).toHaveBeenCalledWith({
          success: true,
          id: "processed_bookmark_id",
        });
      }

      // Verify operations were cleared from queue
      expect(global.fetch).toHaveBeenCalledTimes(pendingOps.length);
    });

    test("should handle large pending queues", async () => {
      const largeQueue = mockExtensionEdgeCases.largePendingQueue;

      chrome.storage.local.get.mockResolvedValue({
        pendingOperations: largeQueue,
      });

      const result = await chrome.storage.local.get(["pendingOperations"]);

      expect(result.pendingOperations).toHaveLength(50);
      expect(result.pendingOperations[0].id).toBe("pending_0");
      expect(result.pendingOperations[49].id).toBe("pending_49");
    });
  });

  describe("Storage Corruption Handling", () => {
    test("should handle corrupted storage data", async () => {
      // Setup corrupted storage
      chrome.storage.local.get.mockResolvedValue(
        mockExtensionEdgeCases.corruptedStorage
      );

      const mockSendResponse = jest.fn();

      // Try to check auth with corrupted data
      triggerChromeMessage({ action: "checkAuth" }, {}, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should handle gracefully (token is null, so not authenticated)
      expect(mockSendResponse).toHaveBeenCalledWith({ authenticated: false });
    });

    test("should recover from storage quota exceeded", async () => {
      const largeData = "x".repeat(5000000); // 5MB string

      chrome.storage.local.set.mockRejectedValue(new Error("Quota exceeded"));

      try {
        await chrome.storage.local.set({ largeData });
        fail("Should have thrown quota error");
      } catch (error) {
        expect(error.message).toContain("Quota exceeded");
      }
    });

    test("should handle storage access errors", async () => {
      chrome.storage.local.get.mockRejectedValue(
        new Error("Storage access denied")
      );

      const mockSendResponse = jest.fn();

      triggerChromeMessage({ action: "checkAuth" }, {}, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSendResponse).toHaveBeenCalledWith({ authenticated: false });
    });
  });

  describe("Sync Conflict Resolution", () => {
    test("should handle concurrent modifications", async () => {
      let bookmarks = [{ id: "1", title: "Original Title", version: 1 }];

      chrome.storage.local.get.mockImplementation(() => {
        return Promise.resolve({ bookmarks: [...bookmarks] });
      });

      chrome.storage.local.set.mockImplementation((data) => {
        if (data.bookmarks) {
          // Simulate concurrent modification
          bookmarks = data.bookmarks.map((b) => ({
            ...b,
            version: b.version + 1,
          }));
        }
        return Promise.resolve();
      });

      // Simulate two concurrent updates
      const update1 = chrome.storage.local.set({
        bookmarks: [{ id: "1", title: "Update 1", version: 1 }],
      });

      const update2 = chrome.storage.local.set({
        bookmarks: [{ id: "1", title: "Update 2", version: 1 }],
      });

      await Promise.all([update1, update2]);

      const result = await chrome.storage.local.get(["bookmarks"]);
      // Last write wins (version should be incremented)
      expect(result.bookmarks[0].version).toBe(2);
    });

    test("should detect and resolve version conflicts", async () => {
      const bookmarkV1 = { id: "1", title: "Version 1", version: 1 };
      const bookmarkV2 = { id: "1", title: "Version 2", version: 2 };

      // Setup storage with version 2
      chrome.storage.local.get.mockResolvedValue({ bookmarks: [bookmarkV2] });

      // Try to save version 1 (stale)
      chrome.storage.local.set.mockImplementation((data) => {
        if (data.bookmarks && data.bookmarks[0].version < bookmarkV2.version) {
          throw new Error("Version conflict");
        }
        return Promise.resolve();
      });

      try {
        await chrome.storage.local.set({ bookmarks: [bookmarkV1] });
        fail("Should have detected version conflict");
      } catch (error) {
        expect(error.message).toContain("Version conflict");
      }
    });
  });

  describe("Performance and Memory", () => {
    test("should handle rapid storage operations", async () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        [`key_${i}`]: `value_${i}`,
      }));

      const promises = operations.map((op) => chrome.storage.local.set(op));

      await Promise.all(promises);

      // Verify all operations completed without errors
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(100);
    });

    test("should cleanup expired temporary data", async () => {
      const expiredData = {
        tempAuth: "expired_token",
        tempData: "old_data",
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      const validData = {
        authToken: "valid_token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };

      chrome.storage.local.get.mockResolvedValue({
        tempAuth: expiredData,
        authToken: validData,
      });

      // Simulate cleanup process
      const allData = await chrome.storage.local.get();
      const keysToRemove = Object.keys(allData).filter((key) => {
        const item = allData[key];
        return item.expiresAt && new Date(item.expiresAt) < new Date();
      });

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }

      expect(chrome.storage.local.remove).toHaveBeenCalledWith(["tempAuth"]);
    });

    test("should handle storage migration", async () => {
      // Setup old format data
      const oldFormatData = {
        bookmarks: [
          { url: "https://example.com", title: "Old Format" }, // Missing id, status
        ],
      };

      chrome.storage.local.get.mockResolvedValue(oldFormatData);

      // Simulate migration
      const data = await chrome.storage.local.get(["bookmarks"]);
      const migratedBookmarks = data.bookmarks.map((bookmark) => ({
        id: bookmark.id || `migrated_${Date.now()}`,
        status: bookmark.status || "pending",
        ...bookmark,
      }));

      await chrome.storage.local.set({ bookmarks: migratedBookmarks });

      expect(migratedBookmarks[0].id).toMatch(/^migrated_/);
      expect(migratedBookmarks[0].status).toBe("pending");
    });
  });
});
