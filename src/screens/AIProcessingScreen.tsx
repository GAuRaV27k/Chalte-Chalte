import React from 'react';
import { motion } from 'motion/react';
import { CloudOff, RotateCcw, Edit, X } from 'lucide-react';

export type AIProcessingMode = 'transcribing' | 'journal';

interface AIProcessingScreenProps {
  mode: AIProcessingMode;
  error?: string | null;
  isWhisperModelActive?: boolean;
  isSavedLocally?: boolean;
  onRetry: () => void;
  onEditTranscript?: () => void;
  onCancel: () => void;
}

export const AIProcessingScreen: React.FC<AIProcessingScreenProps> = ({
  mode,
  error,
  isWhisperModelActive = false,
  isSavedLocally = true,
  onRetry,
  onEditTranscript,
  onCancel,
}) => {
  const isError = Boolean(error);

  const title = isError
    ? 'A pause in the synthesis.'
    : mode === 'transcribing'
      ? 'Listening to your reflections.'
      : 'Gathering your thoughts.';

  const subtitle = isError
    ? mode === 'transcribing'
      ? "Transcription couldn't finish. Try again. Your audio is safely stored on your device."
      : 'Journal generation failed. Your transcript is still available.'
    : mode === 'transcribing'
      ? isWhisperModelActive
        ? 'Turning your voice into words with Whisper.'
        : 'Turning your voice into words.'
      : 'Organizing your reflections without losing your voice.';

  return (
    <div className="flex flex-col min-h-full px-5 pt-3 pb-8 justify-between relative overflow-hidden select-none">
      {/* Header with Cancel button */}
      <header className="flex items-center justify-between py-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A8E6E8] animate-ping" />
          <span className="font-space text-[10px] uppercase tracking-widest text-[#8E97A6] font-semibold">
            {mode === 'transcribing' ? 'Voice Transcription' : 'Dialectical Synthesis'}
          </span>
        </div>
        {!isError && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel border border-white/10 text-[12px] font-inter text-[#8E97A6] hover:text-[#F4F3EF] active:scale-95 transition-all"
            aria-label="Cancel processing"
          >
            <span>Cancel</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {/* Main Center Motif & Copy */}
      <main className="flex flex-col items-center text-center my-auto py-6">
        {/* Motif based on state */}
        {!isError ? (
          <div className="relative w-56 h-56 flex items-center justify-center my-4">
            {/* Concentric luminous rings */}
            <motion.div
              className="absolute w-52 h-52 rounded-full border border-[#A8E6E8]/20"
              animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-40 h-40 rounded-full border border-[#B9B4E8]/25"
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute w-28 h-28 rounded-full glass-panel border border-white/10 flex items-center justify-center">
              {mode === 'transcribing' ? (
                /* Waveform bars */
                <div className="flex items-center gap-1">
                  {[0.4, 0.8, 0.5, 1.0, 0.6, 0.9, 0.4].map((scale, i) => (
                    <motion.span
                      key={i}
                      className="w-1 rounded-full bg-[#A8E6E8]"
                      animate={{ height: [8, 8 * scale * 2.5, 8] }}
                      transition={{
                        duration: 1.2 + i * 0.15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              ) : (
                /* Glass pages settling */
                <div className="flex flex-col items-center gap-1.5 text-[#B9B4E8]">
                  <motion.div
                    className="w-10 h-1.5 rounded-full bg-[#B9B4E8]/70"
                    animate={{ width: [24, 40, 24], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="w-8 h-1 rounded-full bg-white/40"
                    animate={{ width: [16, 32, 16] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  />
                  <motion.div
                    className="w-6 h-1 rounded-full bg-white/20"
                    animate={{ width: [12, 24, 12] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  />
                </div>
              )}
            </div>

            {/* Pulsing rhythm dots (honest indicator, no fake %) */}
            <div className="absolute bottom-2 flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#A8E6E8]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Error Motif */
          <div className="relative w-36 h-36 flex items-center justify-center my-4">
            <div className="absolute inset-0 rounded-full bg-[#E27D7D]/10 blur-xl" />
            <div className="relative w-20 h-20 rounded-2xl glass-panel border border-[#E27D7D]/30 flex items-center justify-center text-[#E27D7D]">
              <CloudOff className="w-9 h-9" />
            </div>
          </div>
        )}

        {/* Headings */}
        <div className="space-y-2 max-w-xs mx-auto">
          <h1 className="font-instrument text-[26px] italic text-[#F4F3EF] leading-snug">
            {title}
          </h1>
          <p className="font-inter text-[13px] text-[#8E97A6] leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Resilience Card for Error — only shown when verifiably saved in local storage */}
        {isError && isSavedLocally && (
          <div className="w-full glass-panel rounded-2xl p-4 border border-white/10 mt-6 text-left">
            <h4 className="font-inter font-semibold text-[13px] text-[#F4F3EF]">
              Nothing was lost
            </h4>
            <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed mt-0.5">
              Your audio recordings and written transcripts remain preserved in your local device storage.
            </p>
          </div>
        )}

        {/* Reassurance Footer when processing */}
        {!isError && (
          <p className="font-instrument italic text-[12px] text-[#5C6473] mt-8">
            “To walk alone is to let silence organize the world.”
          </p>
        )}
      </main>

      {/* Action buttons (only shown when in error state) */}
      {isError ? (
        <footer className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="w-full h-12 bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[15px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry generation</span>
          </button>

          {onEditTranscript && (
            <button
              type="button"
              onClick={onEditTranscript}
              className="w-full h-12 glass-panel border border-white/10 text-[#F4F3EF] font-space font-semibold text-[14px] rounded-full flex items-center justify-center gap-2 hover:border-[#A8E6E8]/40 active:scale-95 transition-all"
            >
              <Edit className="w-4 h-4 text-[#A8E6E8]" />
              <span>Edit transcript manually</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 text-center font-inter text-[13px] text-[#8E97A6] hover:text-[#F4F3EF] active:scale-95 transition-colors"
          >
            Return to review
          </button>
        </footer>
      ) : (
        <div className="pb-4 text-center">
          <span className="font-inter text-[11px] text-[#5C6473]">
            Running locally on-device · Private
          </span>
        </div>
      )}
    </div>
  );
};
