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
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ChalteDB>> | null = null;

export function closeDB(): void {
  if (dbPromise) {
    dbPromise.then(db => db.close()).catch(() => {});
    dbPromise = null;
  }
}

export function getDB(): Promise<IDBPDatabase<ChalteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChalteDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
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
        }

        if (oldVersion < 2) {
          // Version 2 migration:
          // 1. Map old status 'completed' to 'saved'
          // 2. Fill missing default fields on legacy session objects
          const sessionStore = transaction.objectStore('sessions');
          let cursor = await sessionStore.openCursor();
          while (cursor) {
            const val = cursor.value as unknown as Record<string, unknown>;
            let modified = false;

            if (val.status === 'completed') {
              val.status = 'saved';
              modified = true;
            }

            if (val.clipsCount === undefined) {
              val.clipsCount = 0;
              modified = true;
            }

            if (!Array.isArray(val.questionsDelivered)) {
              val.questionsDelivered = [];
              modified = true;
            }

            if (val.elapsedSeconds === undefined) {
              const intention = val.intention as { durationMinutes?: number } | undefined;
              val.elapsedSeconds = (intention?.durationMinutes ?? 10) * 60;
              modified = true;
            }

            if (val.completedAt === undefined && typeof val.createdAt === 'number') {
              val.completedAt = (val.createdAt as number) + ((val.elapsedSeconds as number) * 1000);
              modified = true;
            }

            if (modified) {
              await cursor.update(val as unknown as WalkSession);
            }
            cursor = await cursor.continue();
          }
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

export async function getSavedSessions(): Promise<WalkSession[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'by-date');
  return all.filter(s => s.status === 'saved').reverse();
}

export async function getEndedUnsavedSession(): Promise<WalkSession | undefined> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'by-date');
  return all.reverse().find(s => s.status === 'ended_unsaved');
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

export async function deleteClip(clipId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['clips', 'transcripts'], 'readwrite');
  await tx.objectStore('clips').delete(clipId);
  const transcripts = await tx.objectStore('transcripts').index('by-clip').getAll(clipId);
  for (const t of transcripts) {
    await tx.objectStore('transcripts').delete(t.id);
  }
  await tx.done;
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

export async function getJournalForSession(sessionId: string): Promise<JournalEntry | undefined> {
  const db = await getDB();
  const all = await db.getAll('journals');
  return all.find(j => j.sessionId === sessionId);
}

export async function deleteJournal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('journals', id);
}

// Discard full session with cascade to clips, transcripts, and journal
export async function discardSession(sessionId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['sessions', 'clips', 'transcripts', 'journals'], 'readwrite');
  
  // 1. Delete session
  await tx.objectStore('sessions').delete(sessionId);

  // 2. Find and delete clips & their transcripts
  const clips = await tx.objectStore('clips').index('by-session').getAll(sessionId);
  for (const clip of clips) {
    await tx.objectStore('clips').delete(clip.id);
    const transcripts = await tx.objectStore('transcripts').index('by-clip').getAll(clip.id);
    for (const tr of transcripts) {
      await tx.objectStore('transcripts').delete(tr.id);
    }
  }

  // 3. Find and delete journal
  const journals = await tx.objectStore('journals').getAll();
  for (const j of journals) {
    if (j.sessionId === sessionId) {
      await tx.objectStore('journals').delete(j.id);
    }
  }

  await tx.done;
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
