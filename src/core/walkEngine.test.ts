import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WalkEngine, computeQuestionSchedule } from './walkEngine';
import type { WalkSession, QuestionPrompt } from './types';

function createMockSession(durationMinutes: number): WalkSession {
  return {
    id: `test-session-${durationMinutes}m`,
    createdAt: 1000000,
    intention: {
      topic: 'Philosophy of Time',
      mood: 'reflective',
      context: 'park',
      durationMinutes,
      language: 'en',
    },
    status: 'planning',
    elapsedSeconds: 0,
    questionsDelivered: [],
    clipsCount: 0,
  };
}

function create3Questions(): QuestionPrompt[] {
  return [
    { id: 'q-1', text: 'Question One?', philosophySchool: 'Stoicism', targetMinute: 0 },
    { id: 'q-2', text: 'Question Two?', philosophySchool: 'Daoism', targetMinute: 3 },
    { id: 'q-3', text: 'Question Three?', philosophySchool: 'Zen', targetMinute: 6 },
  ];
}

describe('WalkEngine Schedule Formula', () => {
  it('computes correct question schedule for 10 min walk', () => {
    // 10 min -> 600s. Gap = 30% of 600 = 180s. First at 15s.
    const schedule = computeQuestionSchedule(10);
    expect(schedule).toEqual([15, 195, 375]);
  });

  it('computes correct question schedule for 20 min walk', () => {
    // 20 min -> 1200s. Gap = 30% of 1200 = 360s. First at 15s.
    const schedule = computeQuestionSchedule(20);
    expect(schedule).toEqual([15, 375, 735]);
  });

  it('computes correct question schedule for 30 min walk', () => {
    // 30 min -> 1800s. Gap = 30% of 1800 = 540s. First at 15s.
    const schedule = computeQuestionSchedule(30);
    expect(schedule).toEqual([15, 555, 1095]);
  });
});

