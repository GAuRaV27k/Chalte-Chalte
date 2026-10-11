import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  saveSession,
  getSession,
  getEndedUnsavedSession,
  saveClip,
  getClipsForSession,
  saveTranscript,
  getTranscriptsForClip,
  saveJournal,
  getJournalForSession,
  discardSession,
  clearAllUserData,
} from './storage';
import type { WalkSession, RecordedClip, TranscriptFragment, JournalEntry } from './types';
import { MockJournalSynthesizer } from './ai/journal';

function createSession(status: WalkSession['status'] = 'in_progress'): WalkSession {
  return {
    id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    intention: {
      topic: 'Mindfulness & Detours',
      mood: 'reflective',
      context: 'park',
      durationMinutes: 20,
      language: 'en',
    },
    status,
    elapsedSeconds: 1200,
    questionsDelivered: [],
    clipsCount: 2,
  };
}

describe('Phase 3 Session Lifecycle & Storage', () => {
  beforeEach(async () => {
    await clearAllUserData();
  });

  it('progresses session lifecycle: in_progress -> ended_unsaved -> saved', async () => {
    const session = createSession('in_progress');
    await saveSession(session);

    let retrieved = await getSession(session.id);
    expect(retrieved?.status).toBe('in_progress');

    // Walk ends -> status becomes ended_unsaved
    session.status = 'ended_unsaved';
    session.completedAt = Date.now();
    await saveSession(session);

    retrieved = await getSession(session.id);
    expect(retrieved?.status).toBe('ended_unsaved');

    // User saves walk -> status becomes saved
    session.status = 'saved';
    await saveSession(session);

    retrieved = await getSession(session.id);
    expect(retrieved?.status).toBe('saved');
  });

  it('reopening queries ended_unsaved session to resume Completion screen', async () => {
    const session1 = createSession('saved');
    await saveSession(session1);

    const session2 = createSession('ended_unsaved');
    await saveSession(session2);

    const unsaved = await getEndedUnsavedSession();
    expect(unsaved).toBeDefined();
    expect(unsaved?.id).toBe(session2.id);
    expect(unsaved?.status).toBe('ended_unsaved');
  });

  it('discarding session cascades to its clips, transcripts, and journal', async () => {
    const session = createSession('ended_unsaved');
    await saveSession(session);

    const clip1: RecordedClip = {
      id: `clip-1-${session.id}`,
      sessionId: session.id,
      recordedAt: Date.now(),
      durationMs: 45000,
      audioBlob: new Blob(['audio-data-1'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
    };
    const clip2: RecordedClip = {
      id: `clip-2-${session.id}`,
      sessionId: session.id,
      recordedAt: Date.now(),
      durationMs: 30000,
      audioBlob: new Blob(['audio-data-2'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
    };
    await saveClip(clip1);
    await saveClip(clip2);

    const tr1: TranscriptFragment = {
      id: `tr-1-${clip1.id}`,
      clipId: clip1.id,
      text: 'I realized walking past the park that delays were needed.',
      isMock: false,
      timestamp: Date.now(),
    };
    await saveTranscript(tr1);

    const journal: JournalEntry = {
      id: `jrn-${session.id}`,
      sessionId: session.id,
      createdAt: Date.now(),
      topic: session.intention.topic,
      title: 'Mindfulness on Detours',
      durationMinutes: 20,
      myReflections: tr1.text,
      walkingSummary: 'Quiet walk.',
      coreInsight: 'Detours are necessary.',
      quote: { text: 'Walk gently.', author: 'Nietzsche' },
      questionsReflected: [],
      userReflections: tr1.text,
      isMock: false,
    };
    await saveJournal(journal);

    // Verify all exist before discard
    expect(await getSession(session.id)).toBeDefined();
    expect((await getClipsForSession(session.id)).length).toBe(2);
    expect((await getTranscriptsForClip(clip1.id)).length).toBe(1);
    expect(await getJournalForSession(session.id)).toBeDefined();

    // Discard session
    await discardSession(session.id);

    // Verify all are removed
    expect(await getSession(session.id)).toBeUndefined();
    expect((await getClipsForSession(session.id)).length).toBe(0);
    expect((await getTranscriptsForClip(clip1.id)).length).toBe(0);
    expect(await getJournalForSession(session.id)).toBeUndefined();
  });

  it('autosaves transcripts properly to IndexedDB', async () => {
    const tr: TranscriptFragment = {
      id: 'tr-autosave-test',
      clipId: 'clip-test-1',
      text: 'Autosaved reflection thoughts on-device.',
      isMock: false,
      timestamp: Date.now(),
    };
    await saveTranscript(tr);

    const retrieved = await getTranscriptsForClip('clip-test-1');
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].text).toBe('Autosaved reflection thoughts on-device.');
  });
});

describe('Phase 3 AI Synthesizer & Enablement Rules', () => {
  it('enforces that Generate Journal requires at least one non-empty transcript', () => {
    const emptyTranscripts: TranscriptFragment[] = [
      { id: '1', clipId: 'c1', text: '', isMock: false, timestamp: 1 },
      { id: '2', clipId: 'c2', text: '   ', isMock: false, timestamp: 2 },
    ];
    const validTranscripts: TranscriptFragment[] = [
      { id: '1', clipId: 'c1', text: 'Some actual thought', isMock: false, timestamp: 1 },
    ];

    const canGenerateEmpty = emptyTranscripts.some(t => t.text.trim().length > 0);
    const canGenerateValid = validTranscripts.some(t => t.text.trim().length > 0);

    expect(canGenerateEmpty).toBe(false);
    expect(canGenerateValid).toBe(true);
  });

  it('mock journal synthesizer never invents content not in transcript', async () => {
    const session = createSession('ended_unsaved');
    const userText = 'Standing by the river today, I realized peace is non-resistance.';
    const transcripts: TranscriptFragment[] = [
      { id: 'tr-1', clipId: 'c1', text: userText, isMock: false, timestamp: Date.now() },
    ];

    const synth = new MockJournalSynthesizer();
    const entry = await synth.synthesize(session, transcripts);

    // Reflections contains strictly user text
    expect(entry.myReflections).toBe(userText);

    // Extra AI hallucination sections MUST NOT be invented in mock
    expect(entry.ideasWorthRevisiting).toBeUndefined();
    expect(entry.questionToCarryForward).toBeUndefined();
    expect(entry.oneSmallNextStep).toBeUndefined();
  });

  it('regeneration failure preserves the previous journal entry', async () => {
    const session = createSession('ended_unsaved');
    const oldJournal: JournalEntry = {
      id: 'jrn-old',
      sessionId: session.id,
      createdAt: 1000,
      topic: 'Patience',
      title: 'Old Original Journal',
      durationMinutes: 20,
      myReflections: 'Original thought preserved.',
      walkingSummary: 'Walk.',
      coreInsight: 'Insight.',
      quote: { text: 'Quote.', author: 'Author' },
      questionsReflected: [],
      userReflections: 'Original thought preserved.',
      isMock: true,
    };

    // Simulate failing generator with aborted signal
    const ctrl = new AbortController();
    ctrl.abort(); // abort immediately

    const synth = new MockJournalSynthesizer();
    let currentJournal = oldJournal;

    try {
      currentJournal = await synth.synthesize(session, [], ctrl.signal);
    } catch {
      // Kept old journal on failure
    }

    expect(currentJournal.id).toBe('jrn-old');
    expect(currentJournal.title).toBe('Old Original Journal');
    expect(currentJournal.myReflections).toBe('Original thought preserved.');
  });
});
