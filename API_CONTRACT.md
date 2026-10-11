# Chalte-Chalte — API Contract Specification (v1.0.0)

This document defines the formal REST API contract between the **Chalte-Chalte** frontend client and the **FastAPI** backend service.

> [!IMPORTANT]
> The backend service is built by the backend owner using FastAPI (Python 3.11+, Pydantic v2). The frontend client communicates strictly using the protocols, endpoints, schemas, and constraints established in this contract.

---

## 1. Conventions & Protocols

- **Base Path**: `/v1`
- **Transport**: HTTPS Only in production; HTTP allowed on `localhost` during development.
- **Content Encoding**: UTF-8.
- **Request Identification**: Every response (both success and error) MUST include a unique `requestId` (UUIDv4) string.
- **Authentication**: Zero authentication and no user accounts. No headers like `Authorization` or user-tracking tokens are accepted or processed.
- **Standard Error Response Envelope**:
  ```json
  {
    "requestId": "7d9b7365-d051-4f11-965a-8b8359b36d0b",
    "error": {
      "code": "invalid_request",
      "message": "Field 'durationMinutes' must be 10, 20, or 30.",
      "retryable": false
    }
  }
  ```

---

## 2. Global Error Codes

| Status Code | Error Code (`code`) | Retryable | Description |
| :--- | :--- | :--- | :--- |
| **400 / 422** | `invalid_request` | `false` | Malformed JSON, failed validation schema, or unexpected parameters. |
| **413** | `payload_too_large` | `false` | Request body exceeds strict limits (audio > 10 MB or transcripts > 20,000 chars). |
| **415** | `unsupported_media_type` | `false` | Uploaded audio is not one of: `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/wav`. |
| **429** | `rate_limited` | `true` | Client exceeded IP rate limit. MUST include standard `Retry-After: <seconds>` header. |
| **503** | `model_unavailable` | `true` | Underlying AI model or inference engine is initializing or temporarily busy. |
| **504** | `timeout` | `true` | Inference execution exceeded backend timeout cap. |
| **500** | `internal` | `false` | Unhandled server exception. |

---

## 3. Endpoints & Schemas

### 3.1. Health Check & Model Discovery

- **Route**: `GET /v1/health`
- **Purpose**: Verify backend reachability and determine which AI inference models are loaded and available.
- **Timeout**: 5 seconds.
- **Request**: No query parameters or request body.

#### Success Response (200 OK)
```json
{
  "requestId": "2e604f37-d2fb-4e78-958b-0333da4f5093",
  "status": "healthy",
  "version": "1.0.0",
  "models": {
    "questions": {
      "name": "gemma-2-9b-it",
      "ready": true
    },
    "transcribe": {
      "name": "whisper-large-v3",
      "ready": true
    },
    "journal": {
      "name": "gemma-2-9b-it",
      "ready": true
    }
  }
}
```

#### cURL Example
```bash
curl -X GET "http://localhost:8000/v1/health" \
  -H "Accept: application/json"
```

---

### 3.2. Philosophical Inquiries Generator

- **Route**: `POST /v1/questions`
- **Purpose**: Generate exactly 3 open-ended, non-judgmental inquiry prompts tailored to the user's selected walk duration, mood, and context.
- **Timeout**: 40 seconds.
- **Limits**:
  - Request body max size: 10 KB.
  - `context` max length: 1,000 characters.

#### Request Schema
```json
{
  "topic": "career",
  "customTopic": null,
  "mood": "curious",
  "context": "Walking through morning park mist after deciding to leave a ten-year corporate role.",
  "language": "en",
  "durationMinutes": 20
}
```

*Fields*:
- `topic`: String enum (`career`, `happiness`, `relationships`, `self_discovery`, `fear`, `creativity`, `gratitude`, `other`).
- `customTopic`: Optional string (max 100 characters; required if `topic == "other"`).
- `mood`: String enum (`calm`, `curious`, `overwhelmed`, `restless`, `hopeful`).
- `context`: Optional string (max 1,000 characters).
- `language`: String enum (`"en"`, `"hinglish"`).
- `durationMinutes`: Integer enum (`10`, `20`, `30`).

#### Success Response (200 OK)
```json
{
  "requestId": "bc41cf30-6db7-4d7a-8f69-70220d9f0f9c",
  "model": "gemma-2-9b-it",
  "questions": [
    {
      "id": "q1",
      "text": "What part of your pace today feels chosen by you, and what part feels hurried by old expectations?"
    },
    {
      "id": "q2",
      "text": "As your footsteps rhythmically hit the ground, what burden does the ground support that your shoulders do not need to hold?"
    },
    {
      "id": "q3",
      "text": "If you stopped defending your recent choice to anyone, what quiet certainty remains?"
    }
  ]
}
```

#### Error Examples

##### 422 Unprocessable Entity (`invalid_request`)
```json
{
  "requestId": "bc41cf30-6db7-4d7a-8f69-70220d9f0f9c",
  "error": {
    "code": "invalid_request",
    "message": "Field 'durationMinutes' must be 10, 20, or 30.",
    "retryable": false
  }
}
```

