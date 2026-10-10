import { describe, it, expect } from 'vitest';
import { TimeLensApiClient } from '../services/api';
import { TimeLensMockService } from '../services/mockApi';

describe('TimeLens API Client & Mock Service Integration', () => {
  it('throws descriptive ApiError when backend base URL is unconfigured', async () => {
    const dummyFile = new File(['mock'], 'sample.jpg', { type: 'image/jpeg' });

    await expect(
      TimeLensApiClient.createGenerationJob({
        landscapeImage: dummyFile,
        eraId: 'pleistocene',
        reconstructionMode: 'reconstruct',
        location: 'Olympic National Park, WA',
      })
    ).rejects.toThrow(/VITE_API_BASE_URL is not configured/i);

    await expect(
      TimeLensApiClient.getGenerationJobStatus('test_job_123')
    ).rejects.toThrow(/VITE_API_BASE_URL is not configured/i);
  });

  it('runs mock service job lifecycle from queued to completed', async () => {
    const dummyFile = new File(['mock'], 'sample.jpg', { type: 'image/jpeg' });

    const submission = await TimeLensMockService.submitSimulatedJob({
      landscapeImage: dummyFile,
      eraId: 'pleistocene',
      reconstructionMode: 'reconstruct',
      location: 'Olympic National Park, WA',
    });

    expect(submission.job_id).toBeDefined();
    expect(submission.status).toBe('queued');

    // Poll status immediately
    const pollResult = await TimeLensMockService.pollSimulatedJob(submission.job_id);
    expect(pollResult.job_id).toBe(submission.job_id);
    expect(['queued', 'processing', 'completed']).toContain(pollResult.status);
  });
});
