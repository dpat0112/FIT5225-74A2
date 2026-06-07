import { useState } from "react";
import { modifyTags } from "../../repository/mediaApi";
import { Alert, Spinner } from "../../components/ui";

export default function TagsPage({ token }) {
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
      const res = await modifyTags(urlList, tagList, operation, token);
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
              type="button"
              className={`btn btn-sm ${operation === 1 ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setOperation(1)}
            >
              ➕ Add Tags
            </button>
            <button
              type="button"
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
