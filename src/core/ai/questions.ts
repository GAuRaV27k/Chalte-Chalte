import type { WalkIntention, QuestionPrompt } from '../types';
import { computeQuestionSchedule } from '../walkEngine';

export interface QuestionGenerator {
  generateQuestions(
    intention: WalkIntention,
    signal?: AbortSignal,
  ): Promise<QuestionPrompt[]>;
}

// Mock — always returns exactly 3 questions.
// targetMinute is set from the schedule formula (first at 15 s, 30 % gap).
// This is demo content; never presented as AI-generated.
export class MockQuestionGenerator implements QuestionGenerator {
  async generateQuestions(
    intention: WalkIntention,
    signal?: AbortSignal,
  ): Promise<QuestionPrompt[]> {
    // Simulate a brief async delay (200 ms) so callers can test AbortSignal
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 200);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const topic = intention.topic.toLowerCase();
    let bank: Array<{ text: string; philosophySchool: string }>;

    if (topic.includes('grief') || topic.includes('loss')) {
      bank = [
        {
          text: 'Where does the absence you feel live in your physical body as you take this step?',
          philosophySchool: 'Phenomenology of Grief',
        },
        {
          text: 'What did the thing you lost teach you about your capacity to care deeply?',
          philosophySchool: 'Marcus Aurelius — Meditations',
        },
        {
          text: 'If sorrow is the price of genuine love, is it a debt or a testament?',
          philosophySchool: 'Spinozan Acceptance',
        },
      ];
    } else if (topic.includes('purpose') || topic.includes('decision')) {
      bank = [
        {
          text: 'Strip away what others expect of your choice. What does your quietest instinct whisper?',
          philosophySchool: 'Kierkegaardian Choice',
        },
        {
          text: 'If you fail at this path, would the attempt itself still honour who you want to be?',
          philosophySchool: 'Nietzschean Amor Fati',
        },
        {
          text: 'What step can you take right now that requires no external permission?',
          philosophySchool: 'Sartrean Autonomy',
        },
      ];
    } else {
      bank = [
        {
          text: 'What is one thing in your life right now that you are holding onto — that is already changing?',
          philosophySchool: 'Buddhist Impermanence',
        },
        {
          text: 'Notice the rhythm of your footsteps. If this moment had nothing to accomplish, what would remain?',
          philosophySchool: 'Stoicism / Presence',
        },
        {
          text: 'Are you walking toward something you truly desire, or away from something you fear facing?',
          philosophySchool: 'Existential Inquest',
        },
      ];
    }

    // Always 3 questions. targetMinute from the engine schedule formula.
    const scheduleSeconds = computeQuestionSchedule(intention.durationMinutes);
    return bank.slice(0, 3).map((item, idx) => ({
      id: `q-mock-${Date.now()}-${idx}`,
      text: item.text,
      philosophySchool: item.philosophySchool,
      targetMinute: Math.floor(scheduleSeconds[idx] / 60),
    }));
  }
}
