/**
 * recorder.ts — MediaRecorder wrapper. No React imports.
 *
 * Exposes real mic level via AnalyserNode so the Active Walk UI can
 * show actual waveform amplitude while recording.
 *
 * isRecording() is the single source of truth — the indicator in the
 * UI must be bound to this and nothing else.
 */

export interface AudioRecorderService {
  start(): Promise<void>;
  stop(): Promise<Blob | null>;
  isRecording(): boolean;
  getMimeType(): string;
  /** Returns 0–1 normalised RMS amplitude; 0 when not recording. */
  getLevel(): number;
  /** Release mic resources without saving. */
  abort(): void;
}

export class BrowserAudioRecorder implements AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recording = false;
  private stream: MediaStream | null = null;
  private mimeType = '';

  // AnalyserNode for real mic levels
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelData: Uint8Array | null = null;

  async start(): Promise<void> {
    if (this.recording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this.audioChunks = [];

    // ---- AnalyserNode ----
    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.7;
      this.levelData = new Uint8Array(this.analyser.frequencyBinCount);
      source.connect(this.analyser);
    } catch {
      // Not fatal — getLevel() will return 0
    }

    // ---- MediaRecorder ----
    const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''];
    this.mimeType = preferred.find(m => m === '' || MediaRecorder.isTypeSupported(m)) ?? '';

    this.mediaRecorder = this.mimeType
      ? new MediaRecorder(this.stream, { mimeType: this.mimeType })
      : new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start(250); // chunks every 250 ms for accurate duration
    this.recording = true;
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.recording) {
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const type = this.mediaRecorder?.mimeType || this.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type });
        this.audioChunks = [];
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  abort(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.audioChunks = [];
    this.cleanup();
  }

  isRecording(): boolean {
    return this.recording;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  /**
   * Returns normalised RMS amplitude 0–1.
   * The UI may read this in a rAF loop to drive a waveform visualiser.
   * Returns 0 when not recording.
   */
  getLevel(): number {
    if (!this.analyser || !this.levelData || !this.recording) return 0;
    this.analyser.getByteFrequencyData(this.levelData as unknown as Uint8Array<ArrayBuffer>);
    const sum = this.levelData.reduce((acc, v) => acc + v, 0);
    return sum / (this.levelData.length * 255);
  }

  private cleanup(): void {
    this.recording = false;

    if (this.audioContext) {
      this.audioContext.close().catch(() => {/* noop */});
      this.audioContext = null;
    }
    this.analyser = null;
    this.levelData = null;

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
  }
}
