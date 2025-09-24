import React from "react";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-100 p-4">
      <h2 className="text-lg font-semibold mb-4">Collections</h2>
      <ul>
        <li className="mb-2">
          <a href="#" className="text-blue-600">
            All Bookmarks
          </a>
        </li>
        <li className="mb-2">
          <a href="#" className="text-blue-600">
            Favorites
          </a>
        </li>
        {/* Add more collections */}
      </ul>
    </aside>
  );
};

export default Sidebar;
