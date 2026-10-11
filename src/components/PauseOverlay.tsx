/**
 * PauseOverlay
 *
 * Glass overlay per Stitch design:
 *  "Take your time." / "Your walk is paused. Resume whenever you're ready."
 *  Paused timer, Resume (primary), End walk (secondary).
 *
 * Motion rules:
 *  - Fade in with opacity only (no blur animation)
 *  - Static backdrop-filter blur on the element class, never animated
 */
import React from 'react';
import { motion } from 'motion/react';
import { Play, Square } from 'lucide-react';

interface PauseOverlayProps {
  remainingSec: number;
  onResume: () => void;
  onEndWalk: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  remainingSec,
  onResume,
  onEndWalk,
}) => {
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = String(remainingSec % 60).padStart(2, '0');

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Static blur backdrop — class-based, never animated */}
      <div className="absolute inset-0 bg-[#10131B]/75 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-[300px]">
        {/* Paused time */}
        <div className="text-center">
          <p className="font-inter text-[11px] uppercase tracking-widest text-[#5C6473] font-semibold mb-1">
            Paused · Remaining
          </p>
          <p className="font-space text-[42px] font-bold text-[#F4F3EF] tabular-nums leading-none">
            {mm}:{ss}
          </p>
        </div>

        {/* Copy from Stitch design */}
        <div className="text-center space-y-1">
          <p className="font-instrument text-[24px] italic text-[#F4F3EF]/90 leading-tight">
            Take your time.
          </p>
          <p className="font-inter text-[13px] text-[#8E97A6] leading-snug">
            Your walk is paused. Resume whenever you're ready.
          </p>
        </div>

        {/* Resume — primary */}
        <button
          type="button"
          onClick={onResume}
          className="w-full py-4 rounded-2xl bg-[#A8E6E8]/15 border border-[#A8E6E8]/30 flex items-center justify-center gap-2.5 text-[#A8E6E8] font-space text-[15px] font-bold active:scale-95 transition-transform"
        >
          <Play className="w-5 h-5 fill-[#A8E6E8]" />
          Resume walk
        </button>

        {/* End walk — secondary */}
        <button
          type="button"
          onClick={onEndWalk}
          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-[#8E97A6] font-space text-[13px] font-semibold active:scale-95 transition-transform"
        >
          <Square className="w-4 h-4" />
          End walk
        </button>
      </div>
    </motion.div>
  );
};
