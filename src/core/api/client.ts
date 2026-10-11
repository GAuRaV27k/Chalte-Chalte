import { ApiClientError, type ApiErrorCode } from './errors';
import {
  HealthResponseSchema,
  QuestionsResponseSchema,
  TranscribeResponseSchema,
  validateAndFilterJournalResponse,
  type HealthResponse,
  type QuestionsResponse,
  type TranscribeResponse,
  type ValidatedJournalResponse,
} from './schemas';

const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 500;

export const TIMEOUTS = {
  HEALTH: 5000,
  QUESTIONS: 40000,
  TRANSCRIBE: 120000,
  JOURNAL: 90000,
};

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function isServerAiEnabled(): boolean {
  try {
    return localStorage.getItem('chalte_ai_processing_mode') === 'server';
  } catch {
    return false;
  }
}

export function setServerAiEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('chalte_ai_processing_mode', enabled ? 'server' : 'local');
  } catch {
    // ignore
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface RequestOptions {
  endpoint: string;
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  timeoutMs: number;
  signal?: AbortSignal;
}

export async function fetchWithRetryAndTimeout(options: RequestOptions): Promise<{ data: unknown; status: number; headers: Headers }> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiClientError({
      message: 'Server URL is not configured. Server features are disabled.',
      code: 'model_unavailable',
      status: 0,
      retryable: false,
    });
  }

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    const timeoutController = new AbortController();
    const timeoutTimer = setTimeout(() => {
      timeoutController.abort(new Error('Request timed out'));
    }, options.timeoutMs);

    // Combine caller signal with timeout signal
    let combinedSignal = timeoutController.signal;
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutTimer);
        throw new ApiClientError({
          message: 'Request was cancelled',
          code: 'aborted',
          retryable: false,
        });
      }
      // If either aborts, abort
      options.signal.addEventListener('abort', () => {
        timeoutController.abort(new Error('Request aborted by caller'));
      });
    }

    try {
      const url = `${baseUrl}${options.endpoint}`;
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        signal: combinedSignal,
      });

      clearTimeout(timeoutTimer);

      const contentType = response.headers.get('content-type') || '';
      let jsonBody: unknown = null;
      if (contentType.includes('application/json')) {
        try {
          jsonBody = await response.json();
        } catch {
          // ignore parsing error
        }
      }

      if (!response.ok) {
        // Parse error envelope
        const errObj = (jsonBody as { error?: { code?: string; message?: string; retryable?: boolean }; requestId?: string }) || {};
        const codeString = errObj.error?.code;
        const code: ApiErrorCode = (
          codeString === 'invalid_request' ||
          codeString === 'payload_too_large' ||
          codeString === 'unsupported_media_type' ||
          codeString === 'rate_limited' ||
          codeString === 'model_unavailable' ||
          codeString === 'timeout' ||
          codeString === 'internal'
        ) ? codeString : (
          response.status === 413 ? 'payload_too_large' :
          response.status === 415 ? 'unsupported_media_type' :
          response.status === 429 ? 'rate_limited' :
          response.status === 503 ? 'model_unavailable' :
          response.status === 504 ? 'timeout' :
          response.status >= 400 && response.status < 500 ? 'invalid_request' : 'internal'
        );

        let retryAfterSec: number | undefined;
        const retryAfterHeader = response.headers.get('Retry-After');
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed) && parsed > 0) retryAfterSec = parsed;
        }

        const isRetryable = errObj.error?.retryable ?? (code === 'rate_limited' || code === 'model_unavailable' || code === 'timeout');

        const clientErr = new ApiClientError({
          message: errObj.error?.message || `HTTP ${response.status} from ${options.endpoint}`,
          code,
          status: response.status,
          retryable: isRetryable,
          requestId: errObj.requestId,
          retryAfterSec,
        });

        if (clientErr.retryable && attempt < MAX_RETRIES) {
          attempt++;
          const waitMs = retryAfterSec ? retryAfterSec * 1000 : Math.pow(2, attempt) * BASE_RETRY_DELAY_MS;
          await sleep(waitMs);
          continue;
        }

        throw clientErr;
      }

      return { data: jsonBody, status: response.status, headers: response.headers };
    } catch (err) {
      clearTimeout(timeoutTimer);

      if (err instanceof ApiClientError) {
        throw err;
      }

      const isTimeout = combinedSignal.aborted && timeoutController.signal.reason?.message?.includes('timed out');
      const isCallerAborted = options.signal?.aborted;

      if (isCallerAborted) {
        throw new ApiClientError({
          message: 'Operation was cancelled',
          code: 'aborted',
          retryable: false,
        });
      }

      const netErr = new ApiClientError({
        message: isTimeout ? 'Request timed out' : (err instanceof Error ? err.message : 'Network error'),
        code: isTimeout ? 'timeout' : 'network_error',
        retryable: isTimeout || !isCallerAborted,
      });

      if (netErr.retryable && attempt < MAX_RETRIES) {
        attempt++;
        const waitMs = Math.pow(2, attempt) * BASE_RETRY_DELAY_MS;
        await sleep(waitMs);
        continue;
      }

      throw netErr;
    }
  }

  throw new ApiClientError({
    message: 'Max retry attempts exceeded',
    code: 'internal',
    retryable: false,
  });
}

// -------------------------------------------------------------
// Endpoint Callers
// -------------------------------------------------------------

export async function checkServerHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const { data } = await fetchWithRetryAndTimeout({
    endpoint: '/v1/health',
    method: 'GET',
    timeoutMs: TIMEOUTS.HEALTH,
    signal,
  });

  return HealthResponseSchema.parse(data);
}

export async function requestQuestionsFromApi(params: {
  topic: string;
  customTopic?: string;
  mood: string;
  context?: string;
  language: 'en' | 'hinglish';
  durationMinutes: 10 | 20 | 30;
}, signal?: AbortSignal): Promise<QuestionsResponse> {
  const { data } = await fetchWithRetryAndTimeout({
    endpoint: '/v1/questions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    timeoutMs: TIMEOUTS.QUESTIONS,
    signal,
  });

  return QuestionsResponseSchema.parse(data);
}

export async function requestTranscribeFromApi(
  audioBlob: Blob,
  language: 'en' | 'hinglish' | 'auto' = 'auto',
  signal?: AbortSignal
): Promise<TranscribeResponse> {
  // Pre-flight file size check: max 10 MB per contract
  if (audioBlob.size > 10 * 1024 * 1024) {
    throw new ApiClientError({
      message: 'Audio clip exceeds the 10 MB limit',
      code: 'payload_too_large',
      status: 413,
      retryable: false,
    });
  }

  const formData = new FormData();
  formData.append('audio', audioBlob, 'reflection.webm');
  formData.append('language', language);

  const { data } = await fetchWithRetryAndTimeout({
    endpoint: '/v1/transcribe',
    method: 'POST',
    body: formData,
    timeoutMs: TIMEOUTS.TRANSCRIBE,
    signal,
  });

  return TranscribeResponseSchema.parse(data);
}

export async function requestJournalFromApi(params: {
  language: 'en' | 'hinglish';
  topic: string;
  transcripts: Array<{ clipId: string; text: string }>;
}, signal?: AbortSignal): Promise<ValidatedJournalResponse> {
  const { data } = await fetchWithRetryAndTimeout({
    endpoint: '/v1/journal',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    timeoutMs: TIMEOUTS.JOURNAL,
    signal,
  });

  return validateAndFilterJournalResponse(data, params.transcripts);
}
