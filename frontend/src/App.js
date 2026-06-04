import { useState, useRef, useEffect } from "react";
import { API_BASE, mockDelay } from "./config";
import "./styles/theme.css";
import { logout } from "./repository/auth";
import { Alert, Spinner, Tag } from "./components/ui";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

const api = {
  // FILE UPLOAD — Member 2 replaces
  async uploadFile(file, token) {
    await mockDelay(1500);
    const isDuplicate = file.name.includes("dup");
    if (isDuplicate)
      throw new Error("DUPLICATE: This file already exists in the system.");
    return {
      fileUrl: `https://s3.amazonaws.com/ecolens/uploads/${file.name}`,
      thumbnailUrl: `https://s3.amazonaws.com/ecolens/thumbnails/thumb_${file.name}`,
      tags: ["koala", "eucalyptus"],
      message: "File uploaded and tagged successfully!",
    };
  },

  // QUERIES — Member 2 replaces
  async queryByTags(tagsObj, token) {
    // tagsObj e.g. { koala: 3, wombat: 1 }
    await mockDelay();
    return [
      {
        fileUrl: "https://via.placeholder.com/400x300?text=Koala+Photo",
        thumbnailUrl: "https://via.placeholder.com/150?text=Koala",
        tags: ["koala", "eucalyptus"],
        type: "image",
      },
      {
        fileUrl: "https://via.placeholder.com/400x300?text=Wombat+Video",
        thumbnailUrl: null,
        tags: ["wombat"],
        type: "video",
      },
    ];
  },
  async queryBySpecies(species, token) {
    await mockDelay();
    return [
      {
        fileUrl: "https://via.placeholder.com/400x300?text=Species+Result",
        thumbnailUrl: "https://via.placeholder.com/150?text=Result",
        tags: [species],
        type: "image",
      },
    ];
  },
  async queryByThumbnailUrl(thumbUrl, token) {
    await mockDelay();
    return {
      fileUrl: "https://via.placeholder.com/800x600?text=Full+Image",
      tags: ["dingo", "sand"],
    };
  },
  async queryByFile(file, token) {
    await mockDelay(1200);
    return [
      {
        fileUrl: "https://via.placeholder.com/400x300?text=Similar+File",
        thumbnailUrl: "https://via.placeholder.com/150?text=Similar",
        tags: ["cassowary"],
        type: "image",
      },
    ];
  },

  // TAG MANAGEMENT — Member 2 replaces
  async modifyTags(urls, tags, operation, token) {
    // operation: 1 = add, 0 = remove
    await mockDelay();
    return {
      success: true,
      message: `Tags ${operation === 1 ? "added" : "removed"} successfully on ${urls.length} file(s).`,
    };
  },

  // DELETE — Member 2 replaces
  async deleteFiles(urls, token) {
    await mockDelay();
    return {
      success: true,
      message: `${urls.length} file(s) deleted successfully.`,
    };
  },

  // NOTIFICATIONS — Member 1 replaces (SNS)
  async subscribeNotification(email, tag, token) {
    await mockDelay();
    return {
      success: true,
      message: `Subscribed to notifications for "${tag}"`,
    };
  },
};

