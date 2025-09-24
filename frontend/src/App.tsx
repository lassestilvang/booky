import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Main from "./components/Main";
import BookmarksPage from "./components/BookmarksPage";

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
