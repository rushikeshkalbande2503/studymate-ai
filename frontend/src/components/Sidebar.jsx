
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Brain,
  BookOpen,
  Settings,
  GraduationCap,
  X,
  Layers,
  ClipboardList,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "My Documents",
    path: "/documents",
    icon: FileText,
  },
  {
    label: "AI PDF Summary",
    path: "/summary",
    icon: ClipboardList,
  },
  {
    label: "Chat with PDF",
    path: "/chat",
    icon: MessageSquare,
  },
  {
    label: "Quiz Generator",
    path: "/quiz",
    icon: Brain,
  },
  {
    label: "AI Flashcards",
    path: "/flashcards",
    icon: Layers,
  },
  {
    label: "AI Study Notes",
    path: "/study-notes",
    icon: BookOpen,
  },
];

function Sidebar({ mobileMenu, setMobileMenu }) {
  return (
    <>
      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={25} />
          </div>

          <div>
            <h2>
              StudyMate<span> AI</span>
            </h2>
            <p>YOUR SMART STUDY PARTNER</p>
          </div>

          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <p className="nav-heading">WORKSPACE</p>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setMobileMenu(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
            onClick={() => setMobileMenu(false)}
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>

          <div className="sidebar-profile">
            <div className="avatar">S</div>

            <div>
              <strong>Student User</strong>
              <small>Free Workspace</small>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
