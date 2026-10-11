import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, ArrowRight, Trash2, AlertTriangle } from 'lucide-react';
import type { WalkSession } from '../core/types';

interface WalkCompletionScreenProps {
  session: WalkSession;
  clipsCount: number;
  onReviewReflections: () => void;
  onSaveWalk: () => Promise<void>;
  onDiscardSession: () => Promise<void>;
}

export const WalkCompletionScreen: React.FC<WalkCompletionScreenProps> = ({
  session,
  clipsCount,
  onReviewReflections,
  onSaveWalk,
  onDiscardSession,
}) => {
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const durationMin = Math.max(1, Math.round(session.elapsedSeconds / 60));
  const questionsCount = session.questionsDelivered.length || 3;

  // Format session date
  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(session.createdAt ? new Date(session.createdAt) : new Date());

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveWalk();
      setSaving(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaving(false);
      setSaveError(err instanceof Error ? err.message : 'Failed to save walk.');
    }
  };

  const handleConfirmDiscard = async () => {
    setShowDiscardModal(false);
    await onDiscardSession();
  };

  return (
    <div className="flex flex-col min-h-full px-5 pt-3 pb-8 justify-between relative overflow-hidden">
      {/* Top Header / Notification Pill preview */}
      <div className="w-full pt-1 pb-2">
        <div className="glass-panel rounded-2xl p-3 border border-white/10 flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#1B202A] border border-white/10 flex items-center justify-center text-[#A8E6E8] shrink-0">
            <span className="text-[12px]">✦</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-space tracking-widest text-[#8E97A6] uppercase font-semibold">
              SYSTEM · COMPLETED
            </span>
            <p className="font-inter text-[12px] text-[#F4F3EF] leading-snug mt-0.5">
              <span className="font-semibold text-[#A8E6E8]">Chalte-Chalte:</span> Your walk is complete. Your reflections are ready whenever you are.
            </p>
          </div>
        </div>
      </div>

      {/* Core Content: Concentric Breathing Motif & Contemplative Copy */}
      <main className="flex flex-col items-center text-center my-auto py-4">
        {/* Slow peaceful concentric breathing aura */}
        <div className="relative w-28 h-28 my-2 flex items-center justify-center pointer-events-none select-none">
          <motion.div
            className="absolute inset-0 rounded-full border border-[#B9B4E8]/20 bg-[#B9B4E8]/5"
            animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-[#A8E6E8]/30 bg-[#A8E6E8]/5"
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative w-12 h-12 rounded-full glass-panel border border-[#A8E6E8]/60 flex items-center justify-center shadow-[0_0_24px_rgba(168,230,232,0.25)] text-[#A8E6E8]">
            <span className="text-[20px]">𓂠</span>
          </div>
        </div>

        {/* Headings */}
        <motion.div
          className="space-y-1 mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="font-space text-[11px] text-[#A8E6E8] tracking-[0.2em] uppercase font-semibold">
            WALK COMPLETE
          </p>
          <h1 className="font-instrument text-[28px] italic text-[#F4F3EF] tracking-tight leading-tight">
            You made space for yourself.
          </h1>
          <p className="font-inter text-[13px] text-[#8E97A6] max-w-xs mx-auto leading-relaxed mt-1">
            Your walk is over. Your thoughts are yours to keep.
          </p>
        </motion.div>

        {/* Summary Card (Bento Grid matching Stitch) */}
        <motion.div
          className="w-full glass-panel rounded-2xl border border-white/10 p-4 text-left shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        >
          {/* Top Row: Context & Date */}
          <div className="pb-3 border-b border-white/5 flex items-center justify-between">
            <div>
              <span className="block font-inter font-semibold text-[13px] text-[#F4F3EF] truncate">
                {session.intention.topic}
              </span>
              <span className="block font-inter text-[11px] text-[#8E97A6]">
                {dateStr}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-space uppercase text-[#B9B4E8] bg-[#B9B4E8]/10 border border-[#B9B4E8]/20">
              {session.intention.context} loop
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-3.5">
            {/* Metric 1: Duration */}
            <div className="p-2.5 rounded-xl bg-[#1B202A]/70 border border-white/5 flex flex-col justify-between">
              <span className="font-inter text-[11px] text-[#8E97A6]">Duration</span>
              <div>
                <span className="font-space text-[20px] font-semibold text-[#F4F3EF] leading-tight block">
                  {durationMin}<span className="text-[12px] font-normal text-[#8E97A6] ml-0.5">m</span>
                </span>
                <span className="font-inter text-[10px] text-[#5C6473]">Mindful pace</span>
              </div>
            </div>

            {/* Metric 2: Questions */}
            <div className="p-2.5 rounded-xl bg-[#1B202A]/70 border border-white/5 flex flex-col justify-between">
              <span className="font-inter text-[11px] text-[#8E97A6]">Inquiries</span>
              <div>
                <span className="font-space text-[20px] font-semibold text-[#F4F3EF] leading-tight block">
                  {questionsCount}<span className="text-[12px] font-normal text-[#8E97A6] ml-0.5">q</span>
                </span>
                <span className="font-inter text-[10px] text-[#5C6473]">Unrushed</span>
              </div>
            </div>

            {/* Metric 3: Voice Clips */}
            <div className="p-2.5 rounded-xl bg-[#1B202A]/70 border border-white/5 flex flex-col justify-between">
              <span className="font-inter text-[11px] text-[#8E97A6]">Spoken</span>
              <div>
                <span className="font-space text-[20px] font-semibold text-[#F4F3EF] leading-tight block">
                  {clipsCount}<span className="text-[12px] font-normal text-[#8E97A6] ml-0.5">clips</span>
                </span>
                <span className="font-inter text-[10px] text-[#5C6473]">Recorded</span>
              </div>
            </div>
          </div>

          {/* Philosophical Anchor Quote */}
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2">
            <p className="font-instrument italic text-[13px] text-[#8E97A6] truncate">
              “Solvitur ambulando — it is solved by walking.”
            </p>
          </div>
        </motion.div>
      </main>

      {/* Bottom Interactive Actions */}
      <footer className="w-full space-y-2.5 pt-2">
        {/* Primary Action: Save My Walk */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || saveSuccess}
          className="w-full h-12 bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[15px] rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,230,232,0.25)] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Bookmark className="w-4 h-4 text-[#10131B]" />
          <span>
            {saving ? 'Saving locally…' : saveSuccess ? '✓ Walk saved' : 'Save my walk'}
          </span>
        </button>

        {/* Secondary Action: Review My Reflections */}
        <button
          type="button"
          onClick={onReviewReflections}
          className="w-full h-12 glass-panel border border-white/10 hover:border-[#A8E6E8]/40 text-[#F4F3EF] font-space font-semibold text-[15px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>Review my reflections</span>
          <ArrowRight className="w-4 h-4 text-[#A8E6E8]" />
        </button>

        {/* Error message with retry */}
        {saveError && (
          <p className="text-[12px] text-[#E27D7D] text-center">
            {saveError} —{' '}
            <button type="button" onClick={handleSave} className="underline">
              Retry
            </button>
          </p>
        )}

        {/* Tertiary Ghost Action: Discard session with confirm */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="text-[12px] font-inter text-[#5C6473] hover:text-[#E27D7D] inline-flex items-center gap-1.5 active:scale-95 transition-colors py-1 px-3"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard session</span>
          </button>
        </div>
      </footer>

      {/* Discard Confirmation Modal */}
      <AnimatePresence>
        {showDiscardModal && (
          <motion.div
            className="absolute inset-0 z-50 bg-[#10131B]/85 backdrop-blur-md flex flex-col justify-end p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1B202A] border border-[#E27D7D]/30 rounded-2xl p-4 shadow-2xl mb-4 space-y-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-[#E27D7D]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-space font-semibold text-[15px] text-[#F4F3EF]">
                  Discard this walk?
                </h3>
              </div>
              <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
                Your {durationMin}-minute walk metrics and {clipsCount} spoken clips will be permanently dissolved into thin air.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="flex-1 h-11 glass-panel border border-white/10 rounded-full font-space font-semibold text-[13px] text-[#F4F3EF] hover:bg-white/5 active:scale-95 transition-all"
                >
                  Keep walk
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="flex-1 h-11 bg-[#E27D7D]/20 border border-[#E27D7D]/50 text-[#E27D7D] rounded-full font-space font-semibold text-[13px] active:scale-95 transition-all"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
