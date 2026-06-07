import { API_BASE } from "../config";
import { calculateFileMD5 } from "../utils/md5";

// Helper: standardized fetch with Auth header
async function authorizedFetch(endpoint, options = {}, token) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error ||
        data.message ||
        "API request failed"
    );
  }

  return data;
}

export async function uploadFile(file, token) {
  try {
    const checksum = await calculateFileMD5(file);

    const checkUrl =
      "https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev/file-upload/check-duplicate";

    const checkRes = await fetch(checkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        checksum,
        fileName: file.name,
      }),
    });

    const data = await checkRes.json();

    if (!checkRes.ok) {
      throw new Error(
        data.error ||
          data.message ||
          "Duplicate file detected."
      );
    }

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

export async function subscribeNotification(
  email,
  tag,
  token
) {
  return {
    success: true,
    message:
      "Notification endpoint not implemented in backend.",
  };
}