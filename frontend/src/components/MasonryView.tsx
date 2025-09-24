import React from "react";
import { Bookmark } from "../types/api";

interface MasonryViewProps {
  bookmarks: Bookmark[];
}

const MasonryView: React.FC<MasonryViewProps> = ({ bookmarks }) => {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-white p-4 shadow rounded mb-4 break-inside-avoid hover:shadow-lg transition-shadow"
        >
          <div className="h-24 bg-gray-200 rounded mb-2 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Thumbnail</span>
          </div>
          <h3 className="font-semibold text-lg mb-1">{bookmark.title}</h3>
          <p className="text-sm text-gray-600 mb-2">
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

export default MasonryView;
