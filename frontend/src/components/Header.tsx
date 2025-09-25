import React from "react";
import { useUserStore } from "../stores/user";

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useUserStore();

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Booky</h1>
      {isAuthenticated && (
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      )}
    </header>
  );
};

export default Header;
