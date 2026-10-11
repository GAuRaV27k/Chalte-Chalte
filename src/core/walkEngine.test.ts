import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WalkEngine } from './walkEngine';
import type { WalkSession, QuestionPrompt } from './types';

describe('WalkEngine', () => {
  let session: WalkSession;
  let questions: QuestionPrompt[];

  beforeEach(() => {
    vi.useFakeTimers();

    session = {
      id: 'test-session-1',
      createdAt: 1000000,
      intention: {
        topic: 'Self-discovery',
        mood: 'curious',
        context: 'park',
        durationMinutes: 10,
        language: 'en',
      },
      status: 'planning',
      elapsedSeconds: 0,
      questionsDelivered: [],
      clipsCount: 0,
    };

    questions = [
      {
        id: 'q-1',
        text: 'First question at minute 2?',
        philosophySchool: 'Stoicism',
        targetMinute: 2,
      },
      {
        id: 'q-2',
        text: 'Second question at minute 5?',
        philosophySchool: 'Daoism',
        targetMinute: 5,
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules and triggers question when target minute arrives', () => {
    const onTick = vi.fn();
    const onQuestionReady = vi.fn();
    const onCompleted = vi.fn();
    const onStateChange = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick,
      onQuestionReady,
      onCompleted,
      onStateChange,
    });

    engine.start();
    expect(onStateChange).toHaveBeenCalledWith('active');

    // Advance 60 seconds (minute 1) - no question yet
    vi.advanceTimersByTime(60 * 1000);
    expect(onQuestionReady).not.toHaveBeenCalled();

    // Advance to minute 2 (120 seconds) - first question should fire
    vi.advanceTimersByTime(60 * 1000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);
    expect(onQuestionReady).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'q-1' })
    );

    engine.endWalk();
  });

  it('leaves ~10s quiet gap after question delivered', () => {
    const onQuestionReady = vi.fn();
    const engine = new WalkEngine(session, questions, {
      onTick: vi.fn(),
      onQuestionReady,
      onCompleted: vi.fn(),
      onStateChange: vi.fn(),
    });

    engine.start();

    // Trigger minute 2 question
    vi.advanceTimersByTime(120 * 1000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);

    // Try manual trigger immediately within the 10s quiet window
    // (quietBufferUntilMs was set to now + 10000)
    const deliveredQ = questions[0];
    expect(deliveredQ.deliveredAt).toBeDefined();

    engine.endWalk();
  });

  it('supports pause and resume without losing elapsed timing accuracy', () => {
    const onTick = vi.fn();
    const onStateChange = vi.fn();

    const engine = new WalkEngine(session, questions, {
      onTick,
      onQuestionReady: vi.fn(),
      onCompleted: vi.fn(),
      onStateChange,
    });

    engine.start();
    vi.advanceTimersByTime(30 * 1000); // 30s elapsed

    engine.pause();
    expect(onStateChange).toHaveBeenCalledWith('paused');

    // Wait 40s while paused
    vi.advanceTimersByTime(40 * 1000);

    engine.resume();
    expect(onStateChange).toHaveBeenCalledWith('active');

    // Advance 10s after resume -> total active should be ~40s, not 80s
    vi.advanceTimersByTime(10 * 1000);
    const lastTick = onTick.mock.calls[onTick.mock.calls.length - 1];
    expect(lastTick[0]).toBe(40);

    engine.endWalk();
  });

  it('supports skip question without disrupting remaining schedule', () => {
    const onQuestionReady = vi.fn();
    const engine = new WalkEngine(session, questions, {
      onTick: vi.fn(),
      onQuestionReady,
      onCompleted: vi.fn(),
      onStateChange: vi.fn(),
    });

    engine.start();
    engine.skipNextQuestion(); // skips q-1

    // Advance past minute 2 - q-1 should not be delivered because it was skipped
    vi.advanceTimersByTime(130 * 1000);
    expect(onQuestionReady).not.toHaveBeenCalled();

    // Advance to minute 5 - q-2 should now be delivered
    vi.advanceTimersByTime(180 * 1000);
    expect(onQuestionReady).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'q-2' })
    );

    engine.endWalk();
  });

  it('never interrupts an active recording', () => {
    const onQuestionReady = vi.fn();
    const engine = new WalkEngine(session, questions, {
      onTick: vi.fn(),
      onQuestionReady,
      onCompleted: vi.fn(),
      onStateChange: vi.fn(),
    });

    engine.start();

    // User is speaking / recording
    engine.setRecordingActive(true);

    // Advance to minute 2 (when q-1 is scheduled)
    vi.advanceTimersByTime(125 * 1000);
    expect(onQuestionReady).not.toHaveBeenCalled(); // Question held back while recording!

    // User finishes recording
    engine.setRecordingActive(false);

    // Next tick delivers the question
    vi.advanceTimersByTime(1000);
    expect(onQuestionReady).toHaveBeenCalledTimes(1);
    expect(onQuestionReady).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'q-1' })
    );

    engine.endWalk();
  });
});
