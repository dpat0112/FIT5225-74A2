import { API_BASE } from "../config";
import { calculateFileMD5 } from "../utils/md5";

// Helper: standardized fetch with Auth header
async function authorizedFetch(endpoint, options = {}, token) {
  // 1. Strict Existence Check
  const idToken = localStorage.getItem("ecolens_id_token");
  const accessToken = localStorage.getItem("ecolens_access_token");

  if (!token || !idToken || !accessToken) {
    const error = new Error("No active session. Please log in.");
    error.isAuthError = true;
    throw error;
  }

  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();

