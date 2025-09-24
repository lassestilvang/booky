import React from "react";
import { Bookmark } from "../types/api";

interface HeadlinesViewProps {
  bookmarks: Bookmark[];
}

const HeadlinesView: React.FC<HeadlinesViewProps> = ({ bookmarks }) => {
  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-white p-4 shadow rounded hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-bold mb-2">{bookmark.title}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {bookmark.description || "No description"}
          </p>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            {bookmark.url}
          </a>
        </div>
      ))}
    </div>
  );
};

export default HeadlinesView;
