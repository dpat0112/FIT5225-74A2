import { mockDelay, API_BASE } from "../config";
import { calculateFileMD5 } from "../utils/md5";

// Helper: standardized fetch with Auth header
async function authorizedFetch(endpoint, options = {}, token) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || data.message || "API request failed");
  return data;
}

export async function uploadFile(file, token) {
  try {
    const checksum = await calculateFileMD5(file);

    // 1. Check for duplicates and get pre-signed UR
    // Special case for the specific URL provided by the user
    const checkUrl =
      "https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev/file-upload/check-duplicate";
    const checkRes = await fetch(checkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        checksum: checksum,
        fileName: file.name,
      }),
    });

    const data = await checkRes.json();

    if (!checkRes.ok) {
      // Handle "Duplicate file detected" or other errors
      throw new Error(data.error || data.message || "Duplicate file detected.");
    }

    // 2. Upload to S3 using the pre-signed URL (No Bearer token for S3 itself)
    const uploadRes = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("S3 Upload failed. Please try again.");
    }

    return {
      fileUrl: data.uploadUrl.split("?")[0],
      thumbnailUrl: null, // No thumbnail yet as tagging/processing is separate
      tags: [], // No tagging in this step as per user
      message: data.message || "File uploaded successfully!",
      s3Key: data.s3Key,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export async function queryByTags(tagsObj, token) {
  // Use authorizedFetch when real endpoint is ready
  // return await authorizedFetch("/query", { method: "POST", body: JSON.stringify(tagsObj) }, token);

  await mockDelay();
  return [
    {
      fileUrl: "https://via.placeholder.com/400x300?text=Koala+Photo",
      thumbnailUrl: "https://via.placeholder.com/150?text=Koala",
      tags: ["koala", "eucalyptus"],
      type: "image",
    },
    {
      fileUrl: "https://via.placeholder.com/400x300?text=Wombat+Video",
      thumbnailUrl: null,
      tags: ["wombat"],
      type: "video",
    },
  ];
}

export async function queryBySpecies(species, token) {
  await mockDelay();
  return [
    {
      fileUrl: "https://via.placeholder.com/400x300?text=Species+Result",
      thumbnailUrl: "https://via.placeholder.com/150?text=Result",
      tags: [species],
      type: "image",
    },
  ];
}

export async function queryByThumbnailUrl(thumbUrl, token) {
  await mockDelay();
  return {
    fileUrl: "https://via.placeholder.com/800x600?text=Full+Image",
    tags: ["dingo", "sand"],
  };
}

export async function queryByFile(file, token) {
  await mockDelay(1200);
  return [
    {
      fileUrl: "https://via.placeholder.com/400x300?text=Similar+File",
      thumbnailUrl: "https://via.placeholder.com/150?text=Similar",
      tags: ["cassowary"],
      type: "image",
    },
  ];
}

export async function modifyTags(urls, tags, operation, token) {
  // operation: 1 = add, 0 = remove
  await mockDelay();
  return {
    success: true,
    message: `Tags ${operation === 1 ? "added" : "removed"} successfully on ${urls.length} file(s).`,
  };
}

export async function deleteFiles(urls, token) {
  await mockDelay();
  return {
    success: true,
    message: `${urls.length} file(s) deleted successfully.`,
  };
}

export async function subscribeNotification(email, tag, token) {
  await mockDelay();
  return {
    success: true,
    message: `Subscribed to notifications for "${tag}"`,
  };
}
