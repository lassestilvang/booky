import React, { useEffect, useState, useRef } from "react";
import { useBookmarksStore } from "../stores/bookmarks";
import GridView from "./GridView";
import HeadlinesView from "./HeadlinesView";
import MasonryView from "./MasonryView";
import ListView from "./ListView";
import AddBookmarkModal from "./AddBookmarkModal";

const BookmarksPage: React.FC = () => {
  const {
    bookmarks,
    loading,
    error,
    viewMode,
    searchQuery,
    page,
    total,
    fetchBookmarks,
    setViewMode,
    setSearchQuery,
  } = useBookmarksStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && bookmarks.length < total) {
          fetchBookmarks(searchQuery, page + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loading, bookmarks.length, total, page, searchQuery, fetchBookmarks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    fetchBookmarks(localSearch, 1);
  };

  const handleViewChange = (
    mode: "grid" | "headlines" | "masonry" | "list"
  ) => {
    setViewMode(mode);
  };

  const renderView = () => {
    switch (viewMode) {
      case "grid":
        return <GridView bookmarks={bookmarks} />;
      case "headlines":
        return <HeadlinesView bookmarks={bookmarks} />;
      case "masonry":
        return <MasonryView bookmarks={bookmarks} />;
      case "list":
        return <ListView bookmarks={bookmarks} />;
      default:
        return <GridView bookmarks={bookmarks} />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex mb-4">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search bookmarks..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewChange("grid")}
            className={`px-4 py-2 rounded ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => handleViewChange("headlines")}
            className={`px-4 py-2 rounded ${
              viewMode === "headlines"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Headlines
          </button>
          <button
            onClick={() => handleViewChange("masonry")}
            className={`px-4 py-2 rounded ${
              viewMode === "masonry"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Masonry
          </button>
          <button
            onClick={() => handleViewChange("list")}
            className={`px-4 py-2 rounded ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Bookmark
          </button>
        </div>
      </div>
      {error && <div className="text-center py-4 text-red-600">{error}</div>}
      {!error && renderView()}
      {loading && <div className="text-center py-4">Loading more...</div>}
      <div ref={loadMoreRef} className="h-10" />
      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default BookmarksPage;
