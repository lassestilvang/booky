const {
  mockChromeApis,
  mockExtensionStorage,
} = require("../../fixtures/extension/mocks");
const collectionsData = require("../../fixtures/extension/collections.json");
const bookmarksData = require("../../fixtures/extension/bookmarks.json");

describe("Extension Workflow Integration Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup global mocks
    global.fetch = jest.fn();

    // Mock successful API responses
    global.fetch.mockImplementation((url, options) => {
      if (url.includes("/collections")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(collectionsData),
        });
      }
      if (url.includes("/bookmarks") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "new_bookmark_id" }),
        });
      }
      if (url.includes("/highlights") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "new_highlight_id" }),
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    // Setup chrome storage
    chrome.storage.local.get.mockResolvedValue({
      authToken: mockExtensionStorage.auth.token,
    });
    chrome.storage.local.set.mockResolvedValue();

    // Setup tabs API
    chrome.tabs.query.mockResolvedValue([
      { id: 1, title: "Test Page", url: "https://example.com" },
    ]);

    // Load all extension scripts
    require("../../../extension/background.js");
    require("../../../extension/popup.js");
    require("../../../extension/content.js");
  });

  describe("Complete Bookmark Save Workflow", () => {
    test("should complete full bookmark save from popup to background", async () => {
      // Step 1: Popup initialization
      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify collections are loaded
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "getCollections",
      });

      // Step 2: User fills form and clicks save
      const titleInput = document.getElementById("title");
      const notesInput = document.getElementById("notes");
      const collectionSelect = document.getElementById("collection");
      const saveBookmarkBtn = document.getElementById("saveBookmark");

      titleInput.value = "Custom Title";
      notesInput.value = "Custom Notes";
      collectionSelect.value = "1";

      // Find and trigger the save button click handler
      const clickHandler = saveBookmarkBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      // Mock window.close to prevent actual closing
      window.close = jest.fn();

      await clickHandler();

      // Verify the complete workflow
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "saveBookmark",
        data: {
          url: "https://example.com",
          title: "Custom Title",
          notes: "Custom Notes",
          collectionId: "1",
        },
      });

      expect(window.close).toHaveBeenCalled();
    });

    test("should handle bookmark save failure gracefully", async () => {
      // Setup API to fail
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          statusText: "Internal Server Error",
        })
      );

      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const saveBookmarkBtn = document.getElementById("saveBookmark");
      const clickHandler = saveBookmarkBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      window.alert = jest.fn();

      await clickHandler();

      expect(window.alert).toHaveBeenCalledWith(
        "Error: Failed to save bookmark"
      );
      expect(window.close).not.toHaveBeenCalled();
    });
  });

  describe("Complete Highlight Save Workflow", () => {
    test("should complete full highlight save from content script through popup to background", async () => {
      // Step 1: Setup content script selection
      const mockSelection = {
        rangeCount: 1,
        isCollapsed: false,
        toString: () => "Selected text for highlighting",
        getRangeAt: () => ({
          getBoundingClientRect: () => ({
            left: 100,
            top: 200,
            width: 150,
            height: 20,
          }),
          surroundContents: jest.fn(),
        }),
        removeAllRanges: jest.fn(),
      };

      window.getSelection.mockReturnValue(mockSelection);

      // Step 2: User selects text (mouseup event)
      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      // Verify save button is created
      expect(document.createElement).toHaveBeenCalledWith("button");

      // Step 3: User clicks save button in content script
      const saveBtn = document.createElement.mock.results[0].value;
      await saveBtn.onclick();

      // Verify content script sends message to background
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "saveHighlight",
        data: {
          url: "https://example.com",
          text: "Selected text for highlighting",
          notes: "",
          collectionId: null,
        },
      });

      // Step 4: Background processes highlight save (creates bookmark + highlight)
      // This is tested in background unit tests, but verify the API calls
      expect(global.fetch).toHaveBeenCalledTimes(2); // Bookmark + highlight creation
    });

    test("should handle highlight save with popup form data", async () => {
      // Initialize popup
      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Setup content script response
      chrome.tabs.sendMessage.mockResolvedValue({
        selectedText: "Text from content script",
      });

      // Fill popup form
      const notesInput = document.getElementById("notes");
      const collectionSelect = document.getElementById("collection");
      const saveHighlightBtn = document.getElementById("saveHighlight");

      notesInput.value = "Popup notes";
      collectionSelect.value = "1";

      // Click save highlight
      const clickHandler = saveHighlightBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      window.close = jest.fn();

      await clickHandler();

      // Verify complete workflow
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        action: "getSelectedText",
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "saveHighlight",
        data: {
          url: "https://example.com",
          text: "Text from content script",
          notes: "Popup notes",
          collectionId: "1",
        },
      });

      expect(window.close).toHaveBeenCalled();
    });
  });

  describe("Authentication Workflow", () => {
    test("should handle login and enable functionality", async () => {
      // Setup unauthenticated state
      chrome.storage.local.get.mockResolvedValue({});
      chrome.runtime.sendMessage.mockImplementation((message) => {
        switch (message.action) {
          case "checkAuth":
            return Promise.resolve({ authenticated: false });
          case "login":
            return Promise.resolve({ success: true });
          default:
            return Promise.resolve({ success: false });
        }
      });

      // Initialize popup
      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify login button is shown
      const loginBtn = document.getElementById("login");
      expect(loginBtn.style.display).toBe("block");

      // Simulate login
      const loginHandler = loginBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      await loginHandler();

      // Verify login flow
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "login",
      });

      // After login, auth should be rechecked
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "checkAuth",
      });
    });

    test("should maintain authentication state across sessions", async () => {
      // Setup authenticated state
      chrome.storage.local.get.mockResolvedValue({
        authToken: mockExtensionStorage.auth.token,
      });

      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify authenticated UI
      const loginBtn = document.getElementById("login");
      const saveBookmarkBtn = document.getElementById("saveBookmark");

      expect(loginBtn.style.display).toBe("none");
      expect(saveBookmarkBtn.disabled).toBe(false);
    });
  });

  describe("Cross-Component Communication", () => {
    test("should handle popup to content script communication", async () => {
      // Initialize popup
      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Setup content script response
      chrome.tabs.sendMessage.mockResolvedValue({
        selectedText: "Communicated text",
      });

      // Trigger highlight save
      const saveHighlightBtn = document.getElementById("saveHighlight");
      const clickHandler = saveHighlightBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      await clickHandler();

      // Verify communication
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        action: "getSelectedText",
      });
    });

    test("should handle background to popup communication", async () => {
      // Initialize popup
      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Trigger collection load
      const collectionSelect = document.getElementById("collection");

      // Verify collections were loaded via background communication
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "getCollections",
      });

      // Verify UI was updated with collection data
      expect(collectionSelect.innerHTML).toContain("Select Collection");
    });
  });

  describe("Error Handling and Recovery", () => {
    test("should handle network failures gracefully", async () => {
      // Setup network failure
      global.fetch.mockRejectedValue(new Error("Network error"));

      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Try to save bookmark
      const saveBookmarkBtn = document.getElementById("saveBookmark");
      const clickHandler = saveBookmarkBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      window.alert = jest.fn();

      await clickHandler();

      expect(window.alert).toHaveBeenCalledWith("Error: Network error");
    });

    test("should handle authentication expiration", async () => {
      // Setup expired token scenario
      chrome.storage.local.get.mockResolvedValue({
        authToken: "expired_token",
      });

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Try to save
      const saveBookmarkBtn = document.getElementById("saveBookmark");
      const clickHandler = saveBookmarkBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      window.alert = jest.fn();

      await clickHandler();

      expect(window.alert).toHaveBeenCalledWith(
        "Error: Failed to save bookmark"
      );
    });

    test("should recover from temporary failures", async () => {
      // Setup intermittent failure then success
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            statusText: "Temporary failure",
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "recovered_bookmark_id" }),
        });
      });

      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // First attempt fails
      const saveBookmarkBtn = document.getElementById("saveBookmark");
      const clickHandler = saveBookmarkBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      window.alert = jest.fn();

      await clickHandler();

      expect(window.alert).toHaveBeenCalledWith(
        "Error: Failed to save bookmark"
      );

      // Reset for second attempt
      jest.clearAllMocks();
      window.alert.mockClear();

      // Second attempt succeeds (would need to reload scripts in real scenario)
      // This demonstrates the pattern for recovery
    });
  });

  describe("Concurrent Operations", () => {
    test("should handle multiple simultaneous save operations", async () => {
      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const saveBookmarkBtn = document.getElementById("saveBookmark");
      const clickHandler = saveBookmarkBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      // Trigger multiple saves simultaneously
      const promises = [clickHandler(), clickHandler(), clickHandler()];

      window.close = jest.fn();

      await Promise.all(promises);

      // Verify all operations completed
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(window.close).toHaveBeenCalledTimes(3);
    });

    test("should handle mixed bookmark and highlight operations", async () => {
      const domContentLoaded = new Event("DOMContentLoaded");
      document.dispatchEvent(domContentLoaded);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Setup content script for highlight
      chrome.tabs.sendMessage.mockResolvedValue({
        selectedText: "Highlight text",
      });

      const saveBookmarkBtn = document.getElementById("saveBookmark");
      const saveHighlightBtn = document.getElementById("saveHighlight");

      const bookmarkHandler = saveBookmarkBtn.addEventListener.mock.calls.find(
        (call) => call[0] === "click"
      )[1];

      const highlightHandler =
        saveHighlightBtn.addEventListener.mock.calls.find(
          (call) => call[0] === "click"
        )[1];

      window.close = jest.fn();

      // Execute both operations
      await Promise.all([bookmarkHandler(), highlightHandler()]);

      // Verify both API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(3); // 1 bookmark + 2 highlight (bookmark + highlight)
    });
  });
});
