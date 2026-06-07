import { useState } from "react";
import { subscribeNotification } from "../../repository/mediaApi";
import { Alert, Spinner } from "../../components/ui";

export default function NotificationsPage({ token, user }) {
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
      const res = await subscribeNotification(email, tag, token);
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
