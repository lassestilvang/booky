import type {
  Bookmark,
  Collection,
  User,
  ApiResponse,
  PaginatedResponse,
} from "../../../frontend/src/types/api";

// Valid data mocks
export const mockBookmarks: Bookmark[] = [
  {
    id: "1",
    title: "Understanding React Hooks",
    url: "https://example.com/react-hooks",
    description:
      "A comprehensive guide to React Hooks and their usage patterns.",
    tags: ["react", "javascript"],
    collectionId: "1",
    createdAt: "2023-01-25T12:00:00Z",
    updatedAt: "2023-01-25T12:00:00Z",
  },
  {
    id: "2",
    title: "TypeScript Best Practices",
    url: "https://example.com/typescript-best-practices",
    description: "Essential TypeScript patterns for scalable applications.",
    tags: ["typescript", "javascript"],
    collectionId: "1",
    createdAt: "2023-02-10T14:30:00Z",
    updatedAt: "2023-02-10T14:30:00Z",
  },
];

export const mockCollections: Collection[] = [
  {
    id: "1",
    name: "Tech Articles",
    description: "Collection of technology articles and tutorials",
    createdAt: "2023-01-20T11:00:00Z",
    updatedAt: "2023-01-20T11:00:00Z",
  },
  {
    id: "2",
    name: "Recipes",
    description: "Favorite recipes and cooking tips",
    createdAt: "2023-03-15T08:45:00Z",
    updatedAt: "2023-03-15T08:45:00Z",
  },
];

export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    createdAt: "2023-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    createdAt: "2023-02-20T14:45:00Z",
  },
];

// API response mocks
export const mockApiResponses = {
  bookmarksSuccess: {
    data: mockBookmarks,
    message: "Bookmarks retrieved successfully",
  } as ApiResponse<Bookmark[]>,

  collectionsSuccess: {
    data: mockCollections,
    message: "Collections retrieved successfully",
  } as ApiResponse<Collection[]>,

  userSuccess: {
    data: mockUsers[0],
    message: "User profile retrieved successfully",
  } as ApiResponse<User>,

  bookmarksPaginated: {
    data: mockBookmarks,
    total: 25,
    page: 1,
    limit: 10,
  } as PaginatedResponse<Bookmark>,
};

// Edge cases
export const mockEdgeCases = {
  emptyBookmarks: [] as Bookmark[],
  emptyCollections: [] as Collection[],
  bookmarkWithoutTags: {
    ...mockBookmarks[0],
    tags: undefined,
  } as Bookmark,
  collectionWithoutDescription: {
    ...mockCollections[0],
    description: undefined,
  } as Collection,
  largeBookmarkList: Array.from({ length: 100 }, (_, i) => ({
    id: `${i + 1}`,
    title: `Bookmark ${i + 1}`,
    url: `https://example.com/bookmark-${i + 1}`,
    description: `Description for bookmark ${i + 1}`,
    tags: ["tag1", "tag2"],
    collectionId: "1",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  })) as Bookmark[],
};

// Error scenarios
export const mockErrors = {
  notFound: {
    error: "Resource not found",
    message: "The requested resource could not be found",
  },
  unauthorized: {
    error: "Unauthorized",
    message: "Authentication required",
  },
  validation: {
    error: "Validation error",
    message: "Invalid input data provided",
  },
  network: {
    error: "Network error",
    message: "Failed to connect to the server",
  },
};
