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

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const error = new Error("Token expired");
        error.isAuthError = true;
        throw error;
      }
      throw new Error(
        data.error ||
          data.message ||
          "API request failed"
      );
    }

    return data;
  } catch (e) {
    // 2. Network Error Handling
    if (e.message === "Failed to fetch" || e.name === "TypeError") {
      e.isAuthError = true; // Treat as session risk during validation
    }
    throw e;
  }
}

export async function validateToken(token) {
  // GET / is fastest to check token validity
  return await authorizedFetch("/", { method: "GET" }, token);
}

export async function uploadFile(file, token) {
  try {
    const checksum = await calculateFileMD5(file);

    // 1. Check for duplicates and get pre-signed URL
    const data = await authorizedFetch("/file-upload/check-duplicate", {
      method: "POST",
      body: JSON.stringify({
        checksum,
        fileName: file.name,
        fileType: file.type,
      }),
    }, token);

    // 2. Upload to S3 using the pre-signed URL (No Bearer token for S3 itself)
    const uploadRes = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(
        "S3 Upload failed. Please try again."
      );
    }

    return {
      fileUrl: data.uploadUrl.split("?")[0],
      thumbnailUrl: null,
      tags: [],
      message:
        data.message ||
        "File uploaded successfully!",
      s3Key: data.s3Key,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export async function queryByTags(tagsObj, token) {
  const data = await authorizedFetch(
    "/query/find-by-tags",
    {
      method: "POST",
      body: JSON.stringify(tagsObj),
    },
    token
  );

  return (data.results || []).map((item) => ({
    id: item.id,
    fileUrl: item.full_url,
    thumbnailUrl: item.thumbnail_url,
    tags: [],
    type: item.file_type?.startsWith("video")
      ? "video"
      : "image",
  }));
}

export async function queryBySpecies(species, token) {
  const data = await authorizedFetch(
    "/query/find-by-tags",
    {
      method: "POST",
      body: JSON.stringify([species]),
    },
    token
  );

  return (data.results || []).map((item) => ({
    id: item.id,
    fileUrl: item.full_url,
    thumbnailUrl: item.thumbnail_url,
    tags: [species],
    type: item.file_type?.startsWith("video")
      ? "video"
      : "image",
  }));
}

export async function queryByThumbnailUrl(input, token) {
  // Extract 32-character hex checksum from URL or use as-is if already a checksum
  const regex = /([a-f0-9]{32})/i;
  const match = input.match(regex);
  const checksum = match ? match[1] : input;

  const data = await authorizedFetch(
    "/query/get-full-url-by-thumbnail",
    {
      method: "POST",
      body: JSON.stringify({
        checksum,
      }),
    },
    token
  );

  return {
    fileUrl: data.full_url,
    tags: [],
  };
}

export async function queryByFile(file, token) {
  const base64 = await new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result.split(",")[1]);
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    }
  );
  const data = await authorizedFetch(
    "/query/query-by-file",
    {
      method: "POST",
      body: JSON.stringify({
        file_data: base64,
      }),
    },
    token
  );

  const results = (data.results || []).map((item) => ({
    id: item.id,
    fileUrl: item.full_url,
    thumbnailUrl: item.thumbnail_url,
    tags: [], // Tags for individual results aren't provided here per doc, or we could use detected_tags?
    type: item.file_type?.startsWith("video")
      ? "video"
      : "image",
  }));

  return {
    results,
    detectedTags: data.detected_tags || {}
  };
}

export async function modifyTags(
  urls,
  tags,
  operation,
  token
) {
  return await authorizedFetch(
    "/query/update-tags",
    {
      method: "PATCH",
      body: JSON.stringify({
        urls,
        tags,
        operation,
      }),
    },
    token
  );
}

export async function deleteFiles(
  urls,
  token
) {
  return await authorizedFetch(
    "",
    {
      method: "DELETE",
      body: JSON.stringify({
        urls,
      }),
    },
    token
  );
}

export async function getAvailableTags(token) {
  const data = await authorizedFetch("/", { method: "GET" }, token);
  return data.species || [];
}

export async function subscribeNotification(
  email,
  speciesTags,
  token
) {
  const url = "https://ecolens-ml-service-567231773270.australia-southeast2.run.app/subscribe";
  try {
    const res = await fetch(url, {
      method: "POST",
      mode: "cors", // Explicitly set CORS mode
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        species_tags: speciesTags,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Subscription failed with status: ${res.status}`);
    }
    return data;
  } catch (e) {
    console.error("Full Subscription Error Detail:", e);
    // Provide a more descriptive error for the user to see in the UI
    const customError = new Error(`Connection Error: ${e.message}. Please check if the ML service URL is reachable and CORS is enabled.`);
    customError.originalError = e;
    throw customError;
  }
}
