
import { Menu, CheckCircle, AlertCircle } from "lucide-react";

function Navbar({ backendStatus, setMobileMenu, pageTitle }) {
  return (
    <header className="topbar">

      <button
        className="menu-toggle"
        onClick={() => setMobileMenu(true)}
        aria-label="Open navigation"
      >
        <Menu size={23} />
      </button>

      <div className="breadcrumb">
        Workspace <span>/</span> {pageTitle}
      </div>

      <div className="topbar-right">

        <div className={`connection-status ${backendStatus}`}>
          {backendStatus === "connected" ? (
            <CheckCircle size={15} />
          ) : (
            <AlertCircle size={15} />
          )}

          {backendStatus === "connected"
            ? "Backend Connected"
            : backendStatus === "checking"
            ? "Connecting..."
            : "Backend Offline"}
        </div>

        <div className="top-avatar">S</div>

      </div>
    </header>
  );
}

export default Navbar;
