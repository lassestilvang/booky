import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Main from "./components/Main";
import BookmarksPage from "./components/BookmarksPage";
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useUserStore } from "./stores/user";

function App() {
  const { initializeAuth } = useUserStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Header />
                  <Routes>
                    <Route path="/" element={<BookmarksPage />} />
                    <Route path="/collections/:id" element={<Main />} />
                    <Route path="/search" element={<Main />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
