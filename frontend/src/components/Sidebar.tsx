import React from "react";
import { Link } from "react-router-dom";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-100 p-4">
      <h2 className="text-lg font-semibold mb-4">Collections</h2>
      <ul>
        <li className="mb-2">
          <Link to="/bookmarks" className="text-blue-600">
            All Bookmarks
          </Link>
        </li>
        <li className="mb-2">
          <Link to="/favorites" className="text-blue-600">
            Favorites
          </Link>
        </li>
        {/* Add more collections */}
      </ul>
    </aside>
  );
};

export default Sidebar;
