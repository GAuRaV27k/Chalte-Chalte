import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET /v1/health
  http.get('*/v1/health', () => {
    return HttpResponse.json({
      requestId: 'test-health-req-id',
      status: 'healthy',
      version: '1.0.0',
      models: {
        questions: { name: 'gemma-2-9b-it', ready: true },
        transcribe: { name: 'whisper-large-v3', ready: true },
        journal: { name: 'gemma-2-9b-it', ready: true },
      },
    });
  }),

  // POST /v1/questions
  http.post('*/v1/questions', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (body.testError === 'model_unavailable') {
      return HttpResponse.json(
        {
          requestId: 'test-questions-err-id',
          error: {
            code: 'model_unavailable',
            message: 'Inference engine is warming up',
            retryable: true,
          },
        },
        { status: 503 }
      );
    }

    if (body.testError === 'rate_limited') {
      return HttpResponse.json(
        {
          requestId: 'test-questions-rl-id',
          error: {
            code: 'rate_limited',
            message: 'Rate limit exceeded',
            retryable: true,
          },
        },
        { status: 429, headers: { 'Retry-After': '1' } }
      );
    }

    if (![10, 20, 30].includes(body.durationMinutes as number)) {
      return HttpResponse.json(
        {
          requestId: 'test-questions-invalid-id',
          error: {
            code: 'invalid_request',
            message: "Field 'durationMinutes' must be 10, 20, or 30.",
            retryable: false,
          },
        },
        { status: 422 }
      );
    }

    return HttpResponse.json({
      requestId: 'test-questions-req-id',
      model: 'gemma-2-9b-it',
      questions: [
        {
          id: 'q-api-1',
          text: 'Where does stillness begin in your steps?',
        },
        {
          id: 'q-api-2',
          text: 'What is within your immediate control today?',
        },
        {
          id: 'q-api-3',
          text: 'What expectation are you ready to lay down?',
        },
      ],
    });
  }),

  // POST /v1/transcribe
  http.post('*/v1/transcribe', async ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('testError') === 'payload_too_large') {
      return HttpResponse.json(
        {
          requestId: 'test-transcribe-413-id',
          error: {
            code: 'payload_too_large',
            message: 'Audio file exceeds 10 MB limit',
            retryable: false,
          },
        },
        { status: 413 }
      );
    }

    return HttpResponse.json({
      requestId: 'test-transcribe-req-id',
      model: 'whisper-large-v3',
      text: 'I realized walking past the old trees that urgency was borrowed anxiety. My natural pace is enough.',
      language: 'en',
      durationSec: 14.2,
    });
  }),

  // POST /v1/journal
  http.post('*/v1/journal', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (body.testError === 'timeout') {
      return HttpResponse.json(
        {
          requestId: 'test-journal-timeout-id',
          error: {
            code: 'timeout',
            message: 'Synthesis execution timed out',
            retryable: true,
          },
        },
        { status: 504 }
      );
    }

    const transcripts = (body.transcripts as Array<{ clipId: string; text: string }>) || [];
    const firstText = transcripts[0]?.text || '';

    return HttpResponse.json({
      requestId: 'test-journal-req-id',
      model: 'gemma-2-9b-it',
      title: 'The Architecture of Natural Pacing',
      reflections: [
        'You observed that your speed was dictated by anticipation rather than presence.',
        'Walking allowed thoughts to settle into manageable clarity.',
      ],
      ideas: [
        {
          text: 'Urgency functions as borrowed anxiety.',
          // Use a quote substring from the first transcript if available
          supportingQuote: firstText.includes('urgency was borrowed anxiety')
            ? 'urgency was borrowed anxiety'
            : firstText.slice(0, 20) || 'urgency',
        },
      ],
      question: 'What rhythm will you preserve when this walk concludes?',
      nextStep: 'Give yourself two minutes of stillness before speaking.',
    });
  }),
];
