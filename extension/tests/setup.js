// Setup for extension tests

// Add missing Node.js globals that jsdom needs BEFORE requiring jsdom
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require("jsdom");
const { mockChromeApis } = require("../../tests/fixtures/extension/mocks.js");

// Set up JSDOM
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "https://example.com",
  pretendToBeVisual: true,
  resources: "usable",
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mark document as ready
Object.defineProperty(document, 'readyState', {
  value: 'complete',
  writable: false,
});

// Dispatch DOMContentLoaded immediately since DOM is ready
const domContentLoadedEvent = new Event('DOMContentLoaded');
document.dispatchEvent(domContentLoadedEvent);

// Mock Chrome APIs globally with Jest mocks
const messageListeners = [];
const mockChromeRuntime = {
  sendMessage: jest.fn(mockChromeApis.runtime.sendMessage),
  onMessage: {
    addListener: jest.fn((listener) => {
      messageListeners.push(listener);
    }),
    removeListener: jest.fn((listener) => {
      const index = messageListeners.indexOf(listener);
      if (index > -1) {
        messageListeners.splice(index, 1);
      }
    }),
    hasListeners: jest.fn(() => messageListeners.length > 0),
  },
  lastError: null,
};

global.chrome = {
  tabs: {
    query: jest.fn(mockChromeApis.tabs.query),
    sendMessage: jest.fn(mockChromeApis.tabs.sendMessage),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
  runtime: mockChromeRuntime,
  storage: {
    local: {
      get: jest.fn(mockChromeApis.storage.local.get),
      set: jest.fn(mockChromeApis.storage.local.set),
      remove: jest.fn(mockChromeApis.storage.local.remove),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  identity: {
    launchWebAuthFlow: jest.fn(mockChromeApis.identity.launchWebAuthFlow),
    getAuthToken: jest.fn(),
    removeCachedAuthToken: jest.fn(),
  },
  permissions: {
    contains: jest.fn(),
    request: jest.fn(),
    remove: jest.fn(),
  },
  contextMenus: {
    create: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
  },
};

// Mock fetch for network requests
global.fetch = jest.fn(() => Promise.resolve(new Response()));

// Mock Selection and Range APIs for content script tests
const mockRange = {
  surroundContents: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    left: 100,
    top: 150,
    width: 200,
    height: 20,
  })),
  cloneContents: jest.fn(),
  extractContents: jest.fn(),
  insertNode: jest.fn(),
  selectNode: jest.fn(),
  selectNodeContents: jest.fn(),
  setStart: jest.fn(),
  setEnd: jest.fn(),
  setStartBefore: jest.fn(),
  setEndAfter: jest.fn(),
  collapse: jest.fn(),
  cloneRange: jest.fn(),
  detach: jest.fn(),
  compareBoundaryPoints: jest.fn(),
  deleteContents: jest.fn(),
  toString: jest.fn(() => "Selected text"),
};

const mockSelection = {
  rangeCount: 1,
  getRangeAt: jest.fn(() => mockRange),
  addRange: jest.fn(),
  removeAllRanges: jest.fn(),
  removeRange: jest.fn(),
  toString: jest.fn(() => "Selected text"),
  isCollapsed: false,
  anchorNode: document.createTextNode("Selected text"),
  anchorOffset: 0,
  focusNode: document.createTextNode("Selected text"),
  focusOffset: 12,
  type: "Range",
};

global.window.getSelection = jest.fn(() => mockSelection);

// Helper function to trigger message listeners (for testing)
global.triggerChromeMessage = (
  message,
  sender = {},
  sendResponse = jest.fn()
) => {
  messageListeners.forEach((listener) => {
    listener(message, sender, sendResponse);
  });
};

// Mock URL constructor for content script
global.URL = dom.window.URL;

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
