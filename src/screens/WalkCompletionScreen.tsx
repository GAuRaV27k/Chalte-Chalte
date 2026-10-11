/**
 * WalkCompletionScreen — Phase 2 placeholder.
 *
 * Shows real counts from the completed session.
 * Full completion UI (clips, playback, transcripts, journal) is Phase 3.
 */
import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import type { WalkSession } from '../core/types';

interface WalkCompletionScreenProps {
  session: WalkSession;
  clipsCount: number;
  onGoHome: () => void;
}

export const WalkCompletionScreen: React.FC<WalkCompletionScreenProps> = ({
  session,
  clipsCount,
  onGoHome,
}) => {
  const durationMin = Math.floor(session.elapsedSeconds / 60);
  const durationSec = session.elapsedSeconds % 60;
  const questionsPlayed = session.questionsDelivered.length;

  return (
    <div className="flex flex-col min-h-full items-center justify-center px-6 pb-16 pt-10 gap-8">
      <motion.div
        className="flex flex-col items-center gap-6 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <CheckCircle2 className="w-16 h-16 text-[#A8E6E8]" />

        <div>
          <p className="font-space text-[11px] uppercase tracking-widest text-[#A8E6E8] font-semibold mb-1">
            Walk complete
          </p>
          <h1 className="font-instrument text-[32px] italic text-[#F4F3EF] leading-tight">
            Well done, walker.
          </h1>
          <p className="font-inter text-[13px] text-[#8E97A6] mt-2 leading-relaxed">
            Your session has been saved to local storage.
          </p>
        </div>

        {/* Real session stats */}
        <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-inter text-[12px] text-[#8E97A6]">Duration walked</span>
            <span className="font-space text-[14px] font-bold text-[#F4F3EF] tabular-nums">
              {durationMin}m {durationSec}s
            </span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="font-inter text-[12px] text-[#8E97A6]">Questions reflected on</span>
            <span className="font-space text-[14px] font-bold text-[#F4F3EF]">
              {questionsPlayed} / 3
            </span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="font-inter text-[12px] text-[#8E97A6]">Voice clips saved</span>
            <span className="font-space text-[14px] font-bold text-[#F4F3EF]">
              {clipsCount}
            </span>
          </div>
        </div>

        <p className="font-inter text-[12px] text-[#5C6473] text-center leading-relaxed max-w-[260px]">
          Reflection Review, AI Processing, and Journal are coming in Phase 3.
        </p>
      </motion.div>

      <button
        type="button"
        onClick={onGoHome}
        className="w-full max-w-[280px] py-4 rounded-2xl bg-[#A8E6E8]/15 border border-[#A8E6E8]/30 text-[#A8E6E8] font-space text-[14px] font-bold active:scale-95 transition-transform"
      >
        Back to Home
      </button>
    </div>
  );
};
