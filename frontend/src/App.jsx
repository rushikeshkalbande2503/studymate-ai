
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Summary from "./pages/Summary";
import ComingSoon from "./pages/ComingSoon";
import Quiz from "./pages/Quiz";
import { checkBackend } from "./services/api";
import Flashcards from "./pages/Flashcards";
import Chat from "./pages/Chat";
import StudyNotes from "./pages/StudyNotes";
import "./App.css";

function AppLayout() {
  const [backendStatus, setBackendStatus] = useState("checking");
  const [mobileMenu, setMobileMenu] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const loadBackend = async () => {
      try {
        const response = await checkBackend();

        if (response.status === "healthy") {
          setBackendStatus("connected");
        } else {
          setBackendStatus("disconnected");
        }
      } catch {
        setBackendStatus("disconnected");
      }
    };

    loadBackend();
  }, []);

  const pageTitles = {
     "/": "Dashboard",
  "/documents": "My Documents",
  "/chat": "Chat with PDF",
  "/summary": "AI PDF Summary",
  "/quiz": "Quiz Generator",
  "/flashcards": "AI Flashcards",
  "/study-notes": "AI Study Notes",
  "/settings": "Settings",

  };

  const currentPage =
    pageTitles[location.pathname] || "StudyMate AI";

  return (
    <div className="app-layout">

      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />

      <main className="main-content">

        <Navbar
          backendStatus={backendStatus}
          setMobileMenu={setMobileMenu}
          pageTitle={currentPage}
        />

        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/documents" element={<Documents />} />

          <Route path="/summary" element={<Summary />} />

          <Route path="/chat" element={<Chat />} />

          <Route path="/quiz" element={<Quiz />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/study-notes" element={<StudyNotes />} />
          

          <Route
            path="/settings"
            element={
              <ComingSoon
                title="Settings"
                description="Application preferences and student profile settings will be available here."
              />
            }
          />

          <Route
            path="*"
            element={
              <ComingSoon
                title="Page Not Found"
                description="The requested page does not exist."
              />
            }
          />
        </Routes>

        <footer className="app-footer">
          <span>© 2026 StudyMate AI</span>
          <span>Built for smarter learning with AI.</span>
        </footer>

      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
