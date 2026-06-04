import { useState } from "react";
import "./styles/theme.css";
import { logout } from "./repository/auth";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import UploadPage from "./pages/upload/UploadPage";
import QueryPage from "./pages/query/QueryPage";
import TagsPage from "./pages/tags/TagsPage";
import DeletePage from "./pages/tags/DeletePage";
import NotificationsPage from "./pages/tags/NotificationsPage";

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [authView, setAuthView] = useState("login"); // "login" | "signup"
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Cognito ID token
  const [accessToken, setAccessToken] = useState(null); // Cognito Access token
  const [activePage, setActivePage] = useState("upload");

  function handleLogin({ token, accessToken, user }) {
    setToken(token);
    setAccessToken(accessToken);
    setUser(user);
  }

  async function handleLogout() {
    await logout(accessToken);
    setUser(null);
    setToken(null);
    setAccessToken(null);
    setActivePage("upload");
  }

  const pages = [
    { id: "upload", label: "Upload", icon: "📤" },
    { id: "query", label: "Search", icon: "🔍" },
    { id: "tags", label: "Tags", icon: "🏷" },
    { id: "delete", label: "Delete", icon: "🗑" },
    { id: "notifications", label: "Alerts", icon: "🔔" },
  ];

  // Not logged in
  if (!user) {
    return (
      <>
        <div className="bg-pattern" />
        <div className="app">
          {authView === "login" ? (
            <LoginPage
              onLogin={handleLogin}
              onSwitchToSignup={() => setAuthView("signup")}
            />
          ) : (
            <SignupPage onSwitchToLogin={() => setAuthView("login")} />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-pattern" />
      <div className="app">
        <nav className="nav">
          <div className="nav-brand">
            🌿 Aussie <span>EcoLens</span>
          </div>
          <div className="nav-tabs">
            {pages.map((p) => (
              <button
                key={p.id}
                className={`nav-tab${activePage === p.id ? " active" : ""}`}
                onClick={() => setActivePage(p.id)}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <div className="nav-user">
            <span>
              {user.firstName} {user.lastName}
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </nav>
        <main className="main">
          {activePage === "upload" && <UploadPage token={token} />}
          {activePage === "query" && <QueryPage token={token} />}
          {activePage === "tags" && <TagsPage token={token} />}
          {activePage === "delete" && <DeletePage token={token} />}
          {activePage === "notifications" && (
            <NotificationsPage token={token} user={user} />
          )}
        </main>
      </div>
    </>
  );
}