##### 503 Service Unavailable (`model_unavailable`)
```json
{
  "requestId": "bc41cf30-6db7-4d7a-8f69-70220d9f0f9c",
  "error": {
    "code": "model_unavailable",
    "message": "Question generation model is warming up.",
    "retryable": true
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/questions" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "career",
    "mood": "curious",
    "context": "Walking in Nehru park.",
    "language": "en",
    "durationMinutes": 20
  }'
```

---

### 3.3. Audio Voice Note Transcription

- **Route**: `POST /v1/transcribe`
- **Content-Type**: `multipart/form-data`
- **Purpose**: Transcribe a single recorded voice memo clip using Whisper.
- **Timeout**: 120 seconds.
- **Limits**:
  - Max audio file size: **10 MB** (enforced by 413 `payload_too_large`).
  - Max audio duration: **5 minutes** (300 seconds).
  - Accepted MIME types: `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/wav`.

#### Form Fields
- `audio`: Binary file stream.
- `language`: String enum (`"en"`, `"hinglish"`, `"auto"`).

#### Success Response (200 OK)
```json
{
  "requestId": "902d1ec8-03f4-41d3-a44b-fceb15c9ffbd",
  "model": "whisper-large-v3",
  "text": "I noticed walking past the ancient trees that urgency was just borrowed anxiety. My natural pace is enough.",
  "language": "en",
  "durationSec": 14.8
}
```

#### Error Examples

##### 413 Payload Too Large (`payload_too_large`)
```json
{
  "requestId": "902d1ec8-03f4-41d3-a44b-fceb15c9ffbd",
  "error": {
    "code": "payload_too_large",
    "message": "Audio file exceeds 10 MB limit.",
    "retryable": false
  }
}
```

##### 415 Unsupported Media Type (`unsupported_media_type`)
```json
{
  "requestId": "902d1ec8-03f4-41d3-a44b-fceb15c9ffbd",
  "error": {
    "code": "unsupported_media_type",
    "message": "Only audio/webm, audio/ogg, audio/mp4, and audio/wav are accepted.",
    "retryable": false
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/transcribe" \
  -F "audio=@memo_01.webm;type=audio/webm" \
  -F "language=en"
```

---

### 3.4. Dialectical Journal Synthesis

- **Route**: `POST /v1/journal`
- **Purpose**: Synthesize user reflections from transcripts into an editorial journal entry.
- **Timeout**: 90 seconds.
- **Limits**:
  - Max clips: **20**.
  - Total transcript characters across all clips: **20,000 characters**.

#### Request Schema
```json
{
  "language": "en",
  "topic": "Career & Ambition",
  "transcripts": [
    {
      "clipId": "clip-1",
      "text": "I noticed walking past the old trees that urgency was borrowed anxiety. My natural pace is enough."
    },
    {
      "clipId": "clip-2",
      "text": "Stillness is an active refusal to amplify noise, not an environmental requirement."
    }
  ]
}
```

#### Success Response (200 OK)
```json
{
  "requestId": "7e3b12dc-4614-4171-beaa-bc04e432b4b9",
  "model": "gemma-2-9b-it",
  "title": "The Difference Between Urgency and Purpose",
  "reflections": [
    "You noted that the perceived urgency you carried was borrowed rather than intrinsic.",
    "Stillness became defined during your walk not as external silence, but as deliberate refusal to amplify friction."
  ],
  "ideas": [
    {
      "text": "Urgency is borrowed anxiety, whereas natural pacing preserves clear judgment.",
      "supportingQuote": "urgency was borrowed anxiety"
    },
    {
      "text": "Stillness operates through deliberate selective attention rather than absolute physical isolation.",
      "supportingQuote": "Stillness is an active refusal to amplify noise"
    }
  ],
  "question": "What standard are you measuring yourself against when no one else is in the room?",
  "nextStep": "When you open your inbox tomorrow, wait two minutes before sending any response."
}
```

#### Error Examples

##### 413 Payload Too Large (`payload_too_large`)
```json
{
  "requestId": "7e3b12dc-4614-4171-beaa-bc04e432b4b9",
  "error": {
    "code": "payload_too_large",
    "message": "Combined transcripts exceed 20,000 characters limit.",
    "retryable": false
  }
}
```

##### 504 Gateway Timeout (`timeout`)
```json
{
  "requestId": "7e3b12dc-4614-4171-beaa-bc04e432b4b9",
  "error": {
    "code": "timeout",
    "message": "Synthesis computation timed out after 90 seconds.",
    "retryable": true
  }
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/v1/journal" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "topic": "Career & Ambition",
    "transcripts": [
      {
        "clipId": "c1",
        "text": "Walking quietly revealed that urgency was borrowed anxiety."
      }
    ]
  }'
```

---

## 4. Strict Model Behavior Rules

