import { useBookmarksStore } from "@/stores/bookmarks";
import apiClient from "@/api/client";
import {
  mockBookmarks,
  mockApiResponses,
} from "../../../tests/fixtures/frontend/mocks";

// Mock the API client
jest.mock("@/api/client");

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("useBookmarksStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    useBookmarksStore.setState({
      bookmarks: [],
      loading: false,
      error: null,
      page: 1,
      limit: 20,
      total: 0,
      searchQuery: "",
      viewMode: "grid",
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = useBookmarksStore.getState();

      expect(state.bookmarks).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.page).toBe(1);
      expect(state.limit).toBe(20);
      expect(state.total).toBe(0);
      expect(state.searchQuery).toBe("");
      expect(state.viewMode).toBe("grid");
    });
  });

  describe("fetchBookmarks", () => {
    it("fetches bookmarks successfully", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: mockApiResponses.bookmarksPaginated,
      });

      const { fetchBookmarks } = useBookmarksStore.getState();
      await fetchBookmarks("react", 1);

      const state = useBookmarksStore.getState();
      expect(state.bookmarks).toEqual(mockBookmarks);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.page).toBe(1);
      expect(state.searchQuery).toBe("react");
      expect(state.total).toBe(25);
    });

    it("appends bookmarks on pagination", async () => {
      const initialBookmarks = [mockBookmarks[0]];
      useBookmarksStore.setState({ bookmarks: initialBookmarks, page: 1 });

      mockApiClient.get.mockResolvedValueOnce({
        data: {
          ...mockApiResponses.bookmarksPaginated,
          data: [mockBookmarks[1]],
        },
      });

      const { fetchBookmarks } = useBookmarksStore.getState();
      await fetchBookmarks("", 2);

      const state = useBookmarksStore.getState();
      expect(state.bookmarks).toEqual(mockBookmarks);
      expect(state.page).toBe(2);
    });

    it("handles API errors", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const { fetchBookmarks } = useBookmarksStore.getState();
      await fetchBookmarks();

      const state = useBookmarksStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Failed to fetch bookmarks");
    });

    it("sets loading state correctly", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: mockApiResponses.bookmarksPaginated,
      });

      const { fetchBookmarks } = useBookmarksStore.getState();
      const promise = fetchBookmarks();

      expect(useBookmarksStore.getState().loading).toBe(true);

      await promise;
      expect(useBookmarksStore.getState().loading).toBe(false);
    });

    it("calls API with correct parameters", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: mockApiResponses.bookmarksPaginated,
      });

      const { fetchBookmarks } = useBookmarksStore.getState();
      await fetchBookmarks("test query", 2);

      expect(mockApiClient.get).toHaveBeenCalledWith("/bookmarks", {
        params: { q: "test query", page: 2, limit: 20 },
      });
    });
  });

  describe("setViewMode", () => {
    it("updates view mode", () => {
      const { setViewMode } = useBookmarksStore.getState();
      setViewMode("list");

      const state = useBookmarksStore.getState();
      expect(state.viewMode).toBe("list");
    });
  });

  describe("setSearchQuery", () => {
    it("updates search query", () => {
      const { setSearchQuery } = useBookmarksStore.getState();
      setSearchQuery("new query");

      const state = useBookmarksStore.getState();
      expect(state.searchQuery).toBe("new query");
    });
  });

  describe("addBookmark", () => {
    it("adds a bookmark to the list", () => {
      const { addBookmark } = useBookmarksStore.getState();
      addBookmark(mockBookmarks[0]);

      const state = useBookmarksStore.getState();
      expect(state.bookmarks).toEqual([mockBookmarks[0]]);
    });
  });

  describe("removeBookmark", () => {
    it("removes a bookmark by id", () => {
      useBookmarksStore.setState({ bookmarks: mockBookmarks });

      const { removeBookmark } = useBookmarksStore.getState();
      removeBookmark("1");

      const state = useBookmarksStore.getState();
      expect(state.bookmarks).toHaveLength(1);
      expect(state.bookmarks[0].id).toBe("2");
    });
  });

  describe("edge cases", () => {
    it("handles empty response", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { data: [], total: 0, page: 1, limit: 20 },
      });

      const { fetchBookmarks } = useBookmarksStore.getState();
      await fetchBookmarks();

      const state = useBookmarksStore.getState();
      expect(state.bookmarks).toEqual([]);
      expect(state.total).toBe(0);
    });

    it("handles network errors", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("Connection failed"));

      const { fetchBookmarks } = useBookmarksStore.getState();
      await fetchBookmarks();

      const state = useBookmarksStore.getState();
      expect(state.error).toBe("Failed to fetch bookmarks");
      expect(state.loading).toBe(false);
    });

    it("resets error on successful fetch", async () => {
      useBookmarksStore.setState({ error: "Previous error" });

      mockApiClient.get.mockResolvedValueOnce({
        data: mockApiResponses.bookmarksPaginated,
      });

      const { fetchBookmarks } = useBookmarksStore.getState();
      await fetchBookmarks();

      const state = useBookmarksStore.getState();
      expect(state.error).toBeNull();
    });
  });
});
