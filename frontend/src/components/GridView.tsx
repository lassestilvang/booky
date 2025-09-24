import React from "react";
import { Bookmark } from "../types/api";

interface GridViewProps {
  bookmarks: Bookmark[];
}

const GridView: React.FC<GridViewProps> = ({ bookmarks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-white p-4 shadow rounded hover:shadow-lg transition-shadow"
        >
          <div className="h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
            <span className="text-gray-500">Thumbnail</span>
          </div>
          <h3 className="font-semibold text-lg mb-1 truncate">
            {bookmark.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2 truncate">
            {bookmark.description || bookmark.url}
          </p>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            Visit
          </a>
        </div>
      ))}
    </div>
  );
};

export default GridView;
