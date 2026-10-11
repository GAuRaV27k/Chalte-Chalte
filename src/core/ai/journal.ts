import type { WalkSession, TranscriptFragment, JournalEntry } from '../types';

export interface JournalSynthesizer {
  synthesize(session: WalkSession, transcripts: TranscriptFragment[]): Promise<JournalEntry>;
}

export class MockJournalSynthesizer implements JournalSynthesizer {
  async synthesize(session: WalkSession, transcripts: TranscriptFragment[]): Promise<JournalEntry> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const transcriptSummary = transcripts.map((t) => t.text).join(' ');

    return {
      id: `jrn-${Date.now()}`,
      sessionId: session.id,
      createdAt: Date.now(),
      topic: session.intention.topic,
      durationMinutes: session.intention.durationMinutes,
      walkingSummary: `A quiet contemplative walk under ${session.intention.context} atmosphere with a ${session.intention.mood} posture of mind.`,
      coreInsight: transcriptSummary.length > 0 
        ? 'The boundary between what is within your control and what is external becomes starkly clear when in motion. Urgency gives way to deliberate clarity.'
        : 'In quiet walking, absence of distraction opened a doorway to self-reconciliation.',
      quote: {
        text: 'All truly great thoughts are conceived while walking.',
        author: 'Friedrich Nietzsche',
      },
      questionsReflected: session.questionsDelivered.map((q) => q.text),
      userReflections: transcriptSummary || 'Walked in silent contemplation without spoken notes.',
      isMock: true,
    };
  }
}
