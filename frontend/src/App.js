import { useState, useRef, useEffect } from "react";

// ============================================================
// AWS COGNITO CONFIG — Provided by Member 1 (Kalana)
// ============================================================
const COGNITO_CONFIG = {
  region: "us-east-1",
  userPoolId: "us-east-1_FB2bm3xBs",
  clientId: "8cc8uqaupjpe5hl005ktue5gr",
};

const COGNITO_URL = `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`;

// ============================================================
// MOCK API LAYER — Member 2 (Kiran) replaces the non-auth
// functions below with real AWS API Gateway endpoint calls
// ============================================================
const API_BASE = "https://YOUR_API_GATEWAY_URL"; // TODO: Kiran replaces this

const mockDelay = (ms = 800) => new Promise(r => setTimeout(r, ms));

// Helper: call Cognito API
async function cognitoRequest(action, body) {
  const res = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || "Cognito error");
  return data;
}

const api = {
  // ✅ REAL Cognito login
  async login(email, password) {
    const data = await cognitoRequest("InitiateAuth", {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: COGNITO_CONFIG.clientId,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });
    const token = data.AuthenticationResult.IdToken;
    const accessToken = data.AuthenticationResult.AccessToken;
    // Decode first name/last name from ID token payload
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      token,
      accessToken,
      user: {
        email: payload.email || email,
        firstName: payload.given_name || email.split("@")[0],
        lastName: payload.family_name || "",
      },
    };
  },

  // ✅ REAL Cognito sign-up
  async signup(email, password, firstName, lastName) {
    await cognitoRequest("SignUp", {
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    });
    return { success: true, message: "Account created! Please check your email to verify your account before signing in." };
  },

  // ✅ REAL Cognito sign-out (revokes tokens)
  async logout(accessToken) {
    if (accessToken) {
      try {
        await cognitoRequest("GlobalSignOut", { AccessToken: accessToken });
      } catch (e) { /* ignore */ }
    }
    return { success: true };
  },

  // FILE UPLOAD — Member 2 replaces
  async uploadFile(file, token) {
    await mockDelay(1500);
    const isDuplicate = file.name.includes("dup");
    if (isDuplicate) throw new Error("DUPLICATE: This file already exists in the system.");
    return {
      fileUrl: `https://s3.amazonaws.com/ecolens/uploads/${file.name}`,
      thumbnailUrl: `https://s3.amazonaws.com/ecolens/thumbnails/thumb_${file.name}`,
      tags: ["koala", "eucalyptus"],
      message: "File uploaded and tagged successfully!"
    };
  },

  // QUERIES — Member 2 replaces
  async queryByTags(tagsObj, token) {
    // tagsObj e.g. { koala: 3, wombat: 1 }
    await mockDelay();
    return [
      { fileUrl: "https://via.placeholder.com/400x300?text=Koala+Photo", thumbnailUrl: "https://via.placeholder.com/150?text=Koala", tags: ["koala", "eucalyptus"], type: "image" },
      { fileUrl: "https://via.placeholder.com/400x300?text=Wombat+Video", thumbnailUrl: null, tags: ["wombat"], type: "video" },
    ];
  },
  async queryBySpecies(species, token) {
    await mockDelay();
    return [
      { fileUrl: "https://via.placeholder.com/400x300?text=Species+Result", thumbnailUrl: "https://via.placeholder.com/150?text=Result", tags: [species], type: "image" },
    ];
  },
  async queryByThumbnailUrl(thumbUrl, token) {
    await mockDelay();
    return { fileUrl: "https://via.placeholder.com/800x600?text=Full+Image", tags: ["dingo", "sand"] };
  },
  async queryByFile(file, token) {
    await mockDelay(1200);
    return [
      { fileUrl: "https://via.placeholder.com/400x300?text=Similar+File", thumbnailUrl: "https://via.placeholder.com/150?text=Similar", tags: ["cassowary"], type: "image" },
    ];
  },

  // TAG MANAGEMENT — Member 2 replaces
  async modifyTags(urls, tags, operation, token) {
    // operation: 1 = add, 0 = remove
    await mockDelay();
    return { success: true, message: `Tags ${operation === 1 ? "added" : "removed"} successfully on ${urls.length} file(s).` };
  },

  // DELETE — Member 2 replaces
  async deleteFiles(urls, token) {
    await mockDelay();
    return { success: true, message: `${urls.length} file(s) deleted successfully.` };
  },

  // NOTIFICATIONS — Member 1 replaces (SNS)
  async subscribeNotification(email, tag, token) {
    await mockDelay();
    return { success: true, message: `Subscribed to notifications for "${tag}"` };
  },
};

