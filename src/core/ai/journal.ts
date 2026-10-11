import type { WalkSession, TranscriptFragment, JournalEntry } from '../types';
import { isServerAiEnabled, requestJournalFromApi } from '../api/client';

export interface JournalSynthesizer {
  synthesize(
    session: WalkSession,
    transcripts: TranscriptFragment[],
    signal?: AbortSignal,
  ): Promise<JournalEntry>;
}

/**
 * MockJournalSynthesizer
 *
 * Rules:
 *  - Only rearranges the user's own transcript text (paragraph splitting).
 *  - Title is extracted from the first sentence or phrase of the user's transcripts.
 *  - MUST NOT invent ideas, questions, or next steps.
 *  - Those three sections are omitted or left undefined in the mock.
 */
export class MockJournalSynthesizer implements JournalSynthesizer {
  async synthesize(
    session: WalkSession,
    transcripts: TranscriptFragment[],
    signal?: AbortSignal,
  ): Promise<JournalEntry> {
    // Simulate generation delay with AbortSignal support
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 1000);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const validTexts = transcripts
      .map((t) => t.text.trim())
      .filter((t) => t.length > 0);

    const fullText = validTexts.join('\n\n');

    // Title: first sentence or first 60 characters of the user's own words
    let derivedTitle = session.intention.topic;
    if (validTexts.length > 0) {
      const firstSentence = validTexts[0].split(/[.?!]/)[0].trim();
      if (firstSentence.length > 5) {
        derivedTitle =
          firstSentence.length > 60
            ? `${firstSentence.slice(0, 57)}…`
            : firstSentence;
      }
    }

    const myReflections = fullText || 'No transcripts provided.';

    return {
      id: `jrn-mock-${Date.now()}`,
      sessionId: session.id,
      createdAt: Date.now(),
      topic: session.intention.topic,
      title: derivedTitle,
      durationMinutes: session.intention.durationMinutes,
      myReflections,
      // In the mock, do NOT invent ideas, questions, or next steps!
      ideasWorthRevisiting: undefined,
      questionToCarryForward: undefined,
      oneSmallNextStep: undefined,
      walkingSummary: `A walk with focus on ${session.intention.topic}.`,
      coreInsight: derivedTitle,
      quote: {
        text: 'Solvitur ambulando — it is solved by walking.',
        author: 'Diogenes',
      },
      questionsReflected: session.questionsDelivered.map((q) => q.text),
      userReflections: myReflections,
      isMock: true,
    };
  }
}

/**
 * ApiJournalGenerator
 * Communicates with the FastAPI /v1/journal endpoint.
 * Validates output at runtime with Zod and drops ideas lacking verbatim quotes.
 */
export class ApiJournalGenerator implements JournalSynthesizer {
  private fallback = new MockJournalSynthesizer();

  async synthesize(
    session: WalkSession,
    transcripts: TranscriptFragment[],
    signal?: AbortSignal
  ): Promise<JournalEntry> {
    if (!isServerAiEnabled()) {
      return this.fallback.synthesize(session, transcripts, signal);
    }

    const res = await requestJournalFromApi(
      {
        language: session.intention.language === 'hi' ? 'hinglish' : 'en',
        topic: session.intention.topic,
        transcripts: transcripts.map((t) => ({ clipId: t.clipId, text: t.text })),
      },
      signal
    );

    return {
      id: `jrn-api-${Date.now()}`,
      sessionId: session.id,
      createdAt: Date.now(),
      topic: session.intention.topic,
      title: res.title,
      durationMinutes: session.intention.durationMinutes,
      myReflections: res.reflections.join('\n\n'),
      ideasWorthRevisiting: res.ideas.length > 0 ? res.ideas.map((i) => i.text) : undefined,
      questionToCarryForward: res.question || undefined,
      oneSmallNextStep: res.nextStep || undefined,
      walkingSummary: `Synthesized via ${res.model} from ${transcripts.length} voice notes.`,
      coreInsight: res.title,
      quote: {
        text: 'Solvitur ambulando — it is solved by walking.',
        author: 'Diogenes',
      },
      questionsReflected: session.questionsDelivered.map((q) => q.text),
      userReflections: transcripts.map((t) => t.text).join('\n\n'),
      isMock: false,
    };
  }
}
