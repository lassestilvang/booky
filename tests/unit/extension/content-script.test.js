const { mockChromeApis } = require("../../fixtures/extension/mocks");

describe("Content Script Tests", () => {
  let mockSelection, mockRange, mockRect;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup selection mocks
    mockRect = {
      left: 100,
      top: 200,
      width: 150,
      height: 20,
    };

    mockRange = {
      getBoundingClientRect: jest.fn().mockReturnValue(mockRect),
      surroundContents: jest.fn(),
    };

    mockSelection = {
      rangeCount: 1,
      isCollapsed: false,
      toString: jest.fn().mockReturnValue("Selected text content"),
      getRangeAt: jest.fn().mockReturnValue(mockRange),
      removeAllRanges: jest.fn(),
    };

    // Mock window.getSelection
    window.getSelection.mockReturnValue(mockSelection);

    // Mock document methods
    document.getElementById = jest.fn();
    document.createElement = jest.fn();
    document.body.appendChild = jest.fn();

    // Mock chrome APIs
    chrome.runtime.sendMessage = jest.fn().mockResolvedValue({ success: true });

    // Load the content script
    require("../../../extension/content.js");
  });

  describe("Message Listener", () => {
    test("should respond to getSelectedText action", () => {
      const mockSendResponse = jest.fn();

      // Simulate message from popup
      triggerChromeMessage({ action: "getSelectedText" }, {}, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        selectedText: "Selected text content",
      });
    });

    test("should return true for async response", () => {
      const result = triggerChromeMessage(
        { action: "getSelectedText" },
        {},
        jest.fn()
      );

      expect(result).toBe(true);
    });
  });

  describe("Text Selection Detection", () => {
    let mockSaveBtn;

    beforeEach(() => {
      mockSaveBtn = {
        id: "booky-save-highlight",
        textContent: "",
        style: {
          position: "",
          zIndex: "",
          background: "",
          border: "",
          left: "",
          top: "",
          display: "",
        },
        onclick: null,
      };

      document.getElementById.mockReturnValue(null); // No existing button
      document.createElement.mockReturnValue(mockSaveBtn);
    });

    test("should create save button on text selection", () => {
      // Simulate mouseup event with text selected
      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      expect(document.createElement).toHaveBeenCalledWith("button");
      expect(mockSaveBtn.id).toBe("booky-save-highlight");
      expect(mockSaveBtn.textContent).toBe("Save Highlight");
      expect(mockSaveBtn.style.position).toBe("absolute");
      expect(mockSaveBtn.style.zIndex).toBe("10000");
      expect(document.body.appendChild).toHaveBeenCalledWith(mockSaveBtn);
    });

    test("should position save button correctly", () => {
      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      expect(mockSaveBtn.style.left).toBe("100px"); // rect.left + window.scrollX
      expect(mockSaveBtn.style.top).toBe("180px"); // rect.top + window.scrollY - 30
      expect(mockSaveBtn.style.display).toBe("block");
    });

    test("should reuse existing save button", () => {
      document.getElementById.mockReturnValue(mockSaveBtn);

      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      expect(document.createElement).not.toHaveBeenCalled();
      expect(document.body.appendChild).not.toHaveBeenCalled();
    });

    test("should hide save button when no text selected", () => {
      mockSelection.isCollapsed = true;
      document.getElementById.mockReturnValue(mockSaveBtn);

      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      expect(mockSaveBtn.style.display).toBe("none");
    });

    test("should handle selection with rangeCount = 0", () => {
      mockSelection.rangeCount = 0;
      document.getElementById.mockReturnValue(mockSaveBtn);

      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      expect(mockSaveBtn.style.display).toBe("none");
    });
  });

  describe("Highlight Saving", () => {
    let mockSaveBtn;

    beforeEach(() => {
      mockSaveBtn = {
        id: "booky-save-highlight",
        style: { display: "block" },
        onclick: null,
      };

      document.getElementById.mockReturnValue(null);
      document.createElement.mockReturnValue(mockSaveBtn);

      // Trigger button creation
      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);
    });

    test("should send save highlight message on button click", async () => {
      // Trigger the onclick handler
      await mockSaveBtn.onclick();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: "saveHighlight",
        data: {
          url: "https://example.com",
          text: "Selected text content",
          notes: "",
          collectionId: null,
        },
      });
    });

    test("should highlight text on successful save", async () => {
      await mockSaveBtn.onclick();

      expect(mockRange.surroundContents).toHaveBeenCalled();
      const spanElement = mockRange.surroundContents.mock.calls[0][0];
      expect(spanElement.style.backgroundColor).toBe("yellow");
    });

    test("should hide save button after successful save", async () => {
      await mockSaveBtn.onclick();

      expect(mockSaveBtn.style.display).toBe("none");
    });

    test("should remove selection ranges after save", async () => {
      await mockSaveBtn.onclick();

      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
    });

    test("should show alert on save failure", async () => {
      chrome.runtime.sendMessage.mockResolvedValue({
        success: false,
        error: "Save failed",
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await mockSaveBtn.onclick();

      expect(window.alert).toHaveBeenCalledWith("Failed to save highlight");
      expect(mockRange.surroundContents).not.toHaveBeenCalled();
      expect(mockSaveBtn.style.display).not.toBe("none");

      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty selection text", () => {
      mockSelection.toString.mockReturnValue("");

      const mockSendResponse = jest.fn();
      triggerChromeMessage({ action: "getSelectedText" }, {}, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        selectedText: "",
      });
    });

    test("should handle null selection", () => {
      window.getSelection.mockReturnValue(null);

      const mockSendResponse = jest.fn();
      triggerChromeMessage({ action: "getSelectedText" }, {}, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        selectedText: undefined,
      });
    });

    test("should handle selection.getRangeAt exception", () => {
      mockSelection.getRangeAt.mockImplementation(() => {
        throw new Error("Range error");
      });

      // Should not crash
      expect(() => {
        const mouseupEvent = new MouseEvent("mouseup");
        document.dispatchEvent(mouseupEvent);
      }).not.toThrow();
    });

    test("should handle getBoundingClientRect returning null", () => {
      mockRange.getBoundingClientRect.mockReturnValue(null);

      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      // Should still create button but positioning might fail
      expect(document.createElement).toHaveBeenCalledWith("button");
    });
  });

  describe("DOM Manipulation", () => {
    test("should create span element for highlighting", async () => {
      const mockSpan = {
        style: {},
      };
      document.createElement.mockReturnValueOnce(mockSpan);

      let mockSaveBtn = {
        id: "booky-save-highlight",
        style: { display: "block" },
        onclick: null,
      };

      document.getElementById.mockReturnValue(null);
      document.createElement.mockReturnValueOnce(mockSaveBtn);

      const mouseupEvent = new MouseEvent("mouseup");
      document.dispatchEvent(mouseupEvent);

      await mockSaveBtn.onclick();

      expect(document.createElement).toHaveBeenCalledWith("span");
      expect(mockSpan.style.backgroundColor).toBe("yellow");
      expect(mockRange.surroundContents).toHaveBeenCalledWith(mockSpan);
    });

    test("should handle document.body being null", () => {
      document.body = null;

      // Should not crash
      expect(() => {
        const mouseupEvent = new MouseEvent("mouseup");
        document.dispatchEvent(mouseupEvent);
      }).not.toThrow();
    });
  });
});
