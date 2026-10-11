/**
 * walkEngine.ts — pure TypeScript, no React imports.
 * Can be moved into a native Android wrapper as-is.
 *
 * Question schedule (always 3 questions):
 *   - Q1 at t = 15 s
 *   - gap = 30 % of total walk duration
 *   - Q2 at t = 15s + gap
 *   - Q3 at t = 15s + 2×gap
 *
 * 10 min → gap = 180 s → Q1@15s, Q2@195s, Q3@375s
 * 20 min → gap = 360 s → Q1@15s, Q2@375s, Q3@735s
 * 30 min → gap = 540 s → Q1@15s, Q2@555s, Q3@1095s
 */

import type { QuestionPrompt, WalkSession } from './types';

// -----------------------------------------------------------------
// Public state enum
// -----------------------------------------------------------------
export type EngineState =
  | 'preparing'   // not yet started
  | 'speaking'    // TTS is active
  | 'reflecting'  // post-question quiet window
  | 'recording'   // user is recording a clip
  | 'paused'      // walk paused
  | 'error'       // unrecoverable error
  | 'ended';      // session complete

// -----------------------------------------------------------------
// Events the UI can subscribe to
// -----------------------------------------------------------------
export interface WalkEngineEvents {
  onTick: (elapsedSeconds: number, remainingSeconds: number) => void;
  onQuestionReady: (question: QuestionPrompt, index: number, total: number) => void;
  onStateChange: (state: EngineState) => void;
  onCompleted: () => void;
}

// -----------------------------------------------------------------
// Helper: compute question target times in seconds
// -----------------------------------------------------------------
export function computeQuestionSchedule(durationMinutes: number): number[] {
  const firstAt = 15; // seconds
  const gap = Math.floor(durationMinutes * 60 * 0.3); // 30 % of walk
  return [firstAt, firstAt + gap, firstAt + 2 * gap];
}

// -----------------------------------------------------------------
// WalkEngine
// -----------------------------------------------------------------
export class WalkEngine {
  private session: WalkSession;
  private questions: QuestionPrompt[];
  private events: WalkEngineEvents;

  private engineState: EngineState = 'preparing';

  // Timestamp tracking (milliseconds)
  private startTimestampMs = 0;
  private pausedAccumulatedMs = 0;
  private pauseStartedAt = 0;

  private timerHandle: ReturnType<typeof setInterval> | null = null;

  // Question scheduling
  private scheduledTimesSeconds: number[] = [];
  private lastDeliveredIndex = -1;
  private deferredQuestionIndex: number | null = null; // question waiting on recording to stop

  // Quiet buffer: nothing plays for 10 s after question finishes
  private quietBufferUntilMs = 0;

  // Recording state (set by the UI via setRecordingActive)
  private isUserRecordingActive = false;

  // visibilitychange handler reference (for cleanup)
  private visibilityHandler: (() => void) | null = null;

  constructor(
    session: WalkSession,
    questions: QuestionPrompt[],
    events: WalkEngineEvents,
  ) {
    this.session = session;
    this.questions = questions;
    this.events = events;
    this.scheduledTimesSeconds = computeQuestionSchedule(session.intention.durationMinutes);
  }

  // ------------------------------------------------------------------
  // Public controls
  // ------------------------------------------------------------------

  public start(): void {
    if (this.engineState !== 'preparing') return;
    this.startTimestampMs = Date.now();
    this.attachVisibilityHandler();
    this.setEngineState('reflecting');
    this.runLoop();
  }

  public pause(): void {
    if (this.engineState === 'paused' || this.engineState === 'ended') return;
    this.pauseStartedAt = Date.now();
    this.stopLoop();
    this.setEngineState('paused');
  }

  public resume(): void {
    if (this.engineState !== 'paused') return;
    this.pausedAccumulatedMs += Date.now() - this.pauseStartedAt;
    this.setEngineState('reflecting');
    this.runLoop();
  }

  /**
   * Called by the UI when user starts/stops recording.
   * When recording stops, check if a question was deferred and deliver it
   * after the 10 s quiet buffer.
   */
  public setRecordingActive(active: boolean): void {
    this.isUserRecordingActive = active;
    if (active) {
      this.setEngineState('recording');
    } else {
      // If a question was deferred, deliver it now (after quiet buffer)
      if (this.deferredQuestionIndex !== null) {
        const idx = this.deferredQuestionIndex;
        this.deferredQuestionIndex = null;
        // Wait for quiet buffer to clear before delivering
        this.quietBufferUntilMs = Date.now() + 10_000;
        // The tick will pick it up once the buffer clears
        this.lastDeliveredIndex = idx - 1; // will re-check this index in tick
        // Reset so tick delivers it
        this.lastDeliveredIndex = idx - 1;
      }
      this.setEngineState('reflecting');
    }
  }

