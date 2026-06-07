import { useState } from "react";
import {
  confirmSignUp,
  resendConfirmationCode,
  signup,
} from "../../repository/auth";
import { Alert, Spinner } from "../../components/ui";

export default function SignupPage({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [verificationStep, setVerificationStep] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg(null);
    try {
      const result = await signup(
        form.email,
        form.password,
        form.firstName,
        form.lastName,
      );
      setMsg(result.message || "Verification code sent to your email.");
      setVerificationStep(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setVerifying(true);
    setError("");
    try {
      await confirmSignUp(form.email, code);
      setMsg("Account verified — you can now sign in.");
      setVerificationStep(false);
      onSwitchToLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setError("");
    try {
      const res = await resendConfirmationCode(form.email);
      setMsg(res.message || "Verification code resent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>
            Aussie <span>EcoLens</span>
          </h1>
          <p>Create your account</p>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}

        {!verificationStep ? (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  className="form-input"
                  placeholder="Jane"
                  value={form.firstName}
                  onChange={update("firstName")}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  className="form-input"
                  placeholder="Smith"
                  value={form.lastName}
                  onChange={update("lastName")}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={update("password")}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPassword((value) => !value)}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? <Spinner /> : "Create Account"}
            </button>
          </form>
        ) : (
          <div>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={verifying}
              >
                {verifying ? <Spinner /> : "Verify Account"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? <Spinner /> : "Resend Code"}
              </button>
            </div>
          </div>
        )}

        <div className="auth-switch" style={{ marginTop: "1rem" }}>
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
