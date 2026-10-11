import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Edit3, Share2, RotateCcw, Trash2, Check, Bookmark, AlertTriangle, MoreVertical
} from 'lucide-react';
import type { JournalEntry, WalkSession } from '../core/types';

interface JournalResultScreenProps {
  journal: JournalEntry;
  session: WalkSession;
  onBack: () => void;
  onSaveJournal: (entry: JournalEntry) => Promise<void>;
  onRegenerate: () => Promise<void>;
  onDeleteSession: () => Promise<void>;
}

export const JournalResultScreen: React.FC<JournalResultScreenProps> = ({
  journal: initialJournal,
  session,
  onBack,
  onSaveJournal,
  onRegenerate,
  onDeleteSession,
}) => {
  const [journal, setJournal] = useState<JournalEntry>(initialJournal);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(journal.title);
  const [editedReflections, setEditedReflections] = useState(journal.myReflections);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(journal.createdAt ? new Date(journal.createdAt) : new Date());

  const handleStartEdit = () => {
    setEditedTitle(journal.title);
    setEditedReflections(journal.myReflections);
    setIsEditing(true);
    setHasUnsavedEdits(false);
  };

  const handleApplyEdits = () => {
    setJournal(prev => ({
      ...prev,
      title: editedTitle,
      myReflections: editedReflections,
      userReflections: editedReflections,
    }));
    setIsEditing(false);
    setHasUnsavedEdits(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveJournal(journal);
      setSaving(false);
      setSaveSuccess(true);
      setHasUnsavedEdits(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaving(false);
      setSaveError(err instanceof Error ? err.message : 'Save failed. Retry.');
    }
  };

  const handleRegen = async () => {
    setRegenerating(true);
    setRegenError(null);
    try {
      await onRegenerate();
      setRegenerating(false);
    } catch (err) {
      setRegenerating(false);
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed. Kept current version.');
    }
  };

  const handleExportText = async () => {
    const textContent = `CHALTE-CHALTE: THE WALKING PHILOSOPHER\nDate: ${dateStr}\nTopic: ${journal.topic} (${journal.durationMinutes} min walk)\n\n${journal.title.toUpperCase()}\n\nMY REFLECTIONS:\n${journal.myReflections}\n\n${
      journal.ideasWorthRevisiting?.length
        ? `IDEAS WORTH REVISITING:\n${journal.ideasWorthRevisiting.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n`
        : ''
    }${
      journal.questionToCarryForward
        ? `A QUESTION TO CARRY FORWARD:\n"${journal.questionToCarryForward}"\n\n`
        : ''
    }${
      journal.oneSmallNextStep
        ? `ONE SMALL NEXT STEP:\n${journal.oneSmallNextStep}\n\n`
        : ''
    }AI-assisted reflection based on local recordings.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: journal.title,
          text: textContent,
        });
        return;
      } catch {
        // Fallback to text file download if user cancels or share fails
      }
    }

    // Fallback .txt file download
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walk-journal-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    if (hasUnsavedEdits || isEditing) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col min-h-full px-5 pt-3 pb-28 relative">
      {/* Top Header */}
      <header className="flex items-center justify-between py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#8E97A6] active:scale-90 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="font-space text-[10px] uppercase tracking-widest text-[#A8E6E8] font-semibold">
              YOUR WALK JOURNAL
            </span>
            <p className="font-inter text-[12px] text-[#8E97A6] mt-0.5">
              {dateStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleStartEdit}
            className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center text-[#8E97A6] hover:text-[#A8E6E8] active:scale-90 transition-transform"
            aria-label="Edit journal"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowOverflow(prev => !prev)}
            className="w-9 h-9 rounded-full glass-panel border border-white/10 flex items-center justify-center text-[#8E97A6] hover:text-[#F4F3EF] active:scale-90 transition-transform"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Overflow Menu Modal */}
      <AnimatePresence>
        {showOverflow && (
          <motion.div
            className="absolute top-16 right-5 z-50 w-48 rounded-2xl bg-[#1B202A] border border-white/10 shadow-2xl py-1 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <button
              type="button"
              onClick={() => {
                setShowOverflow(false);
                handleExportText();
              }}
              className="w-full px-4 py-2.5 text-left text-[12px] font-inter text-[#F4F3EF] hover:bg-white/5 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-[#A8E6E8]" />
              <span>Export as text file</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOverflow(false);
                handleRegen();
              }}
              className="w-full px-4 py-2.5 text-left text-[12px] font-inter text-[#F4F3EF] hover:bg-white/5 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-[#B9B4E8]" />
              <span>Regenerate journal</span>
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button
              type="button"
              onClick={() => {
                setShowOverflow(false);
                setShowDeleteModal(true);
              }}
              className="w-full px-4 py-2.5 text-left text-[12px] font-inter text-[#E27D7D] hover:bg-white/5 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete session</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Success Banner */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 mb-2 rounded-xl bg-[#A8E6E8]/10 border border-[#A8E6E8]/30 flex items-center justify-between text-[#A8E6E8]"
          >
            <span className="font-inter text-[12px] font-semibold">
              ✓ Journal saved locally to device
            </span>
          </motion.div>
        )}
        {saveError && (
          <div className="p-3 mb-2 rounded-xl bg-[#E27D7D]/10 border border-[#E27D7D]/30 flex items-center justify-between text-[#E27D7D]">
            <span className="font-inter text-[12px]">{saveError}</span>
          </div>
        )}
        {regenError && (
          <div className="p-3 mb-2 rounded-xl bg-[#E27D7D]/10 border border-[#E27D7D]/30 flex items-center justify-between text-[#E27D7D]">
            <span className="font-inter text-[12px]">{regenError}</span>
          </div>
        )}
      </AnimatePresence>

      {/* Main Digital Notebook Sheet */}
      <main className="flex-1 space-y-4 pt-1">
        <article className="glass-panel rounded-2xl border border-white/10 p-5 space-y-5 relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#A8E6E8]/40 to-transparent" />

          {/* Title & Metadata Strip */}
          <motion.header
            className="space-y-2 pb-4 border-b border-white/5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-inter text-[11px] text-[#A8E6E8]">
                {session.intention.context} walk
              </span>
              <span className="text-[#5C6473]">·</span>
              <span className="font-inter text-[11px] text-[#8E97A6]">
                {journal.durationMinutes} min
              </span>
              <span className="text-[#5C6473]">·</span>
              <span className="font-inter text-[11px] text-[#8E97A6]">
                {session.intention.topic}
              </span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                className="w-full bg-[#1B202A] text-[#F4F3EF] font-instrument text-[24px] italic p-2 rounded-xl border border-white/20 outline-none"
              />
            ) : (
              <h1 className="font-instrument text-[26px] italic text-[#F4F3EF] leading-snug">
                {journal.title}
              </h1>
            )}

            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-space uppercase tracking-wider text-[#8E97A6]">
                {session.clipsCount || 1} recordings synthesized
              </span>
            </div>
          </motion.header>

          {/* Section 1: "MY REFLECTIONS" */}
          <motion.section
            className="space-y-2 pb-4 border-b border-white/5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="font-space text-[10px] tracking-widest text-[#A8E6E8] uppercase font-semibold block">
              MY REFLECTIONS
            </span>
            {isEditing ? (
              <textarea
                value={editedReflections}
                onChange={e => setEditedReflections(e.target.value)}
                rows={6}
                className="w-full bg-[#1B202A] text-[#F4F3EF] font-inter text-[13px] leading-relaxed p-3 rounded-xl border border-white/20 outline-none resize-none"
              />
            ) : (
              <div className="font-inter text-[13px] text-[#F4F3EF]/90 leading-relaxed whitespace-pre-line space-y-2">
                {journal.myReflections}
              </div>
            )}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-inter text-[#8E97A6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyEdits}
                  className="px-4 py-1.5 rounded-lg bg-[#A8E6E8] text-[#10131B] text-[12px] font-space font-semibold"
                >
                  Done editing
                </button>
              </div>
            )}
          </motion.section>

          {/* Section 2: "IDEAS WORTH REVISITING" (Demo placeholder in mock) */}
          {journal.ideasWorthRevisiting && journal.ideasWorthRevisiting.length > 0 ? (
            <motion.section
              className="space-y-3 pb-4 border-b border-white/5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex justify-between items-center">
                <span className="font-space text-[10px] tracking-widest text-[#A8E6E8] uppercase font-semibold">
                  IDEAS WORTH REVISITING
                </span>
                <span className="font-inter text-[10px] text-[#5C6473]">
                  {journal.ideasWorthRevisiting.length} thoughts
                </span>
              </div>
              <div className="space-y-2">
                {journal.ideasWorthRevisiting.slice(0, 3).map((idea, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#1B202A]/70 border border-white/5 flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#232A38] text-[#A8E6E8] flex items-center justify-center font-space text-[11px] font-semibold shrink-0">
                      {idx + 1}
                    </span>
                    <p className="font-inter text-[12px] text-[#F4F3EF] leading-snug">
                      {idea}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          ) : null}

          {/* Section 3: "A QUESTION TO CARRY FORWARD" */}
          {journal.questionToCarryForward ? (
            <motion.section
              className="space-y-2 pb-4 border-b border-white/5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <span className="font-space text-[10px] tracking-widest text-[#A8E6E8] uppercase font-semibold block">
                A QUESTION TO CARRY FORWARD
              </span>
              <div className="p-4 rounded-xl border border-[#A8E6E8]/30 bg-[#A8E6E8]/5">
                <p className="font-instrument italic text-[18px] text-[#F0E7D5] leading-snug">
                  “{journal.questionToCarryForward}”
                </p>
              </div>
            </motion.section>
          ) : null}

          {/* Section 4: "ONE SMALL NEXT STEP" */}
          {journal.oneSmallNextStep ? (
            <motion.section
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <span className="font-space text-[10px] tracking-widest text-[#A8E6E8] uppercase font-semibold block">
                ONE SMALL NEXT STEP
              </span>
              <div className="p-3.5 rounded-xl bg-[#1B202A]/80 border border-white/5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#A8E6E8]/20 text-[#A8E6E8] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <p className="font-inter text-[13px] text-[#F4F3EF] leading-snug">
                  {journal.oneSmallNextStep}
                </p>
              </div>
            </motion.section>
          ) : null}

          {/* Notebook Footer */}
          <footer className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-inter text-[#5C6473]">
            <span>Saved locally on device</span>
            <span>AI-assisted reflection · Based on your recordings</span>
          </footer>
        </article>

        {/* Utilities Panel */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={handleRegen}
            disabled={regenerating}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl glass-panel border border-white/10 active:scale-95 transition-all text-center"
          >
            <RotateCcw className="w-4 h-4 text-[#B9B4E8]" />
            <span className="font-inter text-[11px] text-[#F4F3EF]">
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleExportText}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl glass-panel border border-white/10 active:scale-95 transition-all text-center"
          >
            <Share2 className="w-4 h-4 text-[#A8E6E8]" />
            <span className="font-inter text-[11px] text-[#F4F3EF]">Export text</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-[#E27D7D]/10 border border-[#E27D7D]/20 active:scale-95 transition-all text-center"
          >
            <Trash2 className="w-4 h-4 text-[#E27D7D]" />
            <span className="font-inter text-[11px] text-[#E27D7D]">Delete</span>
          </button>
        </div>
      </main>

      {/* Fixed Bottom Save & Edit Actions */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto p-4 bg-[#10131B]/95 backdrop-blur-xl border-t border-white/10 flex items-center gap-2.5 z-40">
        <button
          type="button"
          onClick={handleStartEdit}
          className="flex-1 py-3 px-4 rounded-full glass-panel border border-white/10 font-space font-semibold text-[13px] text-[#F4F3EF] active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Edit3 className="w-4 h-4 text-[#8E97A6]" />
          <span>Edit Journal</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-[1.4] py-3 px-4 rounded-full bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[14px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Bookmark className="w-4 h-4" />
          <span>{saving ? 'Saving…' : 'Save to Journal'}</span>
        </button>
      </div>

      {/* Delete Session Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#10131B]/80 backdrop-blur-sm flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-[#1B202A] border border-white/10 rounded-2xl p-5 max-w-xs w-full space-y-3">
              <div className="flex items-center gap-2 text-[#E27D7D]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-space font-semibold text-[15px] text-[#F4F3EF]">
                  Delete this reflection?
                </h3>
              </div>
              <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
                This will irreversibly delete the synthesized journal and associated session data.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-full glass-panel border border-white/10 font-space text-[12px] text-[#F4F3EF]"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowDeleteModal(false);
                    await onDeleteSession();
                  }}
                  className="flex-1 py-2 rounded-full bg-[#E27D7D]/20 border border-[#E27D7D]/50 text-[#E27D7D] font-space text-[12px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Guard Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#10131B]/80 backdrop-blur-sm flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-[#1B202A] border border-white/10 rounded-2xl p-5 max-w-xs w-full space-y-3">
              <h3 className="font-space font-semibold text-[15px] text-[#F4F3EF]">
                Unsaved edits
              </h3>
              <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
                You have unsaved changes to this journal. Do you want to leave without saving?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2 rounded-full glass-panel border border-white/10 font-space text-[12px] text-[#F4F3EF]"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onBack();
                  }}
                  className="flex-1 py-2 rounded-full bg-[#E27D7D]/20 border border-[#E27D7D]/50 text-[#E27D7D] font-space text-[12px]"
                >
                  Leave
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
