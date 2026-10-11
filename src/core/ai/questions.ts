import type { WalkIntention, QuestionPrompt } from '../types';
import { computeQuestionSchedule } from '../walkEngine';
import { isServerAiEnabled, requestQuestionsFromApi } from '../api/client';

export interface QuestionGenerator {
  generateQuestions(
    intention: WalkIntention,
    signal?: AbortSignal,
  ): Promise<QuestionPrompt[]>;
}

// Fixed prewritten fallback questions — clearly labeled as fallback demo content
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
    } else if (topic.includes('purpose') || topic.includes('decision') || topic.includes('career')) {
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
      id: `q-fallback-${Date.now()}-${idx}`,
      text: item.text,
      philosophySchool: `${item.philosophySchool} (Prewritten fallback)`,
      targetMinute: Math.floor(scheduleSeconds[idx] / 60),
    }));
  }
}

/**
 * ApiQuestionGenerator delegates to the FastAPI backend if server AI is enabled,
 * validating response with Zod and adhering to the 3-question rule.
 */
export class ApiQuestionGenerator implements QuestionGenerator {
  private fallback = new MockQuestionGenerator();

  async generateQuestions(
    intention: WalkIntention,
    signal?: AbortSignal
  ): Promise<QuestionPrompt[]> {
    if (!isServerAiEnabled()) {
      return this.fallback.generateQuestions(intention, signal);
    }

    // Map UI topic to contract topic enum
    const rawTopic = intention.topic.toLowerCase();
    let topicEnum = 'other';
    if (rawTopic.includes('career')) topicEnum = 'career';
    else if (rawTopic.includes('happiness')) topicEnum = 'happiness';
    else if (rawTopic.includes('relationship')) topicEnum = 'relationships';
    else if (rawTopic.includes('self')) topicEnum = 'self_discovery';
    else if (rawTopic.includes('fear')) topicEnum = 'fear';
    else if (rawTopic.includes('creativity')) topicEnum = 'creativity';
    else if (rawTopic.includes('gratitude')) topicEnum = 'gratitude';

    // Map UI mood to contract mood enum
    let moodEnum = 'curious';
    if (intention.mood === 'reflective') moodEnum = 'calm';
    else if (intention.mood === 'grounded') moodEnum = 'overwhelmed';
    else if (intention.mood === 'seeking') moodEnum = 'restless';

    const durationMinutes = (
      intention.durationMinutes === 10 || intention.durationMinutes === 20 || intention.durationMinutes === 30
        ? intention.durationMinutes
        : 10
    ) as 10 | 20 | 30;

    const response = await requestQuestionsFromApi(
      {
        topic: topicEnum,
        customTopic: topicEnum === 'other' ? intention.topic : undefined,
        mood: moodEnum,
        context: `${intention.context} walk setting`,
        language: intention.language === 'hi' ? 'hinglish' : 'en',
        durationMinutes,
      },
      signal
    );

    const scheduleSeconds = computeQuestionSchedule(intention.durationMinutes);
    return response.questions.map((q, idx) => ({
      id: q.id || `q-api-${Date.now()}-${idx}`,
      text: q.text,
      philosophySchool: `Generated by ${response.model}`,
      targetMinute: Math.floor(scheduleSeconds[idx] / 60),
    }));
  }
}
