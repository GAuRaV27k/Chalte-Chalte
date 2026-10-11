# Local FastAPI backend

The optional backend connects the PWA to an Ollama model on the machine. It binds to `127.0.0.1:8000` in the commands below. The API does not keep a database or write submitted text to disk; audio is written to a temporary file only when transcription is available and is removed after processing.

## Windows PowerShell setup

From the repository root, create and activate a Python 3.13 environment, then install the small backend dependency set:

```powershell
py -3.13 -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
```

The backend loads `backend/.env` based on the module location, so it works whether Uvicorn starts from the repository root or `backend/`. Process environment variables override the file.

## Ollama configuration

Start Ollama through the installed app/service. Confirm a model is present:

```powershell
ollama list
```

Set `OLLAMA_MODEL` in `backend/.env` to the exact installed tag. `backend/.env.example` uses `gemma3:1b` as an example; the backend does not download models. If you choose a model that is not installed, fetch it only with an explicit Ollama command, for example:

```powershell
ollama pull gemma3:1b
```

Other settings in the template:

| Variable | Purpose | Example |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | Ollama HTTP endpoint | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Installed model tag | `gemma3:1b` |
| `CORS_ORIGINS` | Allowed Vite origins | `http://localhost:5173,http://127.0.0.1:5173` |

## Start the API

From the repository root:

```powershell
.\backend\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Or from the `backend/` directory:

```powershell
.\..\backend\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The frontend's ignored `.env.local` should set `VITE_API_BASE_URL=http://127.0.0.1:8000`. Restart Vite after changing environment settings. Then enable **Settings → My server** in the app.

## Routes and local checks

The frontend uses these contract routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/v1/health` | Backend and configured model readiness |
| `POST` | `/v1/questions` | Three walking reflection questions |
| `POST` | `/v1/journal` | Synthesis from submitted transcript clips |
| `POST` | `/v1/transcribe` | Optional local Whisper transcription |

Quick checks from PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/v1/health | ConvertTo-Json -Depth 6
$q = @{ topic="career"; mood="curious"; language="en"; durationMinutes=20 } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8000/v1/questions -Method Post -ContentType "application/json" -Body $q
$j = @{ language="en"; topic="career"; transcripts=@(@{ clipId="c1"; text="I want to make time for a quiet walk tomorrow." }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod http://127.0.0.1:8000/v1/journal -Method Post -ContentType "application/json" -Body $j
.\backend\smoke_test.ps1
```

For transcription, use `curl.exe` with a supported browser recording such as WebM:

```powershell
curl.exe -i -X POST http://127.0.0.1:8000/v1/transcribe -F "audio=@memo.webm;type=audio/webm" -F "language=auto"
```

## Optional transcription

The endpoint reports `ready: false` unless `faster-whisper` is installed and a local model directory is provided with `WHISPER_MODEL_DIR`. Provision model files separately and explicitly. The backend loads that directory in local-files-only mode with CPU `int8`; it never downloads weights at startup. Hinglish transcription currently uses Whisper's language auto-detection.

## Tests

From the repository root with the backend environment active:

```powershell
python -m pytest backend\test_main.py -v
```

The backend tests mock Ollama for deterministic validation and error handling. Use the live endpoint checks above to verify the local Ollama installation and chosen model.

## Privacy notes

- The backend logs request ID, method, route, status, timing, and byte counts, not request or model content.
- Request bodies are not persisted by the API.
- Audio content is kept in memory and, when Whisper is enabled, briefly written to a temporary file deleted in a `finally` block.
- Only enable server mode when you trust the configured backend and Ollama endpoint. Keep CORS limited to the local frontend origins.
