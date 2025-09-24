// Edge cases and error scenarios for backend unit tests

// Invalid inputs
export const invalidUserData = {
  email: "invalid-email",
  password: "123", // too short
  name: "", // empty
};

export const invalidCollectionData = {
  title: "", // empty title
  icon: "🚫", // valid but empty title is the issue
  is_public: "not-a-boolean", // wrong type
};

export const invalidBookmarkData = {
  url: "not-a-url",
  title: "A".repeat(501), // too long (max 500)
  excerpt: null, // should be string or undefined
};

export const invalidHighlightData = {
  text_selected: "", // empty
  color: "invalid-color",
  annotation_md: "Valid annotation",
  position_context: "Valid context",
};

// Large datasets
export const largeBookmarkDataset = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  owner_id: 1,
  collection_id: 1,
  title: `Bookmark ${i + 1}`,
  url: `https://example.com/bookmark-${i + 1}`,
  excerpt: `Excerpt for bookmark ${i + 1}`,
  content_snapshot_path: `/snapshots/bookmark-${i + 1}.html`,
  content_indexed: i % 2 === 0,
  type: "article",
  domain: "example.com",
  cover_url: `https://example.com/cover${i + 1}.jpg`,
  is_duplicate: false,
  is_broken: i % 10 === 0, // every 10th is broken
  created_at: new Date(
    `2023-01-${String((i % 28) + 1).padStart(2, "0")}T12:00:00Z`
  ),
  updated_at: new Date(
    `2023-01-${String((i % 28) + 1).padStart(2, "0")}T12:00:00Z`
  ),
}));

export const largeTagDataset = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  owner_id: 1,
  name: `Tag${i + 1}`,
  normalized_name: `tag${i + 1}`,
}));

// Error scenarios
export const mockDatabaseErrors = {
  connectionError: new Error("Database connection failed"),
  queryError: new Error("SQL query execution failed"),
  constraintViolation: new Error("UNIQUE constraint violated"),
  foreignKeyViolation: new Error("FOREIGN KEY constraint violated"),
};

export const mockRedisErrors = {
  connectionError: new Error("Redis connection failed"),
  setError: new Error("Redis SET operation failed"),
  getError: new Error("Redis GET operation failed"),
};

export const mockMeiliSearchErrors = {
  connectionError: new Error("MeiliSearch connection failed"),
  indexError: new Error("Failed to index document"),
  searchError: new Error("Search query failed"),
};

export const mockApiErrors = {
  unauthorized: { error: "unauthorized", message: "Authentication required" },
  forbidden: { error: "forbidden", message: "Access denied" },
  notFound: { error: "not_found", message: "Resource not found" },
  validationError: { error: "validation_error", message: "Invalid input data" },
  serverError: { error: "server_error", message: "Internal server error" },
  rateLimitError: { error: "rate_limit", message: "Too many requests" },
};

// Boundary conditions
export const boundaryTestData = {
  emptyCollection: {
    id: 999,
    owner_id: 1,
    title: "Empty Collection",
    icon: null,
    is_public: false,
    share_slug: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
  bookmarkWithoutCollection: {
    id: 999,
    owner_id: 1,
    collection_id: null,
    title: "Orphaned Bookmark",
    url: "https://example.com/orphaned",
    excerpt: "A bookmark not in any collection",
    content_snapshot_path: null,
    content_indexed: false,
    type: null,
    domain: "example.com",
    cover_url: null,
    is_duplicate: false,
    is_broken: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  highlightWithoutAnnotation: {
    id: 999,
    bookmark_id: 1,
    owner_id: 1,
    text_selected: "Selected text without annotation",
    color: "#000000",
    annotation_md: null,
    position_context: "Some position",
    snapshot_id: null,
    created_at: new Date(),
  },
};

// Malformed data
export const malformedData = {
  userWithNullEmail: { ...invalidUserData, email: null },
  collectionWithUndefinedTitle: {
    title: undefined,
    icon: "📁",
    is_public: false,
  },
  bookmarkWithInvalidUrl: {
    url: 'javascript:alert("xss")',
    title: "Hacked",
    excerpt: "Bad",
  },
  tagWithSpecialChars: { name: "Tag@#$%", normalized_name: "tag@#$%" },
};