// ============================================================
// THEME & STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --forest: #1a2e1a;
    --moss: #2d4a2d;
    --fern: #3d6b3d;
    --sage: #7aab6e;
    --mist: #b8d4b0;
    --cream: #f5f0e8;
    --sand: #e8dcc8;
    --amber: #d48c3a;
    --rust: #c45c2a;
    --white: #ffffff;
    --shadow: rgba(26,46,26,0.15);
    --glass: rgba(255,255,255,0.08);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--forest);
    color: var(--cream);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Animated background */
  .bg-pattern {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: 
      radial-gradient(ellipse at 20% 20%, rgba(61,107,61,0.3) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(45,74,45,0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(26,46,26,1) 0%, transparent 100%);
  }

  .app { position: relative; z-index: 1; min-height: 100vh; }

  /* NAV */
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(26,46,26,0.9);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(122,171,110,0.2);
    padding: 0 2rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 64px;
  }
  .nav-brand {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem; font-weight: 900;
    color: var(--sage);
    display: flex; align-items: center; gap: 0.5rem;
  }
  .nav-brand span { color: var(--amber); }
  .nav-tabs { display: flex; gap: 0.25rem; }
  .nav-tab {
    background: none; border: none; cursor: pointer;
    color: var(--mist); font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem; font-weight: 500;
    padding: 0.5rem 1rem; border-radius: 8px;
    transition: all 0.2s;
    display: flex; align-items: center; gap: 0.4rem;
  }
  .nav-tab:hover { background: var(--glass); color: var(--white); }
  .nav-tab.active { background: rgba(122,171,110,0.2); color: var(--sage); }
  .nav-user {
    display: flex; align-items: center; gap: 1rem;
    font-size: 0.85rem; color: var(--mist);
  }
  .btn-logout {
    background: rgba(196,92,42,0.2); border: 1px solid rgba(196,92,42,0.4);
    color: var(--rust); cursor: pointer; padding: 0.4rem 1rem;
    border-radius: 8px; font-size: 0.8rem; font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .btn-logout:hover { background: rgba(196,92,42,0.4); }

  /* MAIN CONTENT */
  .main { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem; }

  /* PAGE HEADER */
  .page-header { margin-bottom: 2rem; }
  .page-header h1 {
    font-family: 'Playfair Display', serif;
    font-size: 2rem; font-weight: 700;
    color: var(--white);
    line-height: 1.2;
  }
  .page-header h1 span { color: var(--sage); }
  .page-header p { color: var(--mist); margin-top: 0.5rem; font-size: 0.95rem; }

  /* CARDS */
  .card {
    background: rgba(45,74,45,0.3);
    border: 1px solid rgba(122,171,110,0.15);
    border-radius: 16px; padding: 1.75rem;
    backdrop-filter: blur(10px);
  }
  .card + .card { margin-top: 1.5rem; }
  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; color: var(--sage);
    margin-bottom: 1.25rem;
    display: flex; align-items: center; gap: 0.5rem;
  }

  /* FORMS */
  .form-group { margin-bottom: 1.25rem; }
  .form-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--mist); margin-bottom: 0.4rem; letter-spacing: 0.05em; text-transform: uppercase; }
  .form-input {
    width: 100%; padding: 0.7rem 1rem;
    background: rgba(26,46,26,0.6);
    border: 1px solid rgba(122,171,110,0.25);
    border-radius: 10px; color: var(--white);
    font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .form-input:focus { border-color: var(--sage); }
  .form-input::placeholder { color: rgba(184,212,176,0.4); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

  /* BUTTONS */
  .btn {
    padding: 0.75rem 1.75rem; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 0.5rem;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--sage), var(--fern));
    color: var(--white);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(122,171,110,0.4); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-secondary {
    background: rgba(122,171,110,0.15);
    border: 1px solid rgba(122,171,110,0.3);
    color: var(--sage);
  }
  .btn-secondary:hover { background: rgba(122,171,110,0.25); }
  .btn-danger {
    background: rgba(196,92,42,0.2);
    border: 1px solid rgba(196,92,42,0.3);
    color: var(--rust);
  }
  .btn-danger:hover { background: rgba(196,92,42,0.35); }
  .btn-sm { padding: 0.4rem 0.9rem; font-size: 0.8rem; }

  /* ALERTS */
  .alert {
    padding: 0.9rem 1.25rem; border-radius: 10px;
    font-size: 0.9rem; margin-bottom: 1rem;
    display: flex; align-items: flex-start; gap: 0.6rem;
  }
  .alert-success { background: rgba(122,171,110,0.2); border: 1px solid rgba(122,171,110,0.3); color: var(--sage); }
  .alert-error { background: rgba(196,92,42,0.2); border: 1px solid rgba(196,92,42,0.3); color: #e88060; }
  .alert-info { background: rgba(212,140,58,0.15); border: 1px solid rgba(212,140,58,0.3); color: var(--amber); }

  /* DROP ZONE */
  .dropzone {
    border: 2px dashed rgba(122,171,110,0.35);
    border-radius: 14px; padding: 2.5rem;
    text-align: center; cursor: pointer;
    transition: all 0.3s;
  }
  .dropzone:hover, .dropzone.drag-over {
    border-color: var(--sage);
    background: rgba(122,171,110,0.08);
  }
  .dropzone-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .dropzone-text { color: var(--mist); font-size: 0.95rem; }
  .dropzone-text strong { color: var(--sage); }

  /* TAGS */
  .tag {
    display: inline-flex; align-items: center; gap: 0.3rem;
    padding: 0.25rem 0.7rem; border-radius: 999px;
    font-size: 0.78rem; font-weight: 500;
  }
  .tag-green { background: rgba(122,171,110,0.2); color: var(--sage); border: 1px solid rgba(122,171,110,0.3); }
  .tag-amber { background: rgba(212,140,58,0.2); color: var(--amber); border: 1px solid rgba(212,140,58,0.3); }
  .tags-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }

  /* RESULTS GRID */
  .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-top: 1rem; }
  .result-card {
    background: rgba(26,46,26,0.6); border: 1px solid rgba(122,171,110,0.15);
    border-radius: 12px; overflow: hidden; cursor: pointer;
    transition: all 0.2s;
  }
  .result-card:hover { transform: translateY(-3px); border-color: var(--sage); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .result-card img { width: 100%; height: 110px; object-fit: cover; display: block; }
  .result-card-info { padding: 0.6rem; }
  .result-card-type { font-size: 0.7rem; color: var(--amber); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

  /* AUTH PAGES */
  .auth-wrapper {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 2rem;
  }
  .auth-card {
    width: 100%; max-width: 420px;
    background: rgba(45,74,45,0.4);
    border: 1px solid rgba(122,171,110,0.2);
    border-radius: 20px; padding: 2.5rem;
    backdrop-filter: blur(20px);
  }
  .auth-logo {
    text-align: center; margin-bottom: 2rem;
  }
  .auth-logo h1 {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem; font-weight: 900; color: var(--sage);
  }
  .auth-logo h1 span { color: var(--amber); }
  .auth-logo p { color: var(--mist); font-size: 0.85rem; margin-top: 0.3rem; }
  .auth-switch { text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: var(--mist); }
  .auth-switch button { background: none; border: none; color: var(--sage); cursor: pointer; font-weight: 600; text-decoration: underline; }

  /* LOADING SPINNER */
  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .modal {
    background: var(--moss); border: 1px solid rgba(122,171,110,0.25);
    border-radius: 16px; padding: 2rem; max-width: 500px; width: 100%;
    position: relative;
  }
  .modal-close {
    position: absolute; top: 1rem; right: 1rem;
    background: none; border: none; color: var(--mist);
    font-size: 1.2rem; cursor: pointer;
  }
  .modal img { width: 100%; border-radius: 10px; margin-bottom: 1rem; }

  /* DIVIDER */
  .divider { height: 1px; background: rgba(122,171,110,0.15); margin: 1.5rem 0; }

  /* TAG INPUT ROW */
  .tag-input-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
  .tag-input-row .form-input { flex: 1; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--forest); }
  ::-webkit-scrollbar-thumb { background: var(--fern); border-radius: 3px; }

  /* UPLOAD PROGRESS */
  .progress-bar-wrap { background: rgba(26,46,26,0.6); border-radius: 999px; height: 6px; overflow: hidden; margin-top: 0.75rem; }
  .progress-bar { height: 100%; background: linear-gradient(90deg, var(--sage), var(--amber)); border-radius: 999px; transition: width 0.3s; }

  /* EMPTY STATE */
  .empty-state { text-align: center; padding: 3rem 1rem; color: var(--mist); }
  .empty-state .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }

  /* NOTIFICATION BADGE */
  .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; background: var(--amber); color: var(--forest); margin-left: 0.4rem; }
