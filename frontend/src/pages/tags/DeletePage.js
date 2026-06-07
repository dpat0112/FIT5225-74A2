import { useState } from "react";
import { deleteFiles } from "../../repository/mediaApi";
import { Alert, Spinner } from "../../components/ui";

export default function DeletePage({ token }) {
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
      const res = await deleteFiles(urlList, token);
      setMsg(res.message || "Files deleted successfully.");
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
