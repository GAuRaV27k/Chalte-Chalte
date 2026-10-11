import type { RecordedClip, TranscriptFragment } from '../types';

export interface Transcriber {
  transcribe(clip: RecordedClip): Promise<TranscriptFragment>;
}

export class MockTranscriber implements Transcriber {
  async transcribe(clip: RecordedClip): Promise<TranscriptFragment> {
    // Simulate slight processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      id: `tr-${Date.now()}`,
      clipId: clip.id,
      text: 'I realized that the urgency I felt earlier was just borrowed anxiety. As I walk, my breath has slowed down, and the actual problem feels manageable.',
      isMock: true,
      timestamp: Date.now(),
    };
  }
}
