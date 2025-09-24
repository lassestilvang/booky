import { create } from "zustand";
import apiClient from "../api/client";
import { Bookmark, PaginatedResponse } from "../types/api";

interface BookmarksState {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  searchQuery: string;
  viewMode: "grid" | "headlines" | "masonry" | "list";
  fetchBookmarks: (query?: string, page?: number) => Promise<void>;
  setViewMode: (mode: "grid" | "headlines" | "masonry" | "list") => void;
  setSearchQuery: (query: string) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  loading: false,
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  searchQuery: "",
  viewMode: "grid",
  fetchBookmarks: async (query = "", page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<PaginatedResponse<Bookmark>>(
        "/bookmarks",
        {
          params: { q: query, page, limit: get().limit },
        }
      );
      set({
        bookmarks:
          page === 1
            ? response.data.data
            : [...get().bookmarks, ...response.data.data],
        total: response.data.total,
        page,
        searchQuery: query,
        loading: false,
      });
    } catch (error) {
      set({ error: "Failed to fetch bookmarks", loading: false });
    }
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addBookmark: (bookmark) =>
    set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
  removeBookmark: (id) =>
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
}));
