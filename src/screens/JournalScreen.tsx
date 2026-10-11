import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowRight,
  Mic,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  X,
  Compass,
} from 'lucide-react';
import type { JournalEntry, RecordedClip } from '../core/types';
import { getClipsForSession, getTranscriptsForClip, saveJournal, deleteJournal } from '../core/storage';

interface JournalScreenProps {
  journals: JournalEntry[];
  onSelectEntry?: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onStartFirstWalk: () => void;
}


export const JournalScreen: React.FC<JournalScreenProps> = ({
  journals,
  onDeleteEntry,
  onStartFirstWalk,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Topic chips derived dynamically from real topics of saved sessions
  const dynamicTopicChips = useMemo(() => {
    const topicSet = new Set<string>();
    for (const j of journals) {
      if (j.topic && j.topic.trim()) {
        topicSet.add(j.topic.trim());
      }
    }
    return ['All', ...Array.from(topicSet)];
  }, [journals]);

  // Detail view state
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [clipsForActive, setClipsForActive] = useState<RecordedClip[]>([]);
  const [transcriptsForActive, setTranscriptsForActive] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedReflections, setEditedReflections] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Audio playback in detail modal
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load clips & transcripts when opening an entry
  useEffect(() => {
    if (!activeEntry) {
      setClipsForActive([]);
      setTranscriptsForActive({});
      setIsEditing(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingClipId(null);
      return;
    }

    setEditedReflections(activeEntry.myReflections || '');

    async function loadDetails() {
      if (!activeEntry) return;
      const clips = await getClipsForSession(activeEntry.sessionId);
      setClipsForActive(clips);

      const trMap: Record<string, string> = {};
      for (const c of clips) {
        const trs = await getTranscriptsForClip(c.id);
        if (trs.length > 0) {
          trMap[c.id] = trs[0].text;
        }
      }
      setTranscriptsForActive(trMap);
    }

    loadDetails();
  }, [activeEntry]);

  // Filter journals
  const filteredJournals = useMemo(() => {
    return journals.filter((entry) => {
      // Topic match
      if (selectedTopic !== 'All') {
        const topicNorm = (entry.topic || '').toLowerCase();
        if (!topicNorm.includes(selectedTopic.toLowerCase())) {
          return false;
        }
      }

      // Search match: title, topic, journal text, and transcripts
      if (debouncedQuery) {
        const titleMatch = (entry.title || '').toLowerCase().includes(debouncedQuery);
        const topicMatch = (entry.topic || '').toLowerCase().includes(debouncedQuery);
        const reflectionMatch = (entry.myReflections || '').toLowerCase().includes(debouncedQuery);
        const userReflMatch = (entry.userReflections || '').toLowerCase().includes(debouncedQuery);
        const coreMatch = (entry.coreInsight || '').toLowerCase().includes(debouncedQuery);
        const questionsMatch = (entry.questionsReflected || []).some(q => q.toLowerCase().includes(debouncedQuery));
        return titleMatch || topicMatch || reflectionMatch || userReflMatch || coreMatch || questionsMatch;
      }

      return true;
    });
  }, [journals, selectedTopic, debouncedQuery]);

  // Play clip in detail modal
  const handleTogglePlayClip = (clip: RecordedClip) => {
    if (playingClipId === clip.id) {
      audioRef.current?.pause();
      setPlayingClipId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = URL.createObjectURL(clip.audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingClipId(clip.id);

    audio.onended = () => {
      setPlayingClipId(null);
      URL.revokeObjectURL(audioUrl);
    };

    audio.play().catch(() => {
      setPlayingClipId(null);
    });
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    if (!activeEntry) return;
    const textToCopy = `Chalte-Chalte Reflection: ${activeEntry.title}\nDate: ${new Date(
      activeEntry.createdAt
    ).toLocaleDateString()}\nTopic: ${activeEntry.topic}\n\nReflections:\n${
      activeEntry.myReflections
    }\n\nQuestions Reflected:\n${activeEntry.questionsReflected.join('\n')}`;

    navigator.clipboard?.writeText(textToCopy).then(() => {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    });
  };

  // Export as .txt download
  const handleDownloadText = () => {
    if (!activeEntry) return;
    const text = `Chalte-Chalte: ${activeEntry.title}\nDate: ${new Date(
      activeEntry.createdAt
    ).toISOString()}\nTopic: ${activeEntry.topic}\n\n${activeEntry.myReflections}`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${activeEntry.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save edited reflections
  const handleSaveEdit = async () => {
    if (!activeEntry) return;
    const updated: JournalEntry = {
      ...activeEntry,
      myReflections: editedReflections,
      userReflections: editedReflections,
    };
    await saveJournal(updated);
    setActiveEntry(updated);
    setIsEditing(false);
  };

  // Delete active entry
  const handleDeleteActive = async () => {
    if (!activeEntry) return;
    await deleteJournal(activeEntry.id);
    onDeleteEntry(activeEntry.id);
    setShowDeleteConfirm(false);
    setActiveEntry(null);
  };

  return (
    <div className="flex flex-col min-h-full pb-28 px-5 pt-3 select-none">
      {/* App Header */}
      <header className="flex justify-between items-center w-full py-3 shrink-0">
        <div>
          <span className="font-space text-[10px] uppercase tracking-widest text-[#A8E6E8] font-semibold">
            Walking Philosopher
          </span>
          <h1 className="font-space text-[24px] font-bold text-[#F4F3EF] tracking-tight leading-tight">
            My Journal
          </h1>
          <p className="text-[12px] font-inter text-[#8E97A6] leading-none mt-0.5">
            A record of the thoughts you chose to keep
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#8E97A6] hover:text-[#A8E6E8] active:scale-95 transition-all"
            aria-label="Search journals"
          >
            <Search className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-space font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-[#8E97A6]">
            {journals.length} {journals.length === 1 ? 'Entry' : 'Entries'}
          </span>
        </div>
      </header>

      {/* Expandable Search Input */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-2 pb-1"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E97A6] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections, quotes, thoughts…"
                autoFocus
                className="w-full bg-[#1B202A] border border-white/10 rounded-full pl-10 pr-10 py-2 text-[13px] text-[#F4F3EF] placeholder-[#5C6473] outline-none focus:border-[#A8E6E8]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#8E97A6] hover:text-[#F4F3EF]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topic Filter Chips matching Stitch */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar shrink-0">
        {dynamicTopicChips.map((chip) => {
          const active = selectedTopic === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setSelectedTopic(chip)}
              className={`px-3.5 py-1 rounded-full text-[12px] font-inter whitespace-nowrap transition-all active:scale-95 ${
                active
                  ? 'bg-[#A8E6E8] text-[#10131B] font-semibold shadow-[0_0_12px_rgba(168,230,232,0.25)]'
                  : 'bg-[#1B202A]/80 border border-white/5 text-[#8E97A6] hover:text-[#F4F3EF]'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Main Journal Feed */}
      <div className="space-y-4 pt-2 flex-1">
        {filteredJournals.length === 0 ? (
          /* Empty State matching Stitch System States */
          <div className="my-auto py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1B202A] border border-white/10 flex items-center justify-center text-[#A8E6E8] shadow-xl">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-instrument text-[24px] italic text-[#F4F3EF]">
                {journals.length === 0 ? 'The Solitary Path' : 'No reflections matched'}
              </h2>
              <p className="font-inter text-[13px] text-[#8E97A6] max-w-xs mt-1 leading-relaxed">
                {journals.length === 0
                  ? 'Your story starts with a walk. No saved reflections yet.'
                  : `No saved entries found for "${searchQuery || selectedTopic}".`}
              </p>
            </div>
            {journals.length === 0 && (
              <button
                type="button"
                onClick={onStartFirstWalk}
                className="py-3 px-6 rounded-full bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[14px] flex items-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,230,232,0.25)]"
              >
                <span>Begin First Walk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Staggered Entry Cards */
          filteredJournals.map((entry, idx) => {
            const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                onClick={() => setActiveEntry(entry)}
                className="glass-panel rounded-2xl border border-white/10 p-4 space-y-3 cursor-pointer hover:border-[#A8E6E8]/40 active:scale-98 transition-all text-left group"
              >
                {/* Top Row: Topic Pill & Duration */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B9B4E8]/10 text-[#B9B4E8] border border-[#B9B4E8]/20 font-inter font-medium">
                    {entry.topic}
                  </span>
                  <span className="text-[#8E97A6] flex items-center gap-1 font-inter">
                    <Clock className="w-3 h-3" />
                    <span>{entry.durationMinutes} min walk</span>
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-instrument text-[22px] text-[#F4F3EF] leading-snug tracking-tight group-hover:text-[#A8E6E8] transition-colors">
                  {entry.title}
                </h2>

                {/* Date & Subtext */}
                <div className="text-[11px] font-inter text-[#8E97A6] flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{dateStr}</span>
                </div>

                {/* Excerpt / Preview */}
                <p className="font-inter text-[13px] text-[#A0A9B8] line-clamp-2 leading-relaxed">
                  {entry.myReflections || entry.coreInsight}
                </p>

                {/* Bottom Row: Clips count and arrow */}
                <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#8E97A6]">
                    <Mic className="w-3.5 h-3.5 text-[#A8E6E8]" />
                    <span>{entry.questionsReflected?.length || 1} prompts reflected</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#8E97A6] group-hover:text-[#A8E6E8] group-hover:bg-[#A8E6E8]/10 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.article>
            );
          })
        )}
      </div>

      {/* Detail Slide-over / Modal */}
      {activeEntry && (
        <div className="fixed inset-0 z-50 bg-[#10131B]/90 backdrop-blur-xl flex flex-col justify-between max-w-[440px] mx-auto text-left">
          {/* Detail Header */}
          <header className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveEntry(null)}
              className="p-2 -ml-2 rounded-full text-[#8E97A6] hover:text-[#F4F3EF] active:scale-95"
              aria-label="Close detail"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-space text-[10px] uppercase tracking-widest text-[#A8E6E8] font-semibold">
              Entry Detail
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyText}
                className="p-2 rounded-full text-[#8E97A6] hover:text-[#A8E6E8]"
                title="Copy text"
                aria-label="Copy text"
              >
                {copiedNotice ? <Check className="w-4 h-4 text-[#A8E6E8]" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleDownloadText}
                className="p-2 rounded-full text-[#8E97A6] hover:text-[#A8E6E8]"
                title="Export .txt"
                aria-label="Export .txt"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-full text-[#8E97A6] hover:text-[#E27D7D]"
                title="Delete reflection"
                aria-label="Delete reflection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Scrollable Detail Body */}
          <div className="overflow-y-auto p-5 space-y-5 flex-1">
            {/* Meta Strip */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-space uppercase bg-[#B9B4E8]/10 text-[#B9B4E8] border border-[#B9B4E8]/20 font-semibold">
                  {activeEntry.topic}
                </span>
                <span className="text-[11px] font-inter text-[#8E97A6]">
                  {activeEntry.durationMinutes} min walk
                </span>
              </div>
              <h1 className="font-instrument text-[26px] italic text-[#F4F3EF] leading-snug">
                {activeEntry.title}
              </h1>
              <p className="text-[11px] font-inter text-[#8E97A6]">
                {new Date(activeEntry.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Reflections Body */}
            <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex justify-between items-center pb-1 border-b border-white/5">
                <span className="text-[10px] font-space uppercase tracking-widest text-[#8E97A6] font-semibold">
                  Synthesized Reflections
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="text-[11px] font-inter text-[#A8E6E8] flex items-center gap-1 hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-1">
                  <textarea
                    value={editedReflections}
                    onChange={(e) => setEditedReflections(e.target.value)}
                    rows={6}
                    className="w-full bg-[#1B202A] border border-white/10 rounded-xl p-3 text-[13px] text-[#F4F3EF] font-inter leading-relaxed outline-none focus:border-[#A8E6E8]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-full bg-white/5 text-[12px] text-[#8E97A6]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-4 py-1.5 rounded-full bg-[#A8E6E8] text-[#10131B] text-[12px] font-semibold"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[14px] font-inter text-[#F4F3EF] leading-relaxed whitespace-pre-wrap pt-1">
                  {activeEntry.myReflections}
                </div>
              )}
            </div>

            {/* Ideas Worth Revisiting (if any) */}
            {activeEntry.ideasWorthRevisiting && activeEntry.ideasWorthRevisiting.length > 0 && (
              <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-2">
                <span className="text-[10px] font-space uppercase tracking-widest text-[#B9B4E8] font-semibold block">
                  Ideas Worth Revisiting
                </span>
                <ul className="space-y-2">
                  {activeEntry.ideasWorthRevisiting.map((idea, i) => (
                    <li key={i} className="text-[13px] font-inter text-[#F4F3EF] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B9B4E8] mt-2 shrink-0" />
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Step / Question to carry forward */}
            {(activeEntry.questionToCarryForward || activeEntry.oneSmallNextStep) && (
              <div className="p-4 rounded-2xl bg-[#1B202A]/70 border border-white/5 space-y-2 text-[13px]">
                {activeEntry.questionToCarryForward && (
                  <div>
                    <span className="text-[10px] font-space uppercase tracking-wider text-[#A8E6E8] font-semibold block">
                      Inquiry to Carry Forward
                    </span>
                    <p className="font-instrument italic text-[16px] text-[#F4F3EF] mt-0.5">
                      “{activeEntry.questionToCarryForward}”
                    </p>
                  </div>
                )}
                {activeEntry.oneSmallNextStep && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] font-space uppercase tracking-wider text-[#F0E7D5] font-semibold block">
                      One Small Next Step
                    </span>
                    <p className="font-inter text-[#F4F3EF] mt-0.5">
                      {activeEntry.oneSmallNextStep}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Original Spoken Audio Clips */}
            {clipsForActive.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-space uppercase tracking-widest text-[#8E97A6] font-semibold block">
                  Original Voice Clips ({clipsForActive.length})
                </span>
                {clipsForActive.map((clip, i) => {
                  const isPlayingThis = playingClipId === clip.id;
                  const transcriptText = transcriptsForActive[clip.id];
                  const durationSec = Math.round(clip.durationMs / 1000);

                  return (
                    <div
                      key={clip.id}
                      className="p-3 rounded-xl bg-[#1B202A] border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePlayClip(clip)}
                            className="w-8 h-8 rounded-full bg-[#A8E6E8] text-[#10131B] flex items-center justify-center active:scale-95"
                          >
                            {isPlayingThis ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </button>
                          <div>
                            <span className="font-inter font-semibold text-[12px] text-[#F4F3EF] block">
                              Clip {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="font-inter text-[10px] text-[#8E97A6]">
                              {durationSec}s · {clip.mimeType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {transcriptText && (
                        <p className="text-[12px] font-inter text-[#A0A9B8] italic bg-white/5 p-2 rounded-lg leading-relaxed">
                          "{transcriptText}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal inside Detail */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 bg-[#10131B]/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-[340px] glass-panel rounded-2xl p-5 border border-[#E27D7D]/30 space-y-4 text-left shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E27D7D]/10 border border-[#E27D7D]/30 flex items-center justify-center text-[#E27D7D]">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-space text-[10px] uppercase tracking-wider text-[#E27D7D] font-semibold">
                      Confirm Deletion
                    </span>
                    <h3 className="font-inter font-semibold text-[15px] text-[#F4F3EF]">
                      Delete this reflection?
                    </h3>
                  </div>
                </div>

                <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
                  This will remove the recorded audio & transcription permanently from your device's storage. This action cannot be undone.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#8E97A6] font-space text-[13px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteActive}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#E27D7D] text-[#10131B] font-space font-semibold text-[13px] active:scale-95 shadow-[0_0_15px_rgba(226,125,125,0.3)]"
                  >
                    Delete reflection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
