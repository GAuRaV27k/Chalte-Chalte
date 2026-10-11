import { z } from 'zod';
import { ApiClientError } from './errors';

// -------------------------------------------------------------
// Health
// -------------------------------------------------------------

export const ModelStatusSchema = z.object({
  name: z.string(),
  ready: z.boolean(),
});

export const HealthResponseSchema = z.object({
  requestId: z.string(),
  status: z.string(),
  version: z.string(),
  models: z.object({
    questions: ModelStatusSchema,
    transcribe: ModelStatusSchema,
    journal: ModelStatusSchema,
  }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// -------------------------------------------------------------
// Questions
// -------------------------------------------------------------

export const QuestionItemSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, 'Question text cannot be empty'),
});

export const QuestionsResponseSchema = z.object({
  requestId: z.string(),
  model: z.string(),
  questions: z.array(QuestionItemSchema).length(3, 'Exactly 3 questions are required'),
});

export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;

// -------------------------------------------------------------
// Transcribe
// -------------------------------------------------------------

export const TranscribeResponseSchema = z.object({
  requestId: z.string(),
  model: z.string(),
  text: z.string(),
  language: z.string(),
  durationSec: z.number(),
});

export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;

// -------------------------------------------------------------
// Journal
// -------------------------------------------------------------

export const JournalIdeaSchema = z.object({
  text: z.string().trim().min(1),
  supportingQuote: z.string().trim().min(1),
});

export const RawJournalResponseSchema = z.object({
  requestId: z.string(),
  model: z.string(),
  title: z.string().trim().min(1, 'Title cannot be empty'),
  reflections: z.array(z.string().trim().min(1)).min(1, 'At least one reflection is required'),
  ideas: z.array(JournalIdeaSchema).max(3).default([]),
  question: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
});

export type ValidatedJournalResponse = z.infer<typeof RawJournalResponseSchema>;

/**
 * Normalizes text by removing non-alphanumeric punctuation and collapsing multiple spaces to a single space.
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates the raw journal response, drops any idea whose supportingQuote is not
 * found in the submitted transcripts, and ensures reflections are non-empty.
 */
export function validateAndFilterJournalResponse(
  data: unknown,
  submittedTranscripts: Array<{ text: string }>
): ValidatedJournalResponse {
  const parsed = RawJournalResponseSchema.parse(data);

  if (!parsed.reflections || parsed.reflections.length === 0) {
    throw new ApiClientError({
      message: 'Server returned empty reflections in journal output',
      code: 'invalid_request',
      status: 200,
      retryable: false,
      requestId: parsed.requestId,
    });
  }

  // Combine and normalize all user transcript text
  const combinedTranscripts = normalizeForComparison(
    submittedTranscripts.map((t) => t.text).join(' ')
  );

  // Drop ideas without a verbatim supporting quote in user's transcripts
  const validIdeas = (parsed.ideas || []).filter((idea) => {
    const normQuote = normalizeForComparison(idea.supportingQuote);
    if (!normQuote || normQuote.length < 3) return false;
    return combinedTranscripts.includes(normQuote);
  });

  return {
    ...parsed,
    ideas: validIdeas,
  };
}
