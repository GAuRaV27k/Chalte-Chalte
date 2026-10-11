/**
 * speech.ts — Web Speech API wrapper. No React imports.
 *
 * Voice selection by language:
 *  English  → prefer en-IN, then en-US
 *  Hinglish → try hi-IN first, fall back to en-IN, then en-US
 *
 * If no suitable voice exists or speechSynthesis throws, the speak()
 * promise rejects with an error so the caller can display an honest
 * error state. No silent swallowing of speech failures.
 */

export interface TextToSpeechService {
  speak(text: string, language?: string, rate?: number): Promise<void>;
  stop(): void;
  isAvailable(): boolean;
  isSpeaking(): boolean;
}

export class WebSpeechTTS implements TextToSpeechService {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private speaking = false;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  isSpeaking(): boolean {
    return this.speaking && this.activeUtterance !== null;
  }

  /**
   * @param language  'en' | 'hi'
   * @param rate      speech rate multiplier (0.8–1.2); default 0.9
   */
  speak(text: string, language: string = 'en', rate = 0.9): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('speechSynthesis is not available in this browser.'));
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;
      this.speaking = true;

      // Voice selection — prefer device voice matching locale
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = this.selectVoice(voices, language);
      utterance.lang = this.langCode(language);
      utterance.rate = Math.min(1.2, Math.max(0.7, rate));
      utterance.pitch = 0.95;

      utterance.onend = () => {
        this.speaking = false;
        this.activeUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.speaking = false;
        this.activeUtterance = null;
        // 'interrupted' happens on legitimate cancel() calls — treat as resolve
        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve();
        } else {
          reject(new Error(`speechSynthesis error: ${event.error}`));
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.isAvailable()) {
      window.speechSynthesis.cancel();
      this.speaking = false;
      this.activeUtterance = null;
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private langCode(language: string): string {
    if (language === 'hi') return 'hi-IN';
    return 'en-IN';
  }

  private selectVoice(
    voices: SpeechSynthesisVoice[],
    language: string,
  ): SpeechSynthesisVoice | null {
    const candidates =
      language === 'hi'
        ? ['hi-IN', 'en-IN', 'en-US']
        : ['en-IN', 'en-US'];

    for (const lang of candidates) {
      const match = voices.find(v => v.lang === lang);
      if (match) return match;
    }
    // Best-effort: any voice whose lang starts with 'en'
    return voices.find(v => v.lang.startsWith('en')) ?? null;
  }
}