// ============================================================
// UPLOAD PAGE
// ============================================================
function UploadPage({ token }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef();

  function handleFile(f) {
    setFile(f);
    setResult(null);
    setError("");
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);
    const interval = setInterval(
      () => setProgress((p) => Math.min(p + 15, 85)),
      200,
    );
    try {
      const res = await api.uploadFile(file, token);
      setProgress(100);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Upload <span>Wildlife Media</span>
        </h1>
        <p>
          Images and videos are automatically tagged using our ML species
          detection model
        </p>
      </div>
      <div className="card">
        <div className="card-title">🌿 Select File</div>
        <div
          className={`dropzone${drag ? " drag-over" : ""}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <div className="dropzone-icon">📁</div>
          <div className="dropzone-text">
            {file ? (
              <>
                <strong>{file.name}</strong>
                <br />
                <span style={{ fontSize: "0.8rem", color: "var(--mist)" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </>
            ) : (
              <>
                <strong>Click or drag</strong> to select a file
                <br />
                Supports JPG, PNG, MP4, MOV
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {file && (
          <>
            {loading && (
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner /> Uploading...
                  </>
                ) : (
                  "🚀 Upload & Tag"
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError("");
                }}
              >
                Clear
              </button>
            </div>
          </>
        )}

        {error && (
          <div style={{ marginTop: "1rem" }}>
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {result && (
          <div style={{ marginTop: "1.5rem" }}>
            <Alert type="success">{result.message}</Alert>
            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="card-title">✅ Upload Result</div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--mist)",
                  marginBottom: "0.5rem",
                }}
              >
                File URL:{" "}
                <a href={result.fileUrl} style={{ color: "var(--sage)" }}>
                  {result.fileUrl}
                </a>
              </p>
              {result.thumbnailUrl && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--mist)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Thumbnail:{" "}
                  <a
                    href={result.thumbnailUrl}
                    style={{ color: "var(--sage)" }}
                  >
                    {result.thumbnailUrl}
                  </a>
                </p>
              )}
              <div>
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--mist)",
                    marginRight: "0.5rem",
                  }}
                >
                  Detected species:
                </span>
                <div className="tags-row">
                  {result.tags.map((t) => (
                    <Tag key={t} label={t} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// QUERY PAGE
// ============================================================
function QueryPage({ token }) {
  const [activeQuery, setActiveQuery] = useState("tags");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [modal, setModal] = useState(null);

  // Query states
  const [tagRows, setTagRows] = useState([{ tag: "", count: 1 }]);
  const [species, setSpecies] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [queryFile, setQueryFile] = useState(null);
  const fileRef = useRef();

  async function runQuery() {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      let res;
      if (activeQuery === "tags") {
        const obj = {};
        tagRows.forEach((r) => {
          if (r.tag) obj[r.tag] = parseInt(r.count) || 1;
        });
        res = await api.queryByTags(obj, token);
      } else if (activeQuery === "species") {
        res = await api.queryBySpecies(species, token);
      } else if (activeQuery === "thumbnail") {
        res = await api.queryByThumbnailUrl(thumbUrl, token);
        res = [res];
      } else if (activeQuery === "file") {
        res = await api.queryByFile(queryFile, token);
      }
      setResults(res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const queryTypes = [
    { id: "tags", label: "🔖 By Tags & Counts" },
    { id: "species", label: "🦘 By Species" },
    { id: "thumbnail", label: "🖼 By Thumbnail URL" },
    { id: "file", label: "📎 By File Content" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>
          Search <span>Wildlife Files</span>
        </h1>
        <p>
          Query your uploaded media using tags, species, URLs, or file content
        </p>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          {queryTypes.map((q) => (
            <button
              key={q.id}
              className={`btn ${activeQuery === q.id ? "btn-primary" : "btn-secondary"} btn-sm`}
              onClick={() => {
                setActiveQuery(q.id);
                setResults([]);
                setError("");
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        {activeQuery === "tags" && (
          <div>
            <div className="card-title">Search by tags with minimum counts</div>
            {tagRows.map((row, i) => (
              <div key={i} className="tag-input-row">
                <input
                  className="form-input"
                  placeholder="Species tag (e.g. koala)"
                  value={row.tag}
                  onChange={(e) =>
                    setTagRows((rows) =>
                      rows.map((r, j) =>
                        j === i ? { ...r, tag: e.target.value } : r,
                      ),
                    )
                  }
                />
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  placeholder="Min count"
                  style={{ maxWidth: "110px" }}
                  value={row.count}
                  onChange={(e) =>
                    setTagRows((rows) =>
                      rows.map((r, j) =>
                        j === i ? { ...r, count: e.target.value } : r,
                      ),
                    )
                  }
                />
                {tagRows.length > 1 && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      setTagRows((rows) => rows.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setTagRows((r) => [...r, { tag: "", count: 1 }])}
            >
              + Add tag
            </button>
          </div>
        )}

        {activeQuery === "species" && (
          <div className="form-group">
            <label className="form-label">Species name</label>
            <input
              className="form-input"
              placeholder="e.g. dingo, cassowary, koala"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            />
          </div>
        )}

        {activeQuery === "thumbnail" && (
          <div className="form-group">
            <label className="form-label">Thumbnail URL</label>
            <input
              className="form-input"
              placeholder="https://s3.amazonaws.com/..."
              value={thumbUrl}
              onChange={(e) => setThumbUrl(e.target.value)}
            />
          </div>
        )}

        {activeQuery === "file" && (
          <div>
            <div
              className="dropzone"
              onClick={() => fileRef.current.click()}
              style={{ padding: "1.5rem" }}
            >
              <div className="dropzone-text">
                {queryFile ? (
                  <strong>{queryFile.name}</strong>
                ) : (
                  <>
                    <strong>Click to select</strong> a file to match against
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: "none" }}
                onChange={(e) => setQueryFile(e.target.files[0])}
              />
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--mist)",
                marginTop: "0.5rem",
              }}
            >
              ℹ This file will NOT be stored in the database.
            </p>
          </div>
        )}

        <div style={{ marginTop: "1.25rem" }}>
          <button
            className="btn btn-primary"
            onClick={runQuery}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner /> Searching...
              </>
            ) : (
              "🔍 Search"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: "1rem" }}>
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {results.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="card-title">
            🗂 Results{" "}
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--mist)",
                fontFamily: "DM Sans",
              }}
            >
              ({results.length} found)
            </span>
          </div>
          <div className="results-grid">
            {results.map((r, i) => (
              <div key={i} className="result-card" onClick={() => setModal(r)}>
                {r.thumbnailUrl ? (
                  <img
                    src={r.thumbnailUrl}
                    alt="result"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <div
                    style={{
                      height: "110px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2rem",
                    }}
                  >
                    🎬
                  </div>
                )}
                <div className="result-card-info">
                  <div className="result-card-type">{r.type || "image"}</div>
                  <div className="tags-row">
                    {(r.tags || []).slice(0, 2).map((t) => (
                      <Tag key={t} label={t} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div className="icon">🔭</div>
          <p>Run a query to see results</p>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}>
              ✕
            </button>
            <div className="card-title">Full Image</div>
            <img
              src={modal.fileUrl}
              alt="full size"
              onError={(e) =>
                (e.target.src =
                  "https://via.placeholder.com/400x300?text=Image+Unavailable")
              }
            />
            <div className="tags-row">
              {(modal.tags || []).map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--mist)",
                marginTop: "0.75rem",
                wordBreak: "break-all",
              }}
            >
              {modal.fileUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAG MANAGEMENT PAGE
// ============================================================
function TagsPage({ token }) {
  const [urls, setUrls] = useState("");
  const [tags, setTags] = useState("");
  const [operation, setOperation] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!urlList.length || !tagList.length) {
      setError("Please provide at least one URL and one tag.");
      return;
    }
    setLoading(true);
    setError("");
    setMsg(null);
    try {
      const res = await api.modifyTags(urlList, tagList, operation, token);
      setMsg(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Manage <span>Tags</span>
        </h1>
        <p>Bulk add or remove species tags from your uploaded files</p>
      </div>
      <div className="card">
        <div className="form-group">
          <label className="form-label">File URLs (one per line)</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder={
              "https://s3.amazonaws.com/ecolens/file1.jpg\nhttps://s3.amazonaws.com/ecolens/file2.jpg"
            }
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input
            className="form-input"
            placeholder="koala, wombat, magpie"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Operation</label>
          <div
            style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}
          >
            <button
              className={`btn btn-sm ${operation === 1 ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setOperation(1)}
            >
              ➕ Add Tags
            </button>
            <button
              className={`btn btn-sm ${operation === 0 ? "btn-danger" : "btn-secondary"}`}
              onClick={() => setOperation(0)}
            >
              ➖ Remove Tags
            </button>
          </div>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <Spinner /> : `${operation === 1 ? "Add" : "Remove"} Tags`}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// DELETE FILES PAGE
// ============================================================
function DeletePage({ token }) {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");

  async function handleDelete() {
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (!urlList.length) {
      setError("Please enter at least one URL.");
      return;
    }
    setLoading(true);
    setError("");
    setMsg(null);
    try {
      const res = await api.deleteFiles(urlList, token);
      setMsg(res.message);
      setUrls("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Delete <span>Files</span>
        </h1>
        <p>
          Permanently remove files and their thumbnails from storage and the
          database
        </p>
      </div>
      <div className="card">
        <Alert type="info">
          ⚠ This action is irreversible. Files and thumbnails will be
          permanently deleted.
        </Alert>
        <div className="form-group">
          <label className="form-label">
            File URLs to delete (one per line)
          </label>
          <textarea
            className="form-input"
            rows={5}
            placeholder={
              "https://s3.amazonaws.com/ecolens/file1.jpg\nhttps://s3.amazonaws.com/ecolens/file2.jpg"
            }
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? <Spinner /> : "🗑 Delete Files"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// NOTIFICATIONS PAGE
// ============================================================
function NotificationsPage({ token, user }) {
  const [email, setEmail] = useState(user?.email || "");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (!email || !tag) {
      setError("Please enter both email and tag.");
      return;
    }
    setLoading(true);
    setError("");
    setMsg(null);
    try {
      const res = await api.subscribeNotification(email, tag, token);
      setMsg(res.message);
      setTag("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Tag <span>Notifications</span>
        </h1>
        <p>
          Subscribe to email alerts when new files with specific species are
          uploaded
        </p>
      </div>
      <div className="card">
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Species Tag to Watch</label>
          <input
            className="form-input"
            placeholder="e.g. koala, wombat, dingo"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <button
          className="btn btn-primary"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? <Spinner /> : "🔔 Subscribe"}
        </button>
      </div>
    </div>
  );
}

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
