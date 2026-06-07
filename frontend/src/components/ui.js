import React from "react";

export function Alert({ type = "info", children }) {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className={`alert alert-${type}`}>
      <span>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" />;
}

export function Tag({ label, variant = "green" }) {
  return <span className={`tag tag-${variant}`}>{label}</span>;
}
