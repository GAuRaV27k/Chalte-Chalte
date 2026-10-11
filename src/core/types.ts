export type WalkMood = 'reflective' | 'curious' | 'grounded' | 'seeking';
export type WalkContext = 'park' | 'urban' | 'night' | 'dawn';
export type WalkLanguage = 'en' | 'hi' | 'es' | 'fr';

export interface WalkIntention {
  topic: string;
  mood: WalkMood;
  context: WalkContext;
  durationMinutes: number;
  language: WalkLanguage;
}

export interface QuestionPrompt {
  id: string;
  text: string;
  philosophySchool: string;
  targetMinute: number;
  deliveredAt?: number;
}

export interface RecordedClip {
  id: string;
  sessionId: string;
  questionId?: string;
  recordedAt: number;
  durationMs: number;
  audioBlob: Blob;
  mimeType: string;
}

export interface TranscriptFragment {
  id: string;
  clipId: string;
  text: string;
  isMock: boolean;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  sessionId: string;
  createdAt: number;
  topic: string;
  durationMinutes: number;
  walkingSummary: string;
  coreInsight: string;
  quote: {
    text: string;
    author: string;
  };
  questionsReflected: string[];
  userReflections: string;
  isMock: boolean;
}

export interface WalkSession {
  id: string;
  createdAt: number;
  completedAt?: number;
  intention: WalkIntention;
  status: 'planning' | 'preparing' | 'active' | 'paused' | 'completed' | 'abandoned';
  elapsedSeconds: number;
  questionsDelivered: QuestionPrompt[];
  clipsCount: number;
}
