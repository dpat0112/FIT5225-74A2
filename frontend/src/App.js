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
import { useEffect, useCallback } from "react";
import { getAvailableTags, validateToken } from "./repository/mediaApi";
import { Alert } from "./components/ui";

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [authView, setAuthView] = useState("login"); // "login" | "signup"
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ecolens_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() =>
    localStorage.getItem("ecolens_id_token")
  ); // Cognito ID token
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("ecolens_access_token")
  ); // Cognito Access token
  const [activePage, setActivePage] = useState("upload");
  const [authError, setAuthError] = useState(() => {
    // Check if we were just redirected due to expiry in a previous reload
    return sessionStorage.getItem("ecolens_auth_error");
  });

  // --- PERSISTENT SEARCH STATE ---
  const [activeQueryTab, setActiveQueryTab] = useState("tags");
  const [resultsByTab, setResultsByTab] = useState({
    tags: [],
    species: [],
    thumbnail: [],
    file: [],
  });
  const [errorsByTab, setErrorsByTab] = useState({
    tags: "",
    species: "",
    thumbnail: "",
    file: "",
  });
  const [tagRows, setTagRows] = useState([{ tag: "", count: 1 }]);
  const [species, setSpecies] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [queryFile, setQueryFile] = useState(null);
  const [detectedTags, setDetectedTags] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const loadTags = useCallback(async (authToken) => {
    if (!authToken) return;
    setTagsLoading(true);
    try {
      const tags = await getAvailableTags(authToken);
      setAvailableTags(tags);
    } catch (e) {
      console.error("Failed to load tags:", e);
    } finally {
      setTagsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Immediate local check for tokens
    const savedIdToken = localStorage.getItem("ecolens_id_token");
    const savedAccessToken = localStorage.getItem("ecolens_access_token");

    if (user && (!savedIdToken || !savedAccessToken)) {
      handleLogout(true);
      return;
    }

    if (token) {
      // Validate token on startup/refresh
      validateToken(token).catch((err) => {
        console.log("Validation error detected:", err);
        if (err.isAuthError) {
          handleLogout(true);
        }
      });
      loadTags(token);
    }

    // Listen for storage changes in other tabs
    const handleStorageChange = (e) => {
      if (e.key === "ecolens_id_token" && !e.newValue) {
        handleLogout(true);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token, user, loadTags]);

  function handleLogin({ token, accessToken, user }) {
    setToken(token);
    setAccessToken(accessToken);
    setUser(user);
    setAuthError(null);
    sessionStorage.removeItem("ecolens_auth_error");

    localStorage.setItem("ecolens_id_token", token);
    localStorage.setItem("ecolens_access_token", accessToken);
    localStorage.setItem("ecolens_user", JSON.stringify(user));
  }

  async function handleLogout(withError = false) {
    // Optimistic UI clear
    setUser(null);
    setToken(null);
    setAccessToken(null);
    setActivePage("upload");

    localStorage.removeItem("ecolens_id_token");
    localStorage.removeItem("ecolens_access_token");
    localStorage.removeItem("ecolens_user");

    if (withError) {
      sessionStorage.setItem(
        "ecolens_auth_error",
        "Your session has expired. Please log in again."
      );
      setAuthError("Your session has expired. Please log in again.");
    } else {
      sessionStorage.removeItem("ecolens_auth_error");
      setAuthError(null);
    }

    try {
      if (accessToken) {
        await logout(accessToken);
      }
    } catch (e) {
      console.error("Logout API call failed:", e);
    }

    // Optional: Clear search state on logout
    setResultsByTab({ tags: [], species: [], thumbnail: [], file: [] });
    setErrorsByTab({ tags: "", species: "", thumbnail: "", file: "" });
    setTagRows([{ tag: "", count: 1 }]);
    setSpecies("");
    setThumbUrl("");
    setQueryFile(null);
    setDetectedTags(null);
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
          {authError && (
            <div
              style={{
                position: "fixed",
                top: "2rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                width: "90%",
                maxWidth: "400px",
              }}
            >
              <Alert type="error">{authError}</Alert>
            </div>
          )}
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
            <button
              className="btn-logout"
              onClick={() => handleLogout(false)}
            >
              Sign Out
            </button>
          </div>
        </nav>
        <main className="main">
          {activePage === "upload" && (
            <UploadPage
              token={token}
              onAuthError={() => handleLogout(true)}
            />
          )}
          {activePage === "query" && (
            <QueryPage
              token={token}
              activeQueryTab={activeQueryTab}
              setActiveQueryTab={setActiveQueryTab}
              resultsByTab={resultsByTab}
              setResultsByTab={setResultsByTab}
              errorsByTab={errorsByTab}
              setErrorsByTab={setErrorsByTab}
              tagRows={tagRows}
              setTagRows={setTagRows}
              species={species}
              setSpecies={setSpecies}
              thumbUrl={thumbUrl}
              setThumbUrl={setThumbUrl}
              queryFile={queryFile}
              setQueryFile={setQueryFile}
              detectedTags={detectedTags}
              setDetectedTags={setDetectedTags}
              availableTags={availableTags}
              tagsLoading={tagsLoading}
              onRefreshTags={() => loadTags(token)}
              onAuthError={() => handleLogout(true)}
            />
          )}
          {activePage === "tags" && (
            <TagsPage
              token={token}
              onAuthError={() => handleLogout(true)}
            />
          )}
          {activePage === "delete" && (
            <DeletePage
              token={token}
              onAuthError={() => handleLogout(true)}
            />
          )}
          {activePage === "notifications" && (
            <NotificationsPage token={token} user={user} />
          )}
        </main>
      </div>
    </>
  );
}
