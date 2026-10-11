import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { WalkSession, RecordedClip, TranscriptFragment, JournalEntry } from './types';

interface ChalteDB extends DBSchema {
  sessions: {
    key: string;
    value: WalkSession;
    indexes: { 'by-date': number };
  };
  clips: {
    key: string;
    value: RecordedClip;
    indexes: { 'by-session': string };
  };
  transcripts: {
    key: string;
    value: TranscriptFragment;
    indexes: { 'by-clip': string };
  };
  journals: {
    key: string;
    value: JournalEntry;
    indexes: { 'by-created': number };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'chalte_chal_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChalteDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ChalteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChalteDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-date', 'createdAt');
        }
        if (!db.objectStoreNames.contains('clips')) {
          const clipStore = db.createObjectStore('clips', { keyPath: 'id' });
          clipStore.createIndex('by-session', 'sessionId');
        }
        if (!db.objectStoreNames.contains('transcripts')) {
          const transcriptStore = db.createObjectStore('transcripts', { keyPath: 'id' });
          transcriptStore.createIndex('by-clip', 'clipId');
        }
        if (!db.objectStoreNames.contains('journals')) {
          const journalStore = db.createObjectStore('journals', { keyPath: 'id' });
          journalStore.createIndex('by-created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// Sessions
export async function saveSession(session: WalkSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getSession(id: string): Promise<WalkSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getAllSessions(): Promise<WalkSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-date');
}

// Clips (Blobs are stored directly in IndexedDB, never localStorage)
export async function saveClip(clip: RecordedClip): Promise<void> {
  const db = await getDB();
  await db.put('clips', clip);
}

export async function getClipsForSession(sessionId: string): Promise<RecordedClip[]> {
  const db = await getDB();
  return db.getAllFromIndex('clips', 'by-session', sessionId);
}

// Transcripts
export async function saveTranscript(transcript: TranscriptFragment): Promise<void> {
  const db = await getDB();
  await db.put('transcripts', transcript);
}

export async function getTranscriptsForClip(clipId: string): Promise<TranscriptFragment[]> {
  const db = await getDB();
  return db.getAllFromIndex('transcripts', 'by-clip', clipId);
}

// Journals
export async function saveJournal(entry: JournalEntry): Promise<void> {
  const db = await getDB();
  await db.put('journals', entry);
}

export async function getAllJournals(): Promise<JournalEntry[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex('journals', 'by-created');
  return list.reverse(); // latest first
}

export async function getJournal(id: string): Promise<JournalEntry | undefined> {
  const db = await getDB();
  return db.get('journals', id);
}

export async function deleteJournal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('journals', id);
}

// Clear all storage for privacy/settings
export async function clearAllUserData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['sessions', 'clips', 'transcripts', 'journals', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('clips').clear(),
    tx.objectStore('transcripts').clear(),
    tx.objectStore('journals').clear(),
    tx.objectStore('settings').clear(),
    tx.done,
  ]);
}
