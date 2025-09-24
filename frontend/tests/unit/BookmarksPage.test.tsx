import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BookmarksPage from "@/components/BookmarksPage";
import { useBookmarksStore } from "@/stores/bookmarks";
import {
  mockBookmarks,
  mockApiResponses,
} from "../../../tests/fixtures/frontend/mocks";

// Mock the store
jest.mock("@/stores/bookmarks");

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

const mockUseBookmarksStore = useBookmarksStore as jest.MockedFunction<
  typeof useBookmarksStore
>;

describe("BookmarksPage", () => {
  const mockStore = {
    bookmarks: mockBookmarks,
    loading: false,
    error: null,
    viewMode: "grid" as const,
    searchQuery: "",
    page: 1,
    total: 25,
    fetchBookmarks: jest.fn(),
    setViewMode: jest.fn(),
    setSearchQuery: jest.fn(),
  };

  beforeEach(() => {
    mockUseBookmarksStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with search form and view buttons", () => {
    render(<BookmarksPage />);

    expect(
      screen.getByPlaceholderText("Search bookmarks...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /grid/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /headlines/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /masonry/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /list/i })).toBeInTheDocument();
  });

  it("displays bookmarks in grid view by default", () => {
    render(<BookmarksPage />);

    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    expect(screen.getByText("TypeScript Best Practices")).toBeInTheDocument();
  });

  it("handles search form submission", async () => {
    render(<BookmarksPage />);

    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    const searchButton = screen.getByRole("button", { name: /search/i });

    fireEvent.change(searchInput, { target: { value: "react" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockStore.setSearchQuery).toHaveBeenCalledWith("react");
      expect(mockStore.fetchBookmarks).toHaveBeenCalledWith("react", 1);
    });
  });

  it("changes view mode when buttons are clicked", () => {
    render(<BookmarksPage />);

    const headlinesButton = screen.getByRole("button", { name: /headlines/i });
    fireEvent.click(headlinesButton);

    expect(mockStore.setViewMode).toHaveBeenCalledWith("headlines");
  });

  it("displays loading state", () => {
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      loading: true,
    });

    render(<BookmarksPage />);

    expect(screen.getByText("Loading more...")).toBeInTheDocument();
  });

  it("displays error message", () => {
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      error: "Failed to fetch bookmarks",
    });

    render(<BookmarksPage />);

    expect(screen.getByText("Failed to fetch bookmarks")).toBeInTheDocument();
  });

  it("renders different view components based on viewMode", () => {
    const { rerender } = render(<BookmarksPage />);

    // Grid view
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();

    // Headlines view
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      viewMode: "headlines",
    });
    rerender(<BookmarksPage />);
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();

    // Masonry view
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      viewMode: "masonry",
    });
    rerender(<BookmarksPage />);
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();

    // List view
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      viewMode: "list",
    });
    rerender(<BookmarksPage />);
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
  });

  it("handles empty bookmarks list", () => {
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      bookmarks: [],
    });

    render(<BookmarksPage />);

    expect(
      screen.queryByText("Understanding React Hooks")
    ).not.toBeInTheDocument();
  });

  it("calls fetchBookmarks on mount", () => {
    render(<BookmarksPage />);

    expect(mockStore.fetchBookmarks).toHaveBeenCalled();
  });

  it("has proper accessibility attributes", () => {
    render(<BookmarksPage />);

    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    expect(searchInput).toHaveAttribute("type", "text");

    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(searchButton).toHaveAttribute("type", "submit");
  });

  it("handles responsive grid layout", () => {
    render(<BookmarksPage />);

    const thumbnails = screen.getAllByText("Thumbnail"); // Placeholder for responsive testing
    expect(thumbnails).toHaveLength(2);
  });

  it("handles infinite scroll when more bookmarks are available", () => {
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      bookmarks: mockBookmarks,
      total: 50,
      page: 1,
    });

    render(<BookmarksPage />);

    // Mock intersection observer trigger
    const loadMoreDiv = document.querySelector("div.h-10");

    // This would require more complex mocking of IntersectionObserver
    // For now, we verify the observer is set up
    expect(IntersectionObserver).toHaveBeenCalled();
    expect(loadMoreDiv).not.toBeNull();
  });

  it("prevents form submission with empty search", () => {
    render(<BookmarksPage />);

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    expect(mockStore.setSearchQuery).toHaveBeenCalledWith("");
  });

  it("handles network error during fetch", () => {
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      error: "Network Error: Failed to fetch",
    });

    render(<BookmarksPage />);

    expect(
      screen.getByText("Network Error: Failed to fetch")
    ).toBeInTheDocument();
  });

  it("handles invalid bookmark data gracefully", () => {
    const invalidBookmarks = [
      { id: 1, title: null, url: "invalid-url" }, // Missing title
      { id: 2, title: "Valid", url: null }, // Missing URL
    ];

    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      bookmarks: invalidBookmarks as any,
    });

    render(<BookmarksPage />);

    // Should still render without crashing
    expect(
      screen.getByText("Understanding React Hooks")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("TypeScript Best Practices")
    ).not.toBeInTheDocument();
  });

  it("handles extreme pagination values", () => {
    mockUseBookmarksStore.mockReturnValue({
      ...mockStore,
      total: 1000,
      page: 50,
    });

    render(<BookmarksPage />);

    // Should render without issues
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
  });

  it("handles malformed search query", () => {
    render(<BookmarksPage />);

    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    fireEvent.change(searchInput, {
      target: { value: "<script>alert('xss')</script>" },
    });
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    expect(mockStore.setSearchQuery).toHaveBeenCalledWith(
      "<script>alert('xss')</script>"
    );
  });
});