1. **Medical & Diagnostic Boundary**: The model MUST NOT diagnose mental health conditions, prescribe psychiatric therapy, or offer medical advice. If a user expresses clinical despair or trauma, return grounded, observational philosophical inquiries without clinical claims.
2. **Strict Veracity & Anti-Hallucination**: The journal synthesis MUST draw solely from the user's recorded spoken words. It must NEVER invent anecdotes, emotions, family members, or life events that were not stated in the transcripts.
3. **Voice Preservation**: Preserve the user's authentic tone, hesitations, language shifts (English/Hinglish), and ambiguities.
4. **Supporting Quote Guarantee**: Every entry in `ideas` MUST include a `supportingQuote` that is a verbatim substring of the user's submitted transcripts. Any idea without an authentic supporting quote will be discarded by the frontend Zod validator.
5. **Action Step Discipline**: `nextStep` MUST be `null` unless the user's transcript clearly contemplates an explicit physical or behavioral action.

---

## 5. Server Security & Privacy Requirements

- **No Logging of Spoken Thoughts or Transcripts**: The server MUST NOT store or log audio data, transcripts, or context text to disk, databases, or third-party log aggregators.
- **Ephemeral Temp File Cleanup**: Any transient files written during audio transcoding MUST be securely unlinked immediately after inference completes or upon failure.
- **Log Hygiene**: Server logs are restricted strictly to:
  `[timestamp] [requestId] [method] [endpoint] [http_status] [duration_ms] [bytes_in] [bytes_out]`
- **CORS Allowlist**: Set strict CORS headers allowing only the trusted frontend origin in production, or `localhost` during development.
- **Per-IP Rate Limits**: Enforce rate limits (e.g., 20 requests per minute per IP). Return HTTP 429 with `Retry-After: <seconds>` on breach.

---

## 6. Ready-to-Paste Pydantic v2 Models for FastAPI

You can copy and paste the following code directly into your FastAPI application (`models.py`):

```python
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, constr

# ---------------------------------------------------------
# Common Enums & Envelopes
# ---------------------------------------------------------

class TopicEnum(str, Enum):
    career = "career"
    happiness = "happiness"
    relationships = "relationships"
    self_discovery = "self_discovery"
    fear = "fear"
    creativity = "creativity"
    gratitude = "gratitude"
    other = "other"

class MoodEnum(str, Enum):
    calm = "calm"
    curious = "curious"
    overwhelmed = "overwhelmed"
    restless = "restless"
    hopeful = "hopeful"

class LanguageEnum(str, Enum):
    en = "en"
    hinglish = "hinglish"

class TranscribeLanguageEnum(str, Enum):
    en = "en"
    hinglish = "hinglish"
    auto = "auto"

class ErrorDetails(BaseModel):
    code: str = Field(..., description="Error code string (e.g. invalid_request, model_unavailable)")
    message: str = Field(..., description="Human-readable explanation of error")
    retryable: bool = Field(..., description="Whether client should retry with backoff")

class ErrorResponse(BaseModel):
    requestId: str
    error: ErrorDetails

# ---------------------------------------------------------
# GET /v1/health
# ---------------------------------------------------------

class ModelStatus(BaseModel):
    name: str
    ready: bool

class HealthModels(BaseModel):
    questions: ModelStatus
    transcribe: ModelStatus
    journal: ModelStatus

class HealthResponse(BaseModel):
    requestId: str
    status: str = "healthy"
    version: str = "1.0.0"
    models: HealthModels

# ---------------------------------------------------------
# POST /v1/questions
# ---------------------------------------------------------

class QuestionsRequest(BaseModel):
    topic: TopicEnum
    customTopic: Optional[str] = Field(None, max_length=100)
    mood: MoodEnum
    context: Optional[str] = Field(None, max_length=1000)
    language: LanguageEnum
    durationMinutes: int = Field(..., description="Must be 10, 20, or 30")

class QuestionItem(BaseModel):
    id: str
    text: str

class QuestionsResponse(BaseModel):
    requestId: str
    model: str
    questions: List[QuestionItem] = Field(..., min_length=3, max_length=3)

# ---------------------------------------------------------
# POST /v1/transcribe
# ---------------------------------------------------------

class TranscribeResponse(BaseModel):
    requestId: str
    model: str
    text: str
    language: str
    durationSec: float

# ---------------------------------------------------------
# POST /v1/journal
# ---------------------------------------------------------

class TranscriptItem(BaseModel):
    clipId: str
    text: str

class JournalRequest(BaseModel):
    language: LanguageEnum
    topic: str
    transcripts: List[TranscriptItem] = Field(..., max_length=20)

class JournalIdea(BaseModel):
    text: str
    supportingQuote: str

class JournalResponse(BaseModel):
    requestId: str
    model: str
    title: str
    reflections: List[str] = Field(..., min_length=1)
    ideas: List[JournalIdea] = Field(default_factory=list, max_length=3)
    question: Optional[str] = None
    nextStep: Optional[str] = None
```

---

## 7. Changelog

- **v1.0.0 (October 2026)**:
  - Initial formal contract definition for Chalte-Chalte.
  - Specified `/v1/health`, `/v1/questions`, `/v1/transcribe`, and `/v1/journal`.
  - Added strict Pydantic v2 schemas and runtime anti-hallucination constraints.
