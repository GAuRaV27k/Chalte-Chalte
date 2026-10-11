import type { RecordedClip, TranscriptFragment } from '../types';
import { isServerAiEnabled, getApiBaseUrl, requestTranscribeFromApi } from '../api/client';

export interface Transcriber {
  readonly name: string;
  transcribe(clip: RecordedClip, signal?: AbortSignal): Promise<TranscriptFragment>;
}

/**
 * ManualTranscriber (default)
 * The user writes or dictates their own transcript.
 * Never produces fake text from real recordings.
 */
export class ManualTranscriber implements Transcriber {
  readonly name = 'Manual Entry';

  async transcribe(clip: RecordedClip): Promise<TranscriptFragment> {
    return {
      id: `tr-manual-${Date.now()}-${clip.id}`,
      clipId: clip.id,
      text: '',
      isMock: false,
      timestamp: Date.now(),
    };
  }
}

/**
 * DemoTranscriber
 * Only activated when VITE_DEMO_AI=true in environment.
 * Text is explicitly marked as demo content so it is never confused for real generation.
 */
export class DemoTranscriber implements Transcriber {
  readonly name = 'Demo Simulation';

  async transcribe(clip: RecordedClip): Promise<TranscriptFragment> {
    await new Promise((r) => setTimeout(r, 600));
    return {
      id: `tr-demo-${Date.now()}-${clip.id}`,
      clipId: clip.id,
      text: 'Demo transcript, not from your recording: I noticed the rhythm of my footsteps and realized urgency was just borrowed noise.',
      isMock: true,
      timestamp: Date.now(),
    };
  }
}

/**
 * ApiTranscriber
 * Communicates with the FastAPI /v1/transcribe endpoint using Whisper.
 * Replaces the old WhisperTranscriber stub.
 */
export class ApiTranscriber implements Transcriber {
  readonly name = 'Whisper (Server)';

  async transcribe(clip: RecordedClip, signal?: AbortSignal): Promise<TranscriptFragment> {
    const res = await requestTranscribeFromApi(clip.audioBlob, 'auto', signal);
    return {
      id: `tr-api-${Date.now()}-${clip.id}`,
      clipId: clip.id,
      text: res.text,
      isMock: false,
      timestamp: Date.now(),
    };
  }
}

/**
 * Factory helper: chooses transcriber based on config and user settings
 */
export function getDefaultTranscriber(): Transcriber {
  if (isServerAiEnabled() && getApiBaseUrl()) {
    return new ApiTranscriber();
  }
  const isDemoMode = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_AI === 'true';
  if (isDemoMode) {
    return new DemoTranscriber();
  }
  return new ManualTranscriber();
}
