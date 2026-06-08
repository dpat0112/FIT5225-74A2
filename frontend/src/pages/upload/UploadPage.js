import { useRef, useState } from "react";
import { uploadFile } from "../../repository/mediaApi";
import { Alert, Spinner, Tag } from "../../components/ui";

export default function UploadPage({ token, onAuthError }) {
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
      const res = await uploadFile(file, token);
      setProgress(100);
      setResult(res);
    } catch (err) {
      if (err.isAuthError) {
        onAuthError();
        return;
      }
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
          Securely upload your wildlife observations to our cloud storage
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
                  "🚀 Upload to S3"
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
              <div>
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--mist)",
                    marginRight: "0.5rem",
                  }}
                >
                  S3 Key:
                </span>
                <div className="tags-row">
                  <span style={{ fontSize: "0.85rem", color: "var(--sage)" }}>
                    {result.s3Key}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
