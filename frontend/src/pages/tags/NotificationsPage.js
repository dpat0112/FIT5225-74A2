import { useState } from "react";
import { subscribeNotification } from "../../repository/mediaApi";
import { Alert, Spinner, Tag } from "../../components/ui";

export default function NotificationsPage({
  token,
  user,
  availableTags,
  onAuthError,
}) {
  const [selectedExistingTags, setSelectedExistingTags] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");

  const email = user?.email || "";

  function toggleExistingTag(tag) {
    if (selectedExistingTags.includes(tag)) {
      setSelectedExistingTags(selectedExistingTags.filter((t) => t !== tag));
    } else {
      setSelectedExistingTags([...selectedExistingTags, tag]);
    }
  }

  function addCustomTag() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (availableTags.includes(trimmed)) {
      // If user types an existing tag, just select it in existing section
      if (!selectedExistingTags.includes(trimmed)) {
        setSelectedExistingTags([...selectedExistingTags, trimmed]);
      }
      setCustomInput("");
      return;
    }
    if (!customTags.includes(trimmed)) {
      setCustomTags([...customTags, trimmed]);
    }
    setCustomInput("");
  }

  function removeCustomTag(tag) {
    setCustomTags(customTags.filter((t) => t !== tag));
  }

  async function handleSubscribe() {
    const allTags = [...selectedExistingTags, ...customTags];
    if (!allTags.length) {
      setError("Please select or enter at least one species tag.");
      return;
    }
    setLoading(true);
    setError("");
    setMsg(null);
    try {
      const res = await subscribeNotification(email, allTags, token);
      setMsg(res.message);
      setSelectedExistingTags([]);
      setCustomTags([]);
    } catch (err) {
      if (err.isAuthError) {
        onAuthError();
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Alert <span>Notifications</span>
        </h1>
        <p>
          Receive email alerts when specific wildlife species are discovered
        </p>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="form-input" style={{ opacity: 0.7, background: "rgba(122,171,110,0.05)" }}>
            {email}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--mist)", marginTop: "0.4rem" }}>
            Alerts will be sent to your student email address.
          </p>
        </div>

        <div className="divider" style={{ margin: "2rem 0" }} />

        <div className="form-group">
          <div className="card-title">🏷 Existing Database Species</div>
          <p style={{ fontSize: "0.85rem", color: "var(--mist)", marginBottom: "1rem" }}>
            Click tags below to subscribe to species already found in our records.
          </p>
          <div
            className="card"
            style={{
              background: "rgba(26,46,26,0.4)",
              padding: "1rem",
              maxHeight: "200px",
              overflowY: "auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem"
            }}
          >
            {(availableTags || []).length > 0 ? (
              availableTags.map(tag => (
                <div
                  key={tag}
                  onClick={() => toggleExistingTag(tag)}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: selectedExistingTags.includes(tag) ? 1 : 0.5,
                    transform: selectedExistingTags.includes(tag) ? "scale(1.05)" : "scale(1)"
                  }}
                >
                  <Tag
                    label={tag}
                    type={selectedExistingTags.includes(tag) ? "green" : "amber"}
                  />
                </div>
              ))
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--mist)" }}>No existing tags found in database.</p>
            )}
          </div>
        </div>

        <div className="divider" style={{ margin: "2rem 0" }} />

        <div className="form-group">
          <div className="card-title">⌨ Add Custom Species</div>
          <p style={{ fontSize: "0.85rem", color: "var(--mist)", marginBottom: "1rem" }}>
            Subscribe to species that haven't been detected yet.
          </p>
          <div className="tag-input-row">
            <input
              className="form-input"
              placeholder="Type species name (e.g. Macropus_giganteus)"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
            />
            <button className="btn btn-secondary btn-sm" onClick={addCustomTag}>
              + Add
            </button>
          </div>

          {customTags.length > 0 && (
            <div className="tags-row" style={{ marginTop: "1rem" }}>
              {customTags.map(tag => (
                <div key={tag} onClick={() => removeCustomTag(tag)} style={{ cursor: "pointer" }}>
                  <Tag label={`${tag} ✕`} type="amber" />
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}

        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--glass)", paddingTop: "1.5rem" }}>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleSubscribe}
            disabled={loading || (selectedExistingTags.length === 0 && customTags.length === 0)}
          >
            {loading ? <Spinner /> : `🔔 Subscribe to ${selectedExistingTags.length + customTags.length} species total`}
          </button>
        </div>
      </div>
    </div>
  );
}
