// Mock functions for database queries, Redis operations, MeiliSearch, and API calls

// Database query mocks
export const mockDbQueries = {
  findUserByEmail: (email: string) => {
    const users = [
      {
        id: 1,
        email: "john.doe@example.com",
        password_hash: "$2b$10$hashedpassword1",
        name: "John Doe",
      },
      {
        id: 2,
        email: "jane.smith@example.com",
        password_hash: "$2b$10$hashedpassword2",
        name: "Jane Smith",
      },
    ];
    return Promise.resolve(users.find((user) => user.email === email));
  },

  findUserById: (id: number) => {
    const users = [
      { id: 1, email: "john.doe@example.com", name: "John Doe" },
      { id: 2, email: "jane.smith@example.com", name: "Jane Smith" },
    ];
    return Promise.resolve(users.find((user) => user.id === id));
  },

  createUser: (userData: any) => {
    return Promise.resolve({
      id: 3,
      ...userData,
      created_at: new Date(),
    });
  },

  findCollectionsByOwner: (ownerId: number) => {
    const collections = [
      { id: 1, owner_id: 1, title: "Tech Articles", is_public: false },
      { id: 2, owner_id: 1, title: "Design Inspiration", is_public: true },
    ];
    return Promise.resolve(
      collections.filter((col) => col.owner_id === ownerId)
    );
  },

  createCollection: (collectionData: any) => {
    return Promise.resolve({
      id: 3,
      ...collectionData,
      created_at: new Date(),
      updated_at: new Date(),
    });
  },

  findBookmarksByCollection: (collectionId: number) => {
    const bookmarks = [
      {
        id: 1,
        collection_id: 1,
        title: "React Hooks",
        url: "https://example.com/react-hooks",
      },
      {
        id: 2,
        collection_id: 1,
        title: "TypeScript Guide",
        url: "https://example.com/typescript",
      },
    ];
    return Promise.resolve(
      bookmarks.filter((b) => b.collection_id === collectionId)
    );
  },

  createBookmark: (bookmarkData: any) => {
    return Promise.resolve({
      id: 3,
      ...bookmarkData,
      created_at: new Date(),
      updated_at: new Date(),
    });
  },

  findHighlightsByBookmark: (bookmarkId: number) => {
    const highlights = [
      {
        id: 1,
        bookmark_id: 1,
        text_selected: "Important text",
        color: "#FFFF00",
      },
    ];
    return Promise.resolve(
      highlights.filter((h) => h.bookmark_id === bookmarkId)
    );
  },

  createHighlight: (highlightData: any) => {
    return Promise.resolve({
      id: 2,
      ...highlightData,
      created_at: new Date(),
    });
  },

  searchBookmarks: (query: string, filters: any) => {
    const results = [
      {
        id: 1,
        title: "React Hooks",
        excerpt: "Guide to React Hooks",
        tags: ["react", "javascript"],
      },
      {
        id: 2,
        title: "TypeScript Guide",
        excerpt: "TypeScript best practices",
        tags: ["typescript"],
      },
    ];
    return Promise.resolve(
      results.filter(
        (b) =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.excerpt.toLowerCase().includes(query.toLowerCase())
      )
    );
  },
};

// Redis operation mocks
export const mockRedisOps = {
  get: (key: string) => {
    const cache: Record<string, string> = {
      "user:1": JSON.stringify({ id: 1, email: "john.doe@example.com" }),
      "session:abc123": JSON.stringify({
        userId: 1,
        expires: Date.now() + 3600000,
      }),
    };
    return Promise.resolve(cache[key] || null);
  },

  set: (key: string, value: string, options?: any) => {
    return Promise.resolve("OK");
  },

  del: (key: string) => {
    return Promise.resolve(1);
  },

  expire: (key: string, seconds: number) => {
    return Promise.resolve(1);
  },

  incr: (key: string) => {
    return Promise.resolve(1);
  },

  hget: (key: string, field: string) => {
    const hashes: Record<string, Record<string, string>> = {
      "user_stats:1": { bookmarks_count: "42", collections_count: "3" },
    };
    return Promise.resolve(hashes[key]?.[field] || null);
  },

  hset: (key: string, field: string, value: string) => {
    return Promise.resolve(1);
  },
};

// MeiliSearch operation mocks
export const mockMeiliSearchOps = {
  index: (indexName: string) => ({
    addDocuments: () => Promise.resolve({}),
    updateDocuments: () => Promise.resolve({}),
    deleteDocument: () => Promise.resolve({}),
    deleteDocuments: () => Promise.resolve({}),
    search: (query: string, options?: any) => {
      const mockResults = {
        hits: [
          {
            id: 1,
            title: "React Hooks",
            _formatted: { title: "<em>React</em> Hooks" },
          },
          {
            id: 2,
            title: "TypeScript Guide",
            _formatted: { title: "TypeScript Guide" },
          },
        ],
        estimatedTotalHits: 2,
        offset: 0,
        limit: 20,
      };
      return Promise.resolve(mockResults);
    },
  }),

  getIndex: (indexName: string) => ({
    getStats: () =>
      Promise.resolve({
        numberOfDocuments: 150,
        isIndexing: false,
        fieldDistribution: { title: 150, excerpt: 148 },
      }),
  }),
};

// API call mocks
export const mockApiCalls = {
  fetchUserProfile: () =>
    Promise.resolve({
      id: 1,
      email: "john.doe@example.com",
      name: "John Doe",
      plan: "free",
    }),

  createCollection: (data: any) => {
    return Promise.resolve({
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  getCollections: () =>
    Promise.resolve([
      { id: 1, title: "Tech Articles", icon: "📚" },
      { id: 2, title: "Design Inspiration", icon: "🎨" },
    ]),

  createBookmark: (data: any) => {
    return Promise.resolve({
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  getBookmarks: () =>
    Promise.resolve([
      { id: 1, title: "React Hooks", url: "https://example.com/react-hooks" },
      {
        id: 2,
        title: "TypeScript Guide",
        url: "https://example.com/typescript",
      },
    ]),

  searchBookmarks: (query: string) => {
    return Promise.resolve(
      [
        { id: 1, title: "React Hooks", excerpt: "Guide to React Hooks" },
        {
          id: 2,
          title: "TypeScript Guide",
          excerpt: "TypeScript best practices",
        },
      ].filter((b) => b.title.toLowerCase().includes(query.toLowerCase()))
    );
  },

  createHighlight: (data: any) => {
    return Promise.resolve({
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
    });
  },

  getHighlights: () =>
    Promise.resolve([
      { id: 1, text_selected: "Important text", color: "#FFFF00" },
    ]),
};

// Queue operation mocks (for background jobs)
export const mockQueueOps = {
  add: (jobName: string, data: any) => {
    return Promise.resolve({ id: `job_${Date.now()}`, data });
  },

  getWaiting: () => Promise.resolve([]),

  getActive: () => Promise.resolve([]),

  getCompleted: () => Promise.resolve([]),

  getFailed: () => Promise.resolve([]),
};
