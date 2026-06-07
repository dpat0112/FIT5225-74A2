# EcoLens API Documentation

**Base URL:** `https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev`

---

## Endpoints

### 1. Find by Tags

Search for images that match one or more species/subject tags.

**`POST /query/find-by-tags`**

**Full URL:** `https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev/query/find-by-tags`

#### Request Body

Accepts either an object mapping tag names to counts, or an array of tag name strings.

**Option A — Object (tag → count map):**
```json
{
  "Canis_dingo": 3
}
```

**Option B — Array of tag names:**
```json
["Gymnorhina_tibicen", "Homo_sapiens"]
```

#### Response

```json
{
  "results": [
    {
      "id": "b9ef5887bfc153c603b8196abd8ba013",
      "thumbnail_url": "<presigned S3 URL>",
      "full_url": "<presigned S3 URL>",
      "file_type": "image/jpeg"
    }
  ]
}
```

| Field           | Type   | Description                                    |
| --------------- | ------ | ---------------------------------------------- |
| `id`            | string | MD5 checksum / unique identifier of the image  |
| `thumbnail_url` | string | Presigned S3 URL for the thumbnail version     |
| `full_url`      | string | Presigned S3 URL for the full-resolution image |
| `file_type`     | string | MIME type of the image (e.g. `image/jpeg`)     |

---

### 2. Get Full URL by Thumbnail

Retrieve the full-resolution presigned S3 URL for an image using its checksum.

**`POST /query/get-full-url-by-thumbnail`**

**Full URL:** `https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev/query/get-full-url-by-thumbnail`

#### Request Body

```json
{
  "checksum": "ea11640e3f30dd687faf310e6c96e236"
}
```

| Field      | Type   | Description             |
| ---------- | ------ | ----------------------- |
| `checksum` | string | MD5 checksum / image ID |

#### Response

```json
{
  "full_url": "<presigned S3 URL>"
}
```

| Field      | Type   | Description                                    |
| ---------- | ------ | ---------------------------------------------- |
| `full_url` | string | Presigned S3 URL for the full-resolution image |

---

### 3. Query by File

Submit an image file (as base64) to detect species/subject tags and retrieve similar images from the database.

**`POST /query/query-by-file`**

**Full URL:** `https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev/query/query-by-file`

#### Request Body

```json
{
  "file_data": "<base64-encoded image>"
}
```

| Field       | Type   | Description               |
| ----------- | ------ | ------------------------- |
| `file_data` | string | Base64-encoded image data |

#### Response

```json
{
  "detected_tags": {
    "Gymnorhina_tibicen": 1,
    "Homo_sapiens": 1
  },
  "results": [
    {
      "id": "ea11640e3f30dd687faf310e6c96e236",
      "thumbnail_url": "<presigned S3 URL>",
      "full_url": "<presigned S3 URL>",
      "file_type": "image/jpeg"
    }
  ]
}
```

| Field           | Type   | Description                                                        |
| --------------- | ------ | ------------------------------------------------------------------ |
| `detected_tags` | object | Map of detected tag names to their counts in the submitted image   |
| `results`       | array  | Matching images from the database (same structure as Find by Tags) |

---

### 4. Update Tags

Add or modify tags on one or more existing images.

**`PATCH /query/update-tags`**

**Full URL:** `https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev/query/update-tags`

#### Request Body

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

| Field       | Type             | Description                                     |
| ----------- | ---------------- | ----------------------------------------------- |
| `urls`      | array of strings | S3 URLs of the images to update                 |
| `tags`      | array of strings | Tags to apply                                   |
| `operation` | integer          | Tag operation to perform (e.g. `1` = add/merge) |

#### Response

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
    }
  ],
  "errors": []
}
```

| Field     | Type   | Description                                                           |
| --------- | ------ | --------------------------------------------------------------------- |
| `message` | string | Human-readable summary of the operation                               |
| `updated` | array  | Each updated image with its `id`, `url`, and resulting `new_tags` map |
| `errors`  | array  | Any errors encountered during the operation                           |

---

### 5. Delete Files

Permanently delete one or more images from the system.

**`DELETE /`**

**Full URL:** `https://rygkjf1m8i.execute-api.us-east-1.amazonaws.com/dev/`

#### Request Body

```json
{
  "urls": [
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/38c94a690b045ae950b79a050393d678.jpg",
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/5684653b49f29240c94cbf3e6348993b.jpg",
    "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/724716bfba1220959e751e097d7f7894.jpg"
  ]
}
```

| Field  | Type             | Description                     |
| ------ | ---------------- | ------------------------------- |
| `urls` | array of strings | S3 URLs of the images to delete |

#### Response

```json
{
  "message": "Successfully deleted 3 files.",
  "deleted": [
    {
      "id": "38c94a690b045ae950b79a050393d678",
      "url": "https://ecolens-team74-bucket.s3.amazonaws.com/uploads/38c94a690b045ae950b79a050393d678.jpg"
    }
  ],
  "errors": []
}
```

| Field     | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| `message` | string | Human-readable summary of the operation     |
| `deleted` | array  | Each deleted image with its `id` and `url`  |
| `errors`  | array  | Any errors encountered during the operation |

---

## Notes

- **Presigned URLs** returned by the API are temporary and will expire. Do not store or cache them long-term.
- **Image IDs** are MD5 checksums of the original file and are used consistently across all endpoints.
- **Tags** follow binomial nomenclature (e.g. `Homo_sapiens`, `Gymnorhina_tibicen`) but arbitrary strings like `"peacock"` are also accepted.