Here is a structured Markdown documentation file for your API endpoints. You can copy and paste this directly into a `.md` file (like `README.md` or `API_DOCS.md`) in your repository.

---

# API Documentation

**Base URL:** `https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev`

All API endpoints expect requests to have the `Content-Type: application/json` header.

## Table of Contents

1. [Find by Tags](https://www.google.com/search?q=%231-find-by-tags)
2. [Get Full URL by Thumbnail](https://www.google.com/search?q=%232-get-full-url-by-thumbnail)
3. [Query by File](https://www.google.com/search?q=%233-query-by-file)
4. [Update Tags (Bulk)](https://www.google.com/search?q=%234-update-tags-bulk)
5. [Delete Files](https://www.google.com/search?q=%235-delete-files)

---

### 1. Find by Tags

Searches the database for media files that match specific species tags. This endpoint accepts either explicit minimum counts or a simple array of species names.

* **Method:** `POST`
* **Endpoint:** `/query/find-by-tags`

**Request Body (Option A: Explicit Counts):**

```json
{
  "Canis_dingo": 3
}

```

**Request Body (Option B: Simple Array):**

```json
[
  "Gymnorhina_tibicen",
  "Homo_sapiens"
]

```

**Response (200 OK):**

```json
{
    "results": [
        {
            "id": "b9ef5887bfc153c603b8196abd8ba013",
            "thumbnail_url": "https://ecolens-thumbnails-74-bucket.s3.amazonaws.com/thumbnails/b9ef5887bfc153c603b8196abd8ba013.jpg?AWSAccessKeyId=...&Signature=...&Expires=1780833816",
            "full_url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/b9ef5887bfc153c603b8196abd8ba013.jpg?AWSAccessKeyId=...&Signature=...&Expires=1780833816",
            "file_type": "image/jpeg"
        }
    ]
}

```

---

### 2. Get Full URL by Thumbnail

Fetches a secure, Pre-Signed URL for a high-resolution image using the file's unique checksum identifier.

* **Method:** `POST`
* **Endpoint:** `/query/get-full-url-by-thumbnail`

**Request Body:**

```json
{
  "checksum": "ea11640e3f30dd687faf310e6c96e236"
}

```

**Response (200 OK):**

```json
{
    "full_url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/ea11640e3f30dd687faf310e6c96e236.jpg?AWSAccessKeyId=...&Signature=...&Expires=1780840529"
}

```

---

### 3. Query by File

Accepts a Base64 encoded image, passes it to the ML service to detect species, and returns both the detected tags and matching files from the database that contain those same species.

* **Method:** `POST`
* **Endpoint:** `/query/query-by-file`

**Request Body:**

```json
{
  "file_data": "BASE64 OF image"
}

```

**Response (200 OK):**

```json
{
    "detected_tags": {
        "Gymnorhina_tibicen": 1,
        "Homo_sapiens": 1
    },
    "results": [
        {
            "id": "ea11640e3f30dd687faf310e6c96e236",
            "thumbnail_url": "https://ecolens-thumbnails-74-bucket.s3.amazonaws.com/thumbnails/ea11640e3f30dd687faf310e6c96e236.jpg?AWSAccessKeyId=...&Signature=...&Expires=1780842448",
            "full_url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/ea11640e3f30dd687faf310e6c96e236.jpg?AWSAccessKeyId=...&Signature=...&Expires=1780842448",
            "file_type": "image/jpeg"
        }
    ]
}

```

---

### 4. Update Tags (Bulk)

Allows end-users to manually add or remove tags from multiple files simultaneously using their URLs.

* `operation: 1` = Add tags
* `operation: 0` = Remove tags
* **Method:** `PATCH`
* **Endpoint:** `/query/update-tags`

**Request Body:**

```json
{
  "urls": [
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/ea11640e3f30dd687faf310e6c96e236.jpg",
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/f026d4316f33abe83726e12b4c70f763.jpg"
  ],
  "tags": ["peacock", "Homo_sapiens"],
  "operation": 1
}

```

**Response (200 OK):**

```json
{
    "message": "Successfully updated tags for 2 files.",
    "updated": [
        {
            "id": "ea11640e3f30dd687faf310e6c96e236",
            "url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/ea11640e3f30dd687faf310e6c96e236.jpg",
            "new_tags": {
                "Gymnorhina_tibicen": 1,
                "Human": 1,
                "peacock": 1,
                "Homo_sapiens": 1
            }
        },
        {
            "id": "f026d4316f33abe83726e12b4c70f763",
            "url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/f026d4316f33abe83726e12b4c70f763.jpg",
            "new_tags": {
                "Uromys_caudimaculatus": 1,
                "peacock": 1,
                "Homo_sapiens": 1
            }
        }
    ],
    "errors": []
}

```

---

### 5. Delete Files

Completely removes specified media files and their thumbnails from S3 storage, and clears their associated metadata records from the Firestore database.

* **Method:** `DELETE`
* **Endpoint:** `/` *(Note: Target is the base execution path)*

**Request Body:**

```json
{
  "urls": [
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/38c94a690b045ae950b79a050393d678.jpg",
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/5684653b49f29240c94cbf3e6348993b.jpg",
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/724716bfba1220959e751e097d7f7894.jpg"
  ]
}

```

**Response (200 OK):**

```json
{
    "message": "Successfully deleted 3 files.",
    "deleted": [
        {
            "id": "38c94a690b045ae950b79a050393d678",
            "url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/38c94a690b045ae950b79a050393d678.jpg"
        },
        {
            "id": "5684653b49f29240c94cbf3e6348993b",
            "url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/5684653b49f29240c94cbf3e6348993b.jpg"
        },
        {
            "id": "724716bfba1220959e751e097d7f7894",
            "url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/724716bfba1220959e751e097d7f7894.jpg"
        }
    ],
    "errors": []
}

```