`;

// ============================================================
// HELPER COMPONENTS
// ============================================================
function Alert({ type = "info", children }) {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return <div className={`alert alert-${type}`}><span>{icons[type]}</span><span>{children}</span></div>;
}

function Spinner() { return <span className="spinner" />; }

function Tag({ label, variant = "green" }) {
  return <span className={`tag tag-${variant}`}>{label}</span>;
}

// ============================================================
// AUTH PAGES
// ============================================================
function LoginPage({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await api.login(email, password);
      onLogin(result);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Aussie <span>EcoLens</span></h1>
          <p>Wildlife Observation Platform</p>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? <Spinner /> : "Sign In"}
          </button>
        </form>
        <div className="auth-switch">
          Don't have an account? <button onClick={onSwitchToSignup}>Sign up</button>
        </div>
      </div>
    </div>
  );
}

function SignupPage({ onSignup, onSwitchToLogin }) {
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(""); setMsg(null);
    try {
      const result = await api.signup(form.email, form.password, form.firstName, form.lastName);
      setMsg(result.message);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Aussie <span>EcoLens</span></h1>
          <p>Create your account</p>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" placeholder="Jane" value={form.firstName} onChange={update("firstName")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" placeholder="Smith" value={form.lastName} onChange={update("lastName")} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={update("password")} required />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? <Spinner /> : "Create Account"}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <button onClick={onSwitchToLogin}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

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
    setFile(f); setResult(null); setError("");
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null); setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 200);
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
        <h1>Upload <span>Wildlife Media</span></h1>
        <p>Images and videos are automatically tagged using our ML species detection model</p>
      </div>
      <div className="card">
        <div className="card-title">🌿 Select File</div>
        <div
          className={`dropzone${drag ? " drag-over" : ""}`}
          onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <div className="dropzone-icon">📁</div>
          <div className="dropzone-text">
            {file ? <><strong>{file.name}</strong><br /><span style={{ fontSize: "0.8rem", color: "var(--mist)" }}>{(file.size / 1024).toFixed(1)} KB</span></> : <><strong>Click or drag</strong> to select a file<br />Supports JPG, PNG, MP4, MOV</>}
          </div>
          <input ref={inputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {file && (
          <>
            {loading && (
              <div className="progress-bar-wrap">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
                {loading ? <><Spinner /> Uploading...</> : "🚀 Upload & Tag"}
              </button>
              <button className="btn btn-secondary" onClick={() => { setFile(null); setResult(null); setError(""); }}>Clear</button>
            </div>
          </>
        )}

        {error && <div style={{ marginTop: "1rem" }}><Alert type="error">{error}</Alert></div>}

        {result && (
          <div style={{ marginTop: "1.5rem" }}>
            <Alert type="success">{result.message}</Alert>
            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="card-title">✅ Upload Result</div>
              <p style={{ fontSize: "0.85rem", color: "var(--mist)", marginBottom: "0.5rem" }}>File URL: <a href={result.fileUrl} style={{ color: "var(--sage)" }}>{result.fileUrl}</a></p>
              {result.thumbnailUrl && <p style={{ fontSize: "0.85rem", color: "var(--mist)", marginBottom: "0.75rem" }}>Thumbnail: <a href={result.thumbnailUrl} style={{ color: "var(--sage)" }}>{result.thumbnailUrl}</a></p>}
              <div>
                <span style={{ fontSize: "0.82rem", color: "var(--mist)", marginRight: "0.5rem" }}>Detected species:</span>
                <div className="tags-row">
                  {result.tags.map(t => <Tag key={t} label={t} />)}
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
    setLoading(true); setError(""); setResults([]);
    try {
      let res;
      if (activeQuery === "tags") {
        const obj = {};
        tagRows.forEach(r => { if (r.tag) obj[r.tag] = parseInt(r.count) || 1; });
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
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
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
        <h1>Search <span>Wildlife Files</span></h1>
        <p>Query your uploaded media using tags, species, URLs, or file content</p>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {queryTypes.map(q => (
            <button key={q.id} className={`btn ${activeQuery === q.id ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => { setActiveQuery(q.id); setResults([]); setError(""); }}>
              {q.label}
            </button>
          ))}
        </div>

        {activeQuery === "tags" && (
          <div>
            <div className="card-title">Search by tags with minimum counts</div>
            {tagRows.map((row, i) => (
              <div key={i} className="tag-input-row">
                <input className="form-input" placeholder="Species tag (e.g. koala)" value={row.tag} onChange={e => setTagRows(rows => rows.map((r, j) => j === i ? { ...r, tag: e.target.value } : r))} />
                <input className="form-input" type="number" min="1" placeholder="Min count" style={{ maxWidth: "110px" }} value={row.count} onChange={e => setTagRows(rows => rows.map((r, j) => j === i ? { ...r, count: e.target.value } : r))} />
                {tagRows.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => setTagRows(rows => rows.filter((_, j) => j !== i))}>✕</button>}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setTagRows(r => [...r, { tag: "", count: 1 }])}>+ Add tag</button>
          </div>
        )}

        {activeQuery === "species" && (
          <div className="form-group">
            <label className="form-label">Species name</label>
            <input className="form-input" placeholder="e.g. dingo, cassowary, koala" value={species} onChange={e => setSpecies(e.target.value)} />
          </div>
        )}

        {activeQuery === "thumbnail" && (
          <div className="form-group">
            <label className="form-label">Thumbnail URL</label>
            <input className="form-input" placeholder="https://s3.amazonaws.com/..." value={thumbUrl} onChange={e => setThumbUrl(e.target.value)} />
          </div>
        )}

        {activeQuery === "file" && (
          <div>
            <div className="dropzone" onClick={() => fileRef.current.click()} style={{ padding: "1.5rem" }}>
              <div className="dropzone-text">
                {queryFile ? <strong>{queryFile.name}</strong> : <><strong>Click to select</strong> a file to match against</>}
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={e => setQueryFile(e.target.files[0])} />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--mist)", marginTop: "0.5rem" }}>ℹ This file will NOT be stored in the database.</p>
          </div>
        )}

        <div style={{ marginTop: "1.25rem" }}>
          <button className="btn btn-primary" onClick={runQuery} disabled={loading}>
            {loading ? <><Spinner /> Searching...</> : "🔍 Search"}
          </button>
        </div>
      </div>

      {error && <div style={{ marginTop: "1rem" }}><Alert type="error">{error}</Alert></div>}

      {results.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="card-title">🗂 Results <span style={{ fontSize: "0.8rem", color: "var(--mist)", fontFamily: "DM Sans" }}>({results.length} found)</span></div>
          <div className="results-grid">
            {results.map((r, i) => (
              <div key={i} className="result-card" onClick={() => setModal(r)}>
                {r.thumbnailUrl
                  ? <img src={r.thumbnailUrl} alt="result" onError={e => e.target.style.display = "none"} />
                  : <div style={{ height: "110px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🎬</div>}
                <div className="result-card-info">
                  <div className="result-card-type">{r.type || "image"}</div>
                  <div className="tags-row">{(r.tags || []).slice(0, 2).map(t => <Tag key={t} label={t} />)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="empty-state"><div className="icon">🔭</div><p>Run a query to see results</p></div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <div className="card-title">Full Image</div>
            <img src={modal.fileUrl} alt="full size" onError={e => e.target.src = "https://via.placeholder.com/400x300?text=Image+Unavailable"} />
            <div className="tags-row">{(modal.tags || []).map(t => <Tag key={t} label={t} />)}</div>
            <p style={{ fontSize: "0.8rem", color: "var(--mist)", marginTop: "0.75rem", wordBreak: "break-all" }}>{modal.fileUrl}</p>
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
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
    if (!urlList.length || !tagList.length) { setError("Please provide at least one URL and one tag."); return; }
    setLoading(true); setError(""); setMsg(null);
    try {
      const res = await api.modifyTags(urlList, tagList, operation, token);
      setMsg(res.message);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Manage <span>Tags</span></h1>
        <p>Bulk add or remove species tags from your uploaded files</p>
      </div>
      <div className="card">
        <div className="form-group">
          <label className="form-label">File URLs (one per line)</label>
          <textarea className="form-input" rows={4} placeholder={"https://s3.amazonaws.com/ecolens/file1.jpg\nhttps://s3.amazonaws.com/ecolens/file2.jpg"} value={urls} onChange={e => setUrls(e.target.value)} style={{ resize: "vertical" }} />
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input className="form-input" placeholder="koala, wombat, magpie" value={tags} onChange={e => setTags(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Operation</label>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button className={`btn btn-sm ${operation === 1 ? "btn-primary" : "btn-secondary"}`} onClick={() => setOperation(1)}>➕ Add Tags</button>
            <button className={`btn btn-sm ${operation === 0 ? "btn-danger" : "btn-secondary"}`} onClick={() => setOperation(0)}>➖ Remove Tags</button>
          </div>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
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
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urlList.length) { setError("Please enter at least one URL."); return; }
    setLoading(true); setError(""); setMsg(null);
    try {
      const res = await api.deleteFiles(urlList, token);
      setMsg(res.message);
      setUrls("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Delete <span>Files</span></h1>
        <p>Permanently remove files and their thumbnails from storage and the database</p>
      </div>
      <div className="card">
        <Alert type="info">⚠ This action is irreversible. Files and thumbnails will be permanently deleted.</Alert>
        <div className="form-group">
          <label className="form-label">File URLs to delete (one per line)</label>
          <textarea className="form-input" rows={5} placeholder={"https://s3.amazonaws.com/ecolens/file1.jpg\nhttps://s3.amazonaws.com/ecolens/file2.jpg"} value={urls} onChange={e => setUrls(e.target.value)} style={{ resize: "vertical" }} />
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
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
    if (!email || !tag) { setError("Please enter both email and tag."); return; }
    setLoading(true); setError(""); setMsg(null);
    try {
      const res = await api.subscribeNotification(email, tag, token);
      setMsg(res.message);
      setTag("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tag <span>Notifications</span></h1>
        <p>Subscribe to email alerts when new files with specific species are uploaded</p>
      </div>
      <div className="card">
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Species Tag to Watch</label>
          <input className="form-input" placeholder="e.g. koala, wombat, dingo" value={tag} onChange={e => setTag(e.target.value)} />
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}
        <button className="btn btn-primary" onClick={handleSubscribe} disabled={loading}>
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
    await api.logout(accessToken);
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
        <style>{styles}</style>
        <div className="bg-pattern" />
        <div className="app">
          {authView === "login"
            ? <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setAuthView("signup")} />
            : <SignupPage onSignup={() => setAuthView("login")} onSwitchToLogin={() => setAuthView("login")} />}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="bg-pattern" />
      <div className="app">
        <nav className="nav">
          <div className="nav-brand">🌿 Aussie <span>EcoLens</span></div>
          <div className="nav-tabs">
            {pages.map(p => (
              <button key={p.id} className={`nav-tab${activePage === p.id ? " active" : ""}`} onClick={() => setActivePage(p.id)}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <div className="nav-user">
            <span>{user.firstName} {user.lastName}</span>
            <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </nav>
        <main className="main">
          {activePage === "upload" && <UploadPage token={token} />}
          {activePage === "query" && <QueryPage token={token} />}
          {activePage === "tags" && <TagsPage token={token} />}
          {activePage === "delete" && <DeletePage token={token} />}
          {activePage === "notifications" && <NotificationsPage token={token} user={user} />}
        </main>
      </div>
    </>
  );
}
