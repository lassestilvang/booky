import React from "react";
import { Bookmark } from "../types/api";

interface ListViewProps {
  bookmarks: Bookmark[];
}

const ListView: React.FC<ListViewProps> = ({ bookmarks }) => {
  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-white p-4 shadow rounded flex items-center hover:shadow-lg transition-shadow"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{bookmark.title}</h3>
            <p className="text-sm text-gray-600 mb-1">
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
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="mt-2">
                {bookmark.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button className="text-blue-600 hover:text-blue-800 ml-4">
            Edit
          </button>
        </div>
      ))}
    </div>
  );
};

export default ListView;