describe('WalkEngine Runtime Mechanics', () => {
  let listeners: Record<string, ((e: Event) => void)[]> = {};

  beforeEach(() => {
    vi.useFakeTimers();
    listeners = {};

    // Mock document for Node environment
    (globalThis as unknown as { document: unknown }).document = {
      visibilityState: 'visible',
      addEventListener: (type: string, fn: (e: Event) => void) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: (e: Event) => void) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter(f => f !== fn);
        }
      },
      dispatchEvent: (event: Event) => {
        const fns = listeners[event.type] || [];
        fns.forEach(fn => fn(event));
        return true;
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as unknown as { document?: unknown }).document;
  });

  it('delivers first question at t=15s and second at t=195s for 10 min walk', () => {
    const session = createMockSession(10);
    const questions = create3Questions();
    const onQuestionReady = vi.fn();
    const onTick = vi.fn();
    const onStateChange = vi.fn();
    const onCompleted = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick,
      onQuestionReady,
      onStateChange,
      onCompleted,
    });

    engine.start();

    // At t = 14s, no question delivered yet
    vi.advanceTimersByTime(14_000);
    expect(onQuestionReady).not.toHaveBeenCalled();

    // At t = 15s, Q1 delivered
    vi.advanceTimersByTime(1_000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);
    expect(onQuestionReady).toHaveBeenCalledWith(questions[0], 0, 3);

    // Engine is speaking, mark speaking done
    engine.onSpeakingFinished();

    // Fast-forward to t = 194s (179s more)
    vi.advanceTimersByTime(179_000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);

    // Fast forward to t = 195s -> Q2 delivered
    vi.advanceTimersByTime(1_000);
    expect(onQuestionReady).toHaveBeenCalledTimes(2);
    expect(onQuestionReady).toHaveBeenCalledWith(questions[1], 1, 3);
  });

  it('enforces 10s quiet gap after question delivery/speaking finishes', () => {
    const session = createMockSession(10);
    const questions = create3Questions();
    const onQuestionReady = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick: vi.fn(),
      onQuestionReady,
      onStateChange: vi.fn(),
      onCompleted: vi.fn(),
    });

    engine.start();
    vi.advanceTimersByTime(15_000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);

    // Question finished speaking at t=20s
    vi.advanceTimersByTime(5_000);
    engine.onSpeakingFinished();

    // For 9 seconds after speaking finishes, engine stays in reflecting
    vi.advanceTimersByTime(9_000);
    expect(engine.getEngineState()).toBe('reflecting');

    // 10s buffer has passed
    vi.advanceTimersByTime(2_000);
    expect(engine.getEngineState()).toBe('reflecting');
  });

  it('defers questions while recording and delivers after recording stops + quiet gap', () => {
    const session = createMockSession(10);
    const questions = create3Questions();
    const onQuestionReady = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick: vi.fn(),
      onQuestionReady,
      onStateChange: vi.fn(),
      onCompleted: vi.fn(),
    });

    engine.start();

    // Start user recording at t=10s (before Q1 is due at 15s)
    vi.advanceTimersByTime(10_000);
    engine.setRecordingActive(true);
    expect(engine.getEngineState()).toBe('recording');

    // Advance past t=15s to t=25s while recording
    vi.advanceTimersByTime(15_000);
    // Never interrupt active recording!
    expect(onQuestionReady).not.toHaveBeenCalled();

    // User stops recording at t=25s
    engine.setRecordingActive(false);

    // Now quiet buffer of 10s is applied before deferred question can speak
    vi.advanceTimersByTime(5_000);
    expect(onQuestionReady).not.toHaveBeenCalled();

    // After 10s quiet buffer completes, deferred question is delivered
    vi.advanceTimersByTime(6_000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);
    expect(onQuestionReady).toHaveBeenCalledWith(questions[0], 0, 3);
  });

  it('pause/resume freezes clock with no question replay or skip', () => {
    const session = createMockSession(10);
    const questions = create3Questions();
    const onQuestionReady = vi.fn();
    const onTick = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick,
      onQuestionReady,
      onStateChange: vi.fn(),
      onCompleted: vi.fn(),
    });

    engine.start();

    // Advance 10s
    vi.advanceTimersByTime(10_000);
    expect(engine.getElapsedSeconds()).toBe(10);

    // Pause for 60s
    engine.pause();
    expect(engine.getEngineState()).toBe('paused');
    vi.advanceTimersByTime(60_000);

    // Elapsed should still be 10s while paused
    expect(engine.getElapsedSeconds()).toBe(10);
    expect(onQuestionReady).not.toHaveBeenCalled();

    // Resume
    engine.resume();
    expect(engine.getEngineState()).toBe('reflecting');

    // Advance 4s -> total elapsed 14s (still no Q1)
    vi.advanceTimersByTime(4_000);
    expect(engine.getElapsedSeconds()).toBe(14);
    expect(onQuestionReady).not.toHaveBeenCalled();

    // Advance 1s -> total elapsed 15s -> Q1 delivered exactly once
    vi.advanceTimersByTime(1_000);
    expect(engine.getElapsedSeconds()).toBe(15);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);
  });

  it('skip stops current speech and moves on without breaking schedule', () => {
    const session = createMockSession(10);
    const questions = create3Questions();
    const onQuestionReady = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick: vi.fn(),
      onQuestionReady,
      onStateChange: vi.fn(),
      onCompleted: vi.fn(),
    });

    engine.start();

    // Q1 delivered at 15s
    vi.advanceTimersByTime(15_000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);

    // User skips Q1
    engine.skip();
    expect(engine.getEngineState()).toBe('reflecting');

    // Q2 should still not arrive until 195s
    vi.advanceTimersByTime(100_000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(80_000); // at t=195s
    expect(onQuestionReady).toHaveBeenCalledTimes(2);
    expect(onQuestionReady).toHaveBeenCalledWith(questions[1], 1, 3);
  });

  it('hidden tab catch-up plays only the most recent due question, never a burst', () => {
    const session = createMockSession(10);
    const questions = create3Questions();
    const onQuestionReady = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick: vi.fn(),
      onQuestionReady,
      onStateChange: vi.fn(),
      onCompleted: vi.fn(),
    });

    engine.start();

    // Suppose tab becomes hidden early at t=5s
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    // Advance clock past BOTH Q1 (15s) and Q2 (195s) to t=250s
    vi.advanceTimersByTime(250_000);

    // Now tab becomes visible again
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    // Trigger visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));

    // Should deliver ONLY the most recent due question (Q2, index 1), not Q1 then Q2 in a burst!
    expect(onQuestionReady).toHaveBeenCalledTimes(1);
    expect(onQuestionReady).toHaveBeenCalledWith(questions[1], 1, 3);
  });
});
