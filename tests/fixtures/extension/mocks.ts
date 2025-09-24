// Extension-specific mock data and functions

// Local storage data mocks
export const mockExtensionStorage = {
  bookmarks: [
    {
      id: "local_1",
      url: "https://example.com/react-hooks",
      title: "Understanding React Hooks",
      notes: "Great article about React Hooks",
      collectionId: "1",
      status: "pending",
      createdAt: "2023-01-25T12:00:00Z",
    },
    {
      id: "local_2",
      url: "https://example.com/typescript-guide",
      title: "TypeScript Best Practices",
      notes: "Useful TypeScript tips",
      collectionId: "1",
      status: "synced",
      createdAt: "2023-02-10T14:30:00Z",
    },
  ],
  highlights: [
    {
      id: "local_highlight_1",
      url: "https://example.com/react-hooks",
      text: 'Hooks are functions that let you "hook into" React state and lifecycle features from function components.',
      notes: "Key definition of React Hooks",
      collectionId: "1",
      status: "pending",
      createdAt: "2023-01-25T12:15:00Z",
    },
  ],
  collections: [
    {
      id: "1",
      title: "Tech Articles",
      description: "Technology articles and tutorials",
      lastSynced: "2023-01-25T12:00:00Z",
    },
  ],
  auth: {
    authenticated: true,
    user: {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    token: "extension_jwt_token_123",
    lastSync: "2023-01-25T12:00:00Z",
  },
};

// Chrome API mocks
export const mockChromeApis = {
  tabs: {
    query: (queryInfo: any) =>
      Promise.resolve([
        {
          id: 1,
          title: "Example Page",
          url: "https://example.com/page",
          active: true,
          currentWindow: true,
        },
      ]),
    sendMessage: (tabId: number, message: any) => {
      if (message.action === "getSelectedText") {
        return Promise.resolve({ selectedText: "Selected text from page" });
      }
      return Promise.resolve({});
    },
  },

  runtime: {
    sendMessage: (message: any) => {
      switch (message.action) {
        case "saveBookmark":
          return Promise.resolve({ success: true });
        case "saveHighlight":
          return Promise.resolve({ success: true });
        case "getCollections":
          return Promise.resolve({
            success: true,
            collections: mockExtensionStorage.collections,
          });
        case "checkAuth":
          return Promise.resolve({
            authenticated: mockExtensionStorage.auth.authenticated,
          });
        case "login":
          return Promise.resolve({ success: true });
        default:
          return Promise.resolve({ success: false, error: "Unknown action" });
      }
    },
  },

  storage: {
    local: {
      get: (keys: string[]) => {
        const result: any = {};
        keys.forEach((key) => {
          result[key] = (mockExtensionStorage as any)[key];
        });
        return Promise.resolve(result);
      },
      set: (items: any) => Promise.resolve(),
      remove: (keys: string[]) => Promise.resolve(),
    },
  },

  identity: {
    launchWebAuthFlow: (options: any) =>
      Promise.resolve("https://booky.com/auth/callback?code=auth_code"),
  },
};

// Extension-specific edge cases
export const mockExtensionEdgeCases = {
  offlineBookmarks: [
    {
      ...mockExtensionStorage.bookmarks[0],
      status: "failed",
      error: "Network error",
    },
  ],
  largePendingQueue: Array.from({ length: 50 }, (_, i) => ({
    id: `pending_${i}`,
    url: `https://example.com/page${i}`,
    title: `Page ${i}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  })),
  corruptedStorage: {
    bookmarks: null,
    auth: { authenticated: true, token: null },
  },
  expiredToken: {
    ...mockExtensionStorage.auth,
    token: "expired_token",
  },
};

// Network failure scenarios
export const mockNetworkFailures = {
  saveBookmarkFailure: {
    success: false,
    error: "Failed to save bookmark: Network error",
  },
  syncFailure: {
    success: false,
    error: "Sync failed: Server unavailable",
  },
  authFailure: {
    success: false,
    error: "Authentication failed: Invalid token",
  },
};
