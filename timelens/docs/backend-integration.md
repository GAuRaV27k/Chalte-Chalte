# TimeLens AI — Backend Integration Guide & API Specification

This document outlines the architecture, data contracts, job lifecycle, error handling, and transition pathway from frontend simulation to a production inference backend for **TimeLens AI**.

---

## 1. Architectural Overview

TimeLens AI reconstructs historical landscapes from modern terrestrial photographs using latent diffusion models (e.g., Llama-Vision + Stable Video Diffusion / ComfyUI pipeline).

### Core Separation of Concerns
- **Frontend UI (`src/`):** React 19 + TypeScript + Motion, managing user uploads, validation, geodetic context, era calibration, and interactive comparative playback.
- **API Client Layer (`src/services/api.ts`):** Decoupled, typed HTTP client talking to the inference server over standard REST endpoints.
- **Isolated Simulation Service (`src/services/mockApi.ts`):** Development demo service providing mocked transitions and sample data without disguising mock results as verified AI outputs.

---

## 2. Environment Configuration

The frontend dynamically points to the backend using `VITE_API_BASE_URL`:

```bash
# In .env or production environment
VITE_API_BASE_URL=https://api.timelens.ai
```

If `VITE_API_BASE_URL` is unset or empty, the frontend runs in **Simulated Demo Mode**, clearly labeled in the user interface.

---

## 3. Proposed REST API Contract

### 3.1. Submit Generation Job

- **Method:** `POST`
- **Path:** `/api/v1/generations`
- **Content-Type:** `multipart/form-data`

#### Request Parameters
| Field Name | Type | Required | Description |
|---|---|---|---|
| `landscape_image` | File (`image/jpeg`, `image/png`, `image/tiff`, `image/webp`) | **Yes** | Source landscape plate (up to 64MB). |
| `selfie_image` | File (`image/jpeg`, `image/png`, `image/webp`) | Optional | Portrait for historical traveler composite. |
| `era_id` | String | **Yes** | Identifier of historical era (e.g., `pleistocene`, `carboniferous`, `cretaceous`, `indigenous-old-growth`, `early-anthropocene`, `custom`). |
| `custom_year` | String | Optional | Target year numerical string (e.g. `-18000`). |
| `year_suffix` | String (`BCE` \| `CE`) | Optional | Chronological epoch suffix. |
| `reconstruction_mode` | String (`reconstruct` \| `imagine`) | **Yes** | `reconstruct` enforces empirical paleobotanical constraints; `imagine` enables speculative paleo-ecological drift. |
| `location` | String | **Yes** | Geodetic or textual location (e.g., `Olympic National Park, Hoh Rain Forest, WA`). |
| `attire_mode` | String (`period` \| `silhouette` \| `modern`) | Optional | Traveler costume adaptation style. |

#### Successful Response (`202 Accepted` or `201 Created`)
```json
{
  "job_id": "gen_8849204_pleistocene",
  "status": "queued",
  "progress_percent": 0,
  "message": "Job queued for diffusion synthesis",
  "created_at": "2026-10-10T18:30:00Z",
  "estimated_seconds_remaining": 15
}
```

---

### 3.2. Poll Generation Job Status

- **Method:** `GET`
- **Path:** `/api/v1/generations/{job_id}`
- **Accept:** `application/json`

#### In-Progress Response (`200 OK`)
```json
{
  "job_id": "gen_8849204_pleistocene",
  "status": "processing",
  "progress_percent": 68,
  "message": "Running SVD temporal diffusion with botanical priors (Step 24/35)",
  "created_at": "2026-10-10T18:30:00Z"
}
```

#### Completed Response (`200 OK`)
```json
{
  "job_id": "gen_8849204_pleistocene",
  "status": "completed",
  "progress_percent": 100,
  "message": "Synthesis complete",
  "created_at": "2026-10-10T18:30:00Z",
  "completed_at": "2026-10-10T18:30:14Z",
  "result": {
    "reconstructed_image_url": "https://storage.timelens.ai/renders/gen_8849204/reconstruction_4k.webp",
    "cinematic_video_url": "https://storage.timelens.ai/renders/gen_8849204/drone_drift_4k.mp4",
    "original_image_url": "https://storage.timelens.ai/uploads/gen_8849204/source.webp",
    "comparison_metadata": {
      "era_name": "Pleistocene Glacial Epoch",
      "year_label": "18,000 BCE",
      "location_name": "Olympic National Park, Hoh Rain Forest, WA",
      "coordinates": "47.8601° N, 123.9348° W",
      "mode": "reconstruct",
      "traveler_included": true
    },
    "paleoclimate_metrics": {
      "mean_annual_temp": "-6.2°C",
      "temp_delta": "-17.6°C vs contemporary baseline",
      "ice_margin_proximity": "14.8 km",
      "ice_margin_status": "Cordilleran advance phase",
      "dominant_taxa": "Picea glauca (White spruce), Betula nana, Artemisia steppe",
      "soil_core_profile": "Permafrost cryosol with solifluction banding",
      "atmospheric_optics": "High-latitude ice-crystal refraction, low cold fog",
      "glaciology_offset": "Cordilleran Ice Sheet terminus ~12.4 km north",
      "seed": 914088219
    },
    "prompt_latent_json": "{\n  \"epoch\": \"Pleistocene (LGM -18ka)\",\n  \"location\": \"Olympic Peninsula, WA\",\n  \"paleo_params\": {\n    \"cfg_scale\": 7.5,\n    \"denoise\": 0.88,\n    \"svd_fps\": 24,\n    \"motion_bucket_id\": 127\n  }\n}"
  }
}
```

---

### 3.3. Standard Error Structure

#### Error Response (`400 / 422 / 500`)
```json
{
  "error_code": "INVALID_IMAGE_PAYLOAD",
  "message": "Uploaded landscape image could not be decoded. Ensure file is a valid TIFF, RAW, PNG, or JPEG.",
  "details": {
    "max_size_bytes": 67108864,
    "received_size_bytes": 71200300
  }
}
```

---

## 4. Job Lifecycle & Polling Strategy

```
  [User Submits Form]
          │
          ▼
   POST /generations
          │
    ┌─────┴────────────────┐
    ▼                      ▼
 HTTP 202              HTTP 4xx/5xx
 (Status: queued)     (Error UI shown, retry enabled)
    │
    ▼
  Poll GET /generations/{id}
  (Interval: every 2,000ms, max 120s timeout)
    │
    ├── Status "processing" ──> Update progress bar & telemetry step
    ├── Status "failed"     ──> Display failure message & enable retry
    └── Status "completed"  ──> Navigate/render Results viewport
```

---

## 5. Ephemeral Processing & Scientific Integrity Guidelines

1. **No Evidence Distortion:** AI-generated imagery must be explicitly marked as computational reconstructions, not empirical archaeology or immutable history.
2. **Ephemeral Storage:** User portraits uploaded for traveler embedding should be wiped from volatile memory immediately upon completion of latent face inversion.
3. **Reproducibility:** Every completed generation returns the exact seed and latent prompt JSON so researchers can reproduce outputs independently.