  /**
   * Skip: stop current speech and move on without breaking future schedule.
   */
  public skip(): void {
    // Reset quiet buffer so quiet reflection continues normally
    this.quietBufferUntilMs = Date.now() + 10_000;
    this.setEngineState('reflecting');
  }

  public endWalk(): void {
    this.stopLoop();
    this.detachVisibilityHandler();
    this.session.status = 'completed';
    this.session.completedAt = Date.now();
    this.setEngineState('ended');
    this.events.onCompleted();
  }

  public getSession(): WalkSession {
    return this.session;
  }

  public getElapsedSeconds(): number {
    if (this.startTimestampMs === 0) return 0;
    const now = Date.now();
    const currentPauseMs = this.engineState === 'paused' ? now - this.pauseStartedAt : 0;
    const elapsed = now - this.startTimestampMs - this.pausedAccumulatedMs - currentPauseMs;
    return Math.max(0, Math.floor(elapsed / 1000));
  }

  public getEngineState(): EngineState {
    return this.engineState;
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  private setEngineState(next: EngineState): void {
    if (this.engineState === next) return;
    this.engineState = next;
    this.events.onStateChange(next);
  }

  private runLoop(): void {
    this.stopLoop();
    this.timerHandle = setInterval(() => this.tick(), 500);
    this.tick(); // run immediately
  }

  private stopLoop(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private tick(): void {
    if (this.engineState === 'paused' || this.engineState === 'ended') return;

    const now = Date.now();
    const elapsedMs = now - this.startTimestampMs - this.pausedAccumulatedMs;
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    const totalSeconds = this.session.intention.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    this.session.elapsedSeconds = elapsedSeconds;
    this.events.onTick(elapsedSeconds, remainingSeconds);

    // Check session end
    if (elapsedSeconds >= totalSeconds) {
      this.endWalk();
      return;
    }

    // Check question delivery
    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    if (
      !isHidden &&
      !this.isUserRecordingActive &&
      now >= this.quietBufferUntilMs &&
      this.engineState !== 'speaking'
    ) {
      const nextIdx = this.lastDeliveredIndex + 1;
      if (nextIdx < this.questions.length) {
        const targetSeconds = this.scheduledTimesSeconds[nextIdx];
        if (elapsedSeconds >= targetSeconds) {
          this.deliverQuestion(nextIdx, now);
        }
      }
    } else if (this.isUserRecordingActive) {
      // Defer: check if a question is now overdue
      const nextIdx = this.lastDeliveredIndex + 1;
      if (nextIdx < this.questions.length) {
        const targetSeconds = this.scheduledTimesSeconds[nextIdx];
        if (elapsedSeconds >= targetSeconds && this.deferredQuestionIndex === null) {
          this.deferredQuestionIndex = nextIdx;
          // Advance so we don't keep re-setting deferredQuestionIndex every tick
          this.lastDeliveredIndex = nextIdx;
        }
      }
    }
  }

  private deliverQuestion(idx: number, now: number): void {
    this.lastDeliveredIndex = idx;
    const question = this.questions[idx];
    question.deliveredAt = now;
    // 10 s quiet buffer starts when the question is *delivered*;
    // the UI will call back via setSpeakingDone() or we extend it on skip
    this.quietBufferUntilMs = now + 10_000;
    this.setEngineState('speaking');
    this.events.onQuestionReady(question, idx, this.questions.length);
    this.session.questionsDelivered.push(question);
  }

  /**
   * UI calls this when TTS finishes speaking the question.
   * Starts the 10 s quiet / reflection window.
   */
  public onSpeakingFinished(): void {
    this.quietBufferUntilMs = Date.now() + 10_000;
    if (this.engineState === 'speaking') {
      this.setEngineState('reflecting');
    }
  }

  // ------------------------------------------------------------------
  // visibilitychange catch-up
  // ------------------------------------------------------------------

  private attachVisibilityHandler(): void {
    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => this.handleVisibilityChange();
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private detachVisibilityHandler(): void {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  /**
   * When the page becomes visible again, recompute elapsed time from
   * timestamps. If prompts were missed while hidden, play ONLY the
   * most recent one — never a burst.
   */
  private handleVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (this.engineState === 'paused' || this.engineState === 'ended') return;

    const now = Date.now();
    const elapsedMs = now - this.startTimestampMs - this.pausedAccumulatedMs;
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

    // Find the most-recent question that should have been delivered by now
    let mostRecentDue: number | null = null;
    for (let i = this.lastDeliveredIndex + 1; i < this.scheduledTimesSeconds.length; i++) {
      if (elapsedSeconds >= this.scheduledTimesSeconds[i]) {
        mostRecentDue = i;
      }
    }

    if (mostRecentDue !== null && !this.isUserRecordingActive && now >= this.quietBufferUntilMs) {
      // Skip all missed ones silently, deliver only the most recent due
      this.lastDeliveredIndex = mostRecentDue - 1;
      this.deliverQuestion(mostRecentDue, now);
    }
  }
}
