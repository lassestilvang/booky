import React from "react";

const Main: React.FC = () => {
  return (
    <main className="flex-1 p-4">
      <h2 className="text-2xl font-bold mb-4">Bookmarks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder for bookmarks */}
        <div className="bg-white p-4 shadow rounded">Bookmark 1</div>
        <div className="bg-white p-4 shadow rounded">Bookmark 2</div>
        <div className="bg-white p-4 shadow rounded">Bookmark 3</div>
      </div>
    </main>
  );
};

export default Main;
