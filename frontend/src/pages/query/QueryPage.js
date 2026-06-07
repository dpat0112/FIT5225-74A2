import { useRef, useState } from "react";
import {
  queryByFile,
  queryBySpecies,
  queryByTags,
  queryByThumbnailUrl,
} from "../../repository/mediaApi";
import { Alert, Spinner, Tag } from "../../components/ui";

export default function QueryPage({
  token,
  activeQueryTab,
  setActiveQueryTab,
  resultsByTab,
  setResultsByTab,
  errorsByTab,
  setErrorsByTab,
  tagRows,
  setTagRows,
  species,
  setSpecies,
  thumbUrl,
  setThumbUrl,
  queryFile,
  setQueryFile,
  detectedTags,
  setDetectedTags,
  availableTags,
  tagsLoading,
  onRefreshTags,
}) {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null); // URL of the item currently copied
  const fileRef = useRef();

  function copyToClipboard(url, e) {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus(url);
      setTimeout(() => setCopyStatus(null), 1500);
    });
  }

  async function runQuery() {
    setLoading(true);
    setErrorsByTab((prev) => ({ ...prev, [activeQueryTab]: "" }));
    if (activeQueryTab !== "file") setDetectedTags(null);
    try {
      let res;
      if (activeQueryTab === "tags") {
        const obj = {};
        tagRows.forEach((r) => {
          const tag = (r.tag || "").trim();
          if (tag) obj[tag] = parseInt(r.count) || 1;
        });
        res = await queryByTags(obj, token);
      } else if (activeQueryTab === "species") {
        res = await queryBySpecies(species.trim(), token);
      } else if (activeQueryTab === "thumbnail") {
        res = await queryByThumbnailUrl(thumbUrl, token);
        res = [res];
      } else if (activeQueryTab === "file") {
        const fileRes = await queryByFile(queryFile, token);
        res = fileRes.results;
        setDetectedTags(fileRes.detectedTags);
      }
      setResultsByTab((prev) => ({ ...prev, [activeQueryTab]: res || [] }));
    } catch (err) {
      setErrorsByTab((prev) => ({ ...prev, [activeQueryTab]: err.message }));
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

  const currentResults = resultsByTab[activeQueryTab] || [];
  const currentError = errorsByTab[activeQueryTab] || "";

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
              className={`btn ${activeQueryTab === q.id ? "btn-primary" : "btn-secondary"} btn-sm`}
              onClick={() => setActiveQueryTab(q.id)}
            >
              {q.label}
            </button>
          ))}
        </div>

        {activeQueryTab === "tags" && (
          <div>
            <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Search by tags with minimum counts</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onRefreshTags}
                disabled={tagsLoading}
                style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
              >
                {tagsLoading ? <Spinner /> : "🔄 Refresh Tags"}
              </button>
            </div>
            {tagRows.map((row, i) => (
              <div key={i} className="tag-input-row">
                <input
                  className="form-input"
                  placeholder="Species tag (e.g. koala)"
                  list="available-tags"
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

        {activeQueryTab === "species" && (
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label className="form-label" style={{ margin: 0 }}>Species name</label>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onRefreshTags}
                disabled={tagsLoading}
                style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
              >
                {tagsLoading ? <Spinner /> : "🔄 Refresh Tags"}
              </button>
            </div>
            <input
              className="form-input"
              placeholder="e.g. dingo, cassowary, koala"
              list="available-tags"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            />
          </div>
        )}

        <datalist id="available-tags">
          {(availableTags || []).map(tag => (
            <option key={tag} value={tag} />
          ))}
        </datalist>

        {activeQueryTab === "thumbnail" && (
          <div className="form-group">
            <label className="form-label">Thumbnail URL</label>
            <input
              className="form-input"
              placeholder="Paste thumbnail URL or ID..."
              value={thumbUrl}
              onChange={(e) => setThumbUrl(e.target.value)}
            />
          </div>
        )}

        {activeQueryTab === "file" && (
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

      {currentError && (
        <div style={{ marginTop: "1rem" }}>
          <Alert type="error">{currentError}</Alert>
        </div>
      )}

      {currentResults.length > 0 && (
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
              ({currentResults.length} found)
            </span>
          </div>
          {activeQueryTab === "file" && detectedTags && Object.keys(detectedTags).length > 0 && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(122,171,110,0.1)", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--sage)", fontWeight: "600", marginBottom: "0.5rem" }}>
                🔍 Detected in your file:
              </div>
              <div className="tags-row">
                {Object.entries(detectedTags).map(([tag, count]) => (
                  <Tag key={tag} label={`${tag} (${count})`} />
                ))}
              </div>
            </div>
          )}
          <div className="results-grid">
            {currentResults.map((r, i) => (
              <div
                key={i}
                className="result-card"
                onClick={() => {
                  setModal(r);
                  setModalLoading(true);
                }}
              >
                <button
                  className="copy-btn"
                  onClick={(e) =>
                    copyToClipboard(r.thumbnailUrl || r.fileUrl, e)
                  }
                  title="Copy Thumbnail URL"
                >
                  {copyStatus === (r.thumbnailUrl || r.fileUrl) ? "✅" : "📋"}
                </button>
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

      {currentResults.length === 0 && !loading && !currentError && (
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
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>
                Full Image
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => copyToClipboard(modal.fileUrl)}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              >
                {copyStatus === modal.fileUrl ? "✅ Copied" : "📋 Copy Full URL"}
              </button>
            </div>
            <div
              style={{
                position: "relative",
                minHeight: "200px",
                marginBottom: "1rem",
              }}
            >
              {modalLoading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(26,46,26,0.3)",
                    zIndex: 2,
                    borderRadius: "10px",
                  }}
                >
                  <Spinner />
                </div>
              )}
              <img
                src={modal.fileUrl}
                alt="full size"
                onLoad={() => setModalLoading(false)}
                onError={(e) => {
                  setModalLoading(false);
                  e.target.src =
                    "https://via.placeholder.com/400x300?text=Image+Unavailable";
                }}
                style={{
                  opacity: modalLoading ? 0.3 : 1,
                  transition: "opacity 0.3s",
                }}
              />
            </div>
            <div className="tags-row">
              {(modal.tags || []).map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
            <div className="modal-url-box">
              {modal.fileUrl}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
