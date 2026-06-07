import { useRef, useState } from "react";
import {
  queryByFile,
  queryBySpecies,
  queryByTags,
  queryByThumbnailUrl,
} from "../../repository/mediaApi";
import { Alert, Spinner, Tag } from "../../components/ui";

export default function QueryPage({ token }) {
  const [activeQuery, setActiveQuery] = useState("tags");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

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
        res = await queryByTags(obj, token);
      } else if (activeQuery === "species") {
        res = await queryBySpecies(species, token);
      } else if (activeQuery === "thumbnail") {
        res = await queryByThumbnailUrl(thumbUrl, token);
        res = [res];
      } else if (activeQuery === "file") {
        res = await queryByFile(queryFile, token);
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
