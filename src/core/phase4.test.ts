import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { server } from '../mocks/server';
import {
  closeDB,
  getDB,
  saveSession,
  saveClip,
  saveJournal,
  getSavedSessions,
  clearAllUserData,
} from './storage';
import type { WalkSession, RecordedClip } from './types';
import {
  checkServerHealth,
  requestQuestionsFromApi,
  requestTranscribeFromApi,
  requestJournalFromApi,
  isServerAiEnabled,
  setServerAiEnabled,
} from './api/client';
import { ApiClientError } from './api/errors';
import { validateAndFilterJournalResponse } from './api/schemas';
import { ApiQuestionGenerator } from './ai/questions';
import { ApiJournalGenerator } from './ai/journal';

// Mock localStorage for node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

// Start MSW server before tests
beforeEach(async () => {
  server.listen({ onUnhandledRequest: 'bypass' });
  closeDB();
  if (typeof indexedDB !== 'undefined' && indexedDB.deleteDatabase) {
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('chalte_chal_db');
      req.onsuccess = resolve;
      req.onerror = resolve;
      req.onblocked = resolve;
    });
  }
  localStorage.clear();
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  closeDB();
  vi.restoreAllMocks();
});

// -------------------------------------------------------------------------
// 1. IndexedDB Migration Tests (v1 -> v2)
// -------------------------------------------------------------------------
describe('IndexedDB v1 to v2 Migration', () => {
  it('upgrades a v1 database mapping "completed" to "saved" without losing sessions or clips', async () => {
    // 1. Create a raw v1 database directly with legacy schema & data
    const legacyDB = await openDB('chalte_chal_db', 1, {
      upgrade(db) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-date', 'createdAt');
        const clipStore = db.createObjectStore('clips', { keyPath: 'id' });
        clipStore.createIndex('by-session', 'sessionId');
        db.createObjectStore('transcripts', { keyPath: 'id' });
        db.createObjectStore('journals', { keyPath: 'id' });
        db.createObjectStore('settings');
      },
    });

    const legacySession: Record<string, unknown> = {
      id: 'legacy-sess-1',
      createdAt: 1700000000000,
      intention: {
        topic: 'Presence',
        mood: 'reflective',
        context: 'park',
        durationMinutes: 20,
        language: 'en',
      },
      status: 'completed', // old Phase 2 status
      // clipsCount, questionsDelivered, elapsedSeconds, completedAt missing on legacy
    };

    const legacyClip: RecordedClip = {
      id: 'legacy-clip-1',
      sessionId: 'legacy-sess-1',
      recordedAt: 1700000100000,
      durationMs: 30000,
      audioBlob: new Blob(['audio-bytes'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
    };

    await legacyDB.put('sessions', legacySession as unknown as WalkSession);
    await legacyDB.put('clips', legacyClip);
    legacyDB.close();

    // 2. Open via storage.ts at version 2 (triggers upgrade handler)
    const upgradedDB = await getDB();
    expect(upgradedDB.version).toBe(2);

    const migratedSession = await upgradedDB.get('sessions', 'legacy-sess-1');
    expect(migratedSession).toBeDefined();
    // Status mapped from 'completed' to 'saved'
    expect(migratedSession?.status).toBe('saved');
    // Missing fields filled with default values
    expect(migratedSession?.clipsCount).toBe(0);
    expect(Array.isArray(migratedSession?.questionsDelivered)).toBe(true);
    expect(migratedSession?.elapsedSeconds).toBe(1200); // 20 min * 60
    expect(migratedSession?.completedAt).toBe(1700000000000 + 1200 * 1000);

    // Clip was not lost
    const clip = await upgradedDB.get('clips', 'legacy-clip-1');
    expect(clip).toBeDefined();
    expect(clip?.sessionId).toBe('legacy-sess-1');
  });
});

// -------------------------------------------------------------------------
// 2. Storage Data Integrity Tests
// -------------------------------------------------------------------------
describe('Storage Data Integrity & Journal Visibility', () => {
  it('only returns sessions with status === "saved" in getSavedSessions', async () => {
    const s1: WalkSession = {
      id: 's-in-prog',
      createdAt: 1000,
      intention: { topic: 'Focus', mood: 'curious', context: 'park', durationMinutes: 10, language: 'en' },
      status: 'in_progress',
      elapsedSeconds: 100,
      questionsDelivered: [],
      clipsCount: 0,
    };

    const s2: WalkSession = {
      id: 's-unsaved',
      createdAt: 2000,
      intention: { topic: 'Clarity', mood: 'reflective', context: 'urban', durationMinutes: 20, language: 'en' },
      status: 'ended_unsaved',
      elapsedSeconds: 1200,
      questionsDelivered: [],
      clipsCount: 1,
    };

    const s3: WalkSession = {
      id: 's-saved',
      createdAt: 3000,
      intention: { topic: 'Solitude', mood: 'reflective', context: 'park', durationMinutes: 30, language: 'en' },
      status: 'saved',
      elapsedSeconds: 1800,
      questionsDelivered: [],
      clipsCount: 2,
    };

    await saveSession(s1);
    await saveSession(s2);
    await saveSession(s3);

    const saved = await getSavedSessions();
    expect(saved.length).toBe(1);
    expect(saved[0].id).toBe('s-saved');
    expect(saved[0].status).toBe('saved');
  });

  it('clears all stores and records on clearAllUserData', async () => {
    await saveSession({
      id: 's-test',
      createdAt: 1000,
      intention: { topic: 'Test', mood: 'curious', context: 'park', durationMinutes: 10, language: 'en' },
      status: 'saved',
      elapsedSeconds: 600,
      questionsDelivered: [],
      clipsCount: 0,
    });

    await saveClip({
      id: 'c-test',
      sessionId: 's-test',
      recordedAt: 1000,
      durationMs: 5000,
      audioBlob: new Blob(['x'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
    });

    await saveJournal({
      id: 'j-test',
      sessionId: 's-test',
      createdAt: 1000,
      topic: 'Test',
      title: 'A Test Reflection',
      durationMinutes: 10,
      myReflections: 'Reflections',
      walkingSummary: 'Summary',
      coreInsight: 'Insight',
      quote: { text: 'Quote', author: 'Author' },
      questionsReflected: [],
      userReflections: 'Reflections',
      isMock: false,
    });

    await clearAllUserData();

    const db = await getDB();
    const sessions = await db.getAll('sessions');
    const clips = await db.getAll('clips');
    const journals = await db.getAll('journals');

    expect(sessions.length).toBe(0);
    expect(clips.length).toBe(0);
    expect(journals.length).toBe(0);
  });
});

// -------------------------------------------------------------------------
// 3. API Contract & MSW Tests
// -------------------------------------------------------------------------
describe('API Contract & Client MSW Tests', () => {
  beforeEach(() => {
    // Provide a mocked base URL for testing
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');
  });

  it('GET /v1/health returns healthy model status', async () => {
    const health = await checkServerHealth();
    expect(health.status).toBe('healthy');
    expect(health.models.questions.ready).toBe(true);
    expect(health.models.transcribe.name).toBe('whisper-large-v3');
    expect(health.models.journal.ready).toBe(true);
  });

  it('POST /v1/questions returns exactly 3 inquiry prompts', async () => {
    const res = await requestQuestionsFromApi({
      topic: 'career',
      mood: 'curious',
      context: 'park walk',
      language: 'en',
      durationMinutes: 20,
    });

    expect(res.questions.length).toBe(3);
    expect(res.questions[0].text.length).toBeGreaterThan(0);
    expect(res.model).toBe('gemma-2-9b-it');
  });

  it('POST /v1/questions throws ApiClientError on invalid durationMinutes (422)', async () => {
    await expect(
      requestQuestionsFromApi({
        topic: 'career',
        mood: 'curious',
        context: 'park walk',
        language: 'en',
        durationMinutes: 45 as unknown as 10 | 20 | 30,
      })
    ).rejects.toThrow(ApiClientError);
  });

  it('POST /v1/transcribe transcribes uploaded audio blob', async () => {
    const dummyBlob = new Blob(['sample-audio-data'], { type: 'audio/webm' });
    const res = await requestTranscribeFromApi(dummyBlob, 'en');

    expect(res.model).toBe('whisper-large-v3');
    expect(res.text).toContain('urgency was borrowed anxiety');
    expect(res.durationSec).toBeGreaterThan(0);
  });

  it('POST /v1/transcribe rejects files larger than 10 MB client-side', async () => {
    // Create an object that simulates > 10 MB
    const hugeBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'audio/webm' });
    await expect(requestTranscribeFromApi(hugeBlob, 'en')).rejects.toThrow('Audio clip exceeds the 10 MB limit');
  });

  it('POST /v1/journal returns synthesized reflections and filters unverified ideas', async () => {
    const submittedTranscripts = [
      { clipId: 'c1', text: 'I realized walking that urgency was borrowed anxiety.' },
    ];

    const res = await requestJournalFromApi({
      language: 'en',
      topic: 'Career',
      transcripts: submittedTranscripts,
    });

    expect(res.title).toBe('The Architecture of Natural Pacing');
    expect(res.reflections.length).toBeGreaterThan(0);
    // Idea with authentic verbatim quote is preserved
    expect(res.ideas.length).toBe(1);
    expect(res.ideas[0].supportingQuote).toBe('urgency was borrowed anxiety');
  });

  it('drops ideas whose supportingQuote is not present in submitted transcripts', () => {
    const rawResponse = {
      requestId: 'test-id',
      model: 'gemma-2-9b-it',
      title: 'Solitude',
      reflections: ['A peaceful observation.'],
      ideas: [
        {
          text: 'Legitimate idea',
          supportingQuote: 'urgency was borrowed anxiety',
        },
        {
          text: 'Hallucinated idea with made up quote',
          supportingQuote: 'I spoke with my cousin yesterday at the market',
        },
      ],
    };

    const transcripts = [
      { text: 'Walking past the trees, urgency was borrowed anxiety. My pace was slow.' },
    ];

    const validated = validateAndFilterJournalResponse(rawResponse, transcripts);
    // The second idea is dropped because "I spoke with my cousin..." is not in transcripts
    expect(validated.ideas.length).toBe(1);
    expect(validated.ideas[0].supportingQuote).toBe('urgency was borrowed anxiety');
  });

  it('rejects journal responses where reflections array is empty', () => {
    const rawResponse = {
      requestId: 'test-empty-reflections',
      model: 'gemma-2-9b-it',
      title: 'Empty Reflection',
      reflections: [],
      ideas: [],
    };

    expect(() =>
      validateAndFilterJournalResponse(rawResponse, [{ text: 'Some text' }])
    ).toThrow();
  });
});

// -------------------------------------------------------------------------
// 4. Fallback & AI Option Toggle Rules
// -------------------------------------------------------------------------
describe('AI Option Toggle & Honest Fallbacks', () => {
  it('ApiQuestionGenerator uses prewritten fallback labeled clearly when server mode is disabled', async () => {
    setServerAiEnabled(false);
    expect(isServerAiEnabled()).toBe(false);

    const generator = new ApiQuestionGenerator();
    const questions = await generator.generateQuestions({
      topic: 'Self-discovery',
      mood: 'curious',
      context: 'park',
      durationMinutes: 10,
      language: 'en',
    });

    expect(questions.length).toBe(3);
    // Verified label per spec: must not claim to be server AI
    expect(questions[0].philosophySchool).toContain('Prewritten fallback');
  });

  it('ApiJournalGenerator uses rearrange-only mock when server mode is disabled', async () => {
    setServerAiEnabled(false);

    const synth = new ApiJournalGenerator();
    const session: WalkSession = {
      id: 'sess-test',
      createdAt: Date.now(),
      intention: { topic: 'Silence', mood: 'reflective', context: 'park', durationMinutes: 10, language: 'en' },
      status: 'ended_unsaved',
      elapsedSeconds: 600,
      questionsDelivered: [],
      clipsCount: 1,
    };

    const transcripts = [
      { id: 't1', clipId: 'c1', text: 'Walking in the silence allowed my mind to settle.', isMock: false, timestamp: Date.now() },
    ];

    const entry = await synth.synthesize(session, transcripts);
    expect(entry.isMock).toBe(true);
    // Mock does NOT invent ideas, questions, or next steps
    expect(entry.ideasWorthRevisiting).toBeUndefined();
    expect(entry.questionToCarryForward).toBeUndefined();
    expect(entry.oneSmallNextStep).toBeUndefined();
    expect(entry.myReflections).toContain('Walking in the silence allowed my mind to settle.');
  });
});
