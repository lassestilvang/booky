// Valid data mocks for backend unit tests
export const mockUsers = [
  {
    id: 1,
    email: "john.doe@example.com",
    password_hash: "$2b$10$hashedpassword1",
    name: "John Doe",
    created_at: new Date("2023-01-15T10:30:00Z"),
    plan: "free" as const,
  },
  {
    id: 2,
    email: "jane.smith@example.com",
    password_hash: "$2b$10$hashedpassword2",
    name: "Jane Smith",
    created_at: new Date("2023-02-20T14:45:00Z"),
    plan: "premium" as const,
  },
];

export const mockCollections = [
  {
    id: 1,
    owner_id: 1,
    title: "Tech Articles",
    icon: "📚",
    is_public: false,
    share_slug: "tech-articles-abc123",
    created_at: new Date("2023-01-20T11:00:00Z"),
    updated_at: new Date("2023-01-20T11:00:00Z"),
  },
  {
    id: 2,
    owner_id: 1,
    title: "Design Inspiration",
    icon: "🎨",
    is_public: true,
    share_slug: "design-inspo-def456",
    created_at: new Date("2023-02-01T16:30:00Z"),
    updated_at: new Date("2023-02-05T10:15:00Z"),
  },
];

export const mockBookmarks = [
  {
    id: 1,
    owner_id: 1,
    collection_id: 1,
    title: "Understanding React Hooks",
    url: "https://example.com/react-hooks",
    excerpt: "A comprehensive guide to React Hooks and their usage patterns.",
    content_snapshot_path: "/snapshots/react-hooks.html",
    content_indexed: true,
    type: "article",
    domain: "example.com",
    cover_url: "https://example.com/cover1.jpg",
    is_duplicate: false,
    is_broken: false,
    created_at: new Date("2023-01-25T12:00:00Z"),
    updated_at: new Date("2023-01-25T12:00:00Z"),
  },
  {
    id: 2,
    owner_id: 1,
    collection_id: 1,
    title: "TypeScript Best Practices",
    url: "https://example.com/typescript-best-practices",
    excerpt: "Essential TypeScript patterns for scalable applications.",
    content_snapshot_path: "/snapshots/typescript.html",
    content_indexed: true,
    type: "article",
    domain: "example.com",
    cover_url: "https://example.com/cover2.jpg",
    is_duplicate: false,
    is_broken: false,
    created_at: new Date("2023-02-10T14:30:00Z"),
    updated_at: new Date("2023-02-10T14:30:00Z"),
  },
];

export const mockTags = [
  {
    id: 1,
    owner_id: 1,
    name: "React",
    normalized_name: "react",
  },
  {
    id: 2,
    owner_id: 1,
    name: "JavaScript",
    normalized_name: "javascript",
  },
];

export const mockHighlights = [
  {
    id: 1,
    bookmark_id: 1,
    owner_id: 1,
    text_selected:
      'Hooks are functions that let you "hook into" React state and lifecycle features from function components.',
    color: "#FFFF00",
    annotation_md: "This is the key definition of React Hooks.",
    position_context: "Paragraph 2, line 5",
    snapshot_id: null,
    created_at: new Date("2023-01-26T10:15:00Z"),
  },
];

export const mockPermissions = [
  {
    id: 1,
    collection_id: 2,
    user_id: 3,
    role: "viewer" as const,
  },
  {
    id: 2,
    collection_id: 2,
    user_id: 1,
    role: "editor" as const,
  },
];

export const mockSearchResults = [
  {
    ...mockBookmarks[0],
    tags: [mockTags[0], mockTags[1]],
  },
  {
    ...mockBookmarks[1],
    tags: [mockTags[1]],
  },
];

// API request/response mocks
export const mockAuthRequest = {
  email: "john.doe@example.com",
  password: "password123",
};

export const mockAuthResponse = {
  user: mockUsers[0],
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

export const mockCollectionCreateRequest = {
  title: "New Collection",
  icon: "📁",
  is_public: false,
};

export const mockBookmarkCreateRequest = {
  url: "https://example.com/new-article",
  title: "New Article",
  excerpt: "An interesting new article",
  collection_id: 1,
};

export const mockHighlightCreateRequest = {
  text_selected: "This is an important point",
  color: "#FFFF00",
  annotation_md: "Key insight here",
  position_context: "Paragraph 5",
};
