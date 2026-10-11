import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Play, Pause, Trash2, Edit3, Bookmark, Sparkles, AlertTriangle, Wind
} from 'lucide-react';
import type { WalkSession, RecordedClip, TranscriptFragment } from '../core/types';
import { saveTranscript, getTranscriptsForClip, deleteClip } from '../core/storage';

interface ReflectionReviewScreenProps {
  session: WalkSession;
  clips: RecordedClip[];
  onBack: () => void;
  onGenerateJournal: (transcripts: TranscriptFragment[]) => void;
  onSaveWalkOnly: () => Promise<void>;
}

// In-memory waveform peak cache
const waveformCache = new Map<string, number[]>();

export const ReflectionReviewScreen: React.FC<ReflectionReviewScreenProps> = ({
  session,
  clips: initialClips,
  onBack,
  onGenerateJournal,
  onSaveWalkOnly,
}) => {
  const [clips, setClips] = useState<RecordedClip[]>(initialClips);
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptFragment>>({});
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveforms, setWaveforms] = useState<Record<string, number[]>>({});
  const [deleteClipId, setDeleteClipId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [savingWalk, setSavingWalk] = useState(false);
  const [walkSaved, setWalkSaved] = useState(false);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  // Load existing transcripts from storage
  useEffect(() => {
    async function load() {
      const map: Record<string, TranscriptFragment> = {};
      for (const clip of clips) {
        const trs = await getTranscriptsForClip(clip.id);
        if (trs.length > 0) {
          map[clip.id] = trs[0];
        } else {
          // Initialize empty manual transcript entry
          map[clip.id] = {
            id: `tr-${Date.now()}-${clip.id}`,
            clipId: clip.id,
            text: '',
            isMock: false,
            timestamp: Date.now(),
          };
        }
      }
      setTranscripts(map);
    }
    load();
  }, [clips]);

  // Compute waveform peaks lazily using decodeAudioData
  useEffect(() => {
    async function computePeaks() {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      for (const clip of clips) {
        if (waveformCache.has(clip.id)) {
          setWaveforms(prev => ({ ...prev, [clip.id]: waveformCache.get(clip.id)! }));
          continue;
        }

        try {
          const arrayBuffer = await clip.audioBlob.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const rawData = audioBuffer.getChannelData(0);
          const samples = 22; // number of bars
          const blockSize = Math.floor(rawData.length / samples);
          const filteredData: number[] = [];
          for (let i = 0; i < samples; i++) {
            const blockStart = blockSize * i;
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(rawData[blockStart + j] || 0);
            }
            filteredData.push(Math.min(1, Math.max(0.12, (sum / blockSize) * 2.5)));
          }
          waveformCache.set(clip.id, filteredData);
          setWaveforms(prev => ({ ...prev, [clip.id]: filteredData }));
        } catch {
          // Fallback neutral pattern
          const neutral = Array(22).fill(0.25);
          waveformCache.set(clip.id, neutral);
          setWaveforms(prev => ({ ...prev, [clip.id]: neutral }));
        }
      }
      audioCtx.close().catch(() => {/* noop */});
    }

    if (clips.length > 0) {
      computePeaks();
    }
  }, [clips]);

  // Audio playback management
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
    setIsPlaying(false);
    setActiveClipId(null);
    setCurrentTime(0);
  }, []);

  const togglePlay = (clip: RecordedClip) => {
    if (activeClipId === clip.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (activeClipId !== clip.id) {
      stopPlayback();
      const url = URL.createObjectURL(clip.audioBlob);
      currentObjectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      audio.onended = () => {
        stopPlayback();
      };

      audio.play().catch(() => {/* handle play restriction */});
      setActiveClipId(clip.id);
      setIsPlaying(true);
    } else {
      audioRef.current?.play().catch(() => {/* noop */});
      setIsPlaying(true);
    }
  };

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  // Transcript update and autosave
  const handleTranscriptChange = async (clipId: string, newText: string) => {
    setHasUnsavedChanges(true);
    const existing = transcripts[clipId] || {
      id: `tr-${Date.now()}-${clipId}`,
      clipId,
      text: '',
      isMock: false,
      timestamp: Date.now(),
    };
    const updated: TranscriptFragment = {
      ...existing,
      text: newText,
      timestamp: Date.now(),
    };
    setTranscripts(prev => ({ ...prev, [clipId]: updated }));
    // Autosave to IndexedDB
    try {
      await saveTranscript(updated);
      setHasUnsavedChanges(false);
    } catch {
      // Unsaved changes flag stays true if save fails
    }
  };

  // Delete clip handler
  const confirmDeleteClip = async () => {
    if (!deleteClipId) return;
    stopPlayback();
    await deleteClip(deleteClipId);
    setClips(prev => prev.filter(c => c.id !== deleteClipId));
    setTranscripts(prev => {
      const copy = { ...prev };
      delete copy[deleteClipId];
      return copy;
    });
    setDeleteClipId(null);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  const handleSaveWalk = async () => {
    setSavingWalk(true);
    try {
      await onSaveWalkOnly();
      setSavingWalk(false);
      setWalkSaved(true);
    } catch {
      setSavingWalk(false);
    }
  };

  // Count non-empty transcripts
  const nonEmptyTranscripts = Object.values(transcripts).filter(t => t.text.trim().length > 0);
  const canGenerate = nonEmptyTranscripts.length > 0;

  const durationMin = Math.max(1, Math.round(session.elapsedSeconds / 60));
  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(session.createdAt ? new Date(session.createdAt) : new Date());

  // EMPTY STATE: when there are no clips
  if (clips.length === 0) {
    return (
      <div className="flex flex-col min-h-full px-5 pt-3 pb-8 justify-between">
        <header className="flex items-center gap-3 py-3 shrink-0">
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
              Reflection Review
            </span>
            <h1 className="font-space text-[18px] font-bold text-[#F4F3EF] tracking-tight leading-none">
              Your reflections
            </h1>
          </div>
        </header>

        {/* Empty State Banner */}
        <div className="my-auto glass-panel rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#1B202A] border border-white/10 flex items-center justify-center text-[#A8E6E8]">
            <Wind className="w-7 h-7" />
          </div>
          <h2 className="font-instrument text-[24px] italic text-[#F4F3EF] leading-snug">
            “A quiet walk is a reflection, too.”
          </h2>
          <p className="font-inter text-[13px] text-[#8E97A6] leading-relaxed max-w-xs">
            You walked in pure presence without recording voice notes. You can save this walk without creating a journal.
          </p>
          <div className="w-full space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSaveWalk}
              disabled={savingWalk || walkSaved}
              className="w-full py-3.5 px-4 rounded-full bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Bookmark className="w-4 h-4" />
              <span>{savingWalk ? 'Saving…' : walkSaved ? '✓ Walk saved' : 'Save walk only'}</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 rounded-full bg-white/5 border border-white/10 text-[#8E97A6] font-space text-[13px] hover:text-[#F4F3EF] active:scale-95 transition-all"
            >
              Return to completion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-3 pb-28 relative">
      {/* Header */}
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
              Step 7 · Synthesis
            </span>
            <h1 className="font-space text-[18px] font-bold text-[#F4F3EF] tracking-tight leading-none">
              Your reflections
            </h1>
          </div>
        </div>
      </header>

      {/* Meta Header */}
      <div className="py-2 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A8E6E8] shadow-[0_0_8px_rgba(168,230,232,0.8)]" />
          <span className="font-inter font-semibold text-[13px] text-[#F4F3EF]">
            Session · {dateStr} · {durationMin} min walk
          </span>
        </div>
        <p className="font-inter text-[12px] text-[#8E97A6] pl-4">
          {clips.length} voice note{clips.length !== 1 ? 's' : ''} recorded while walking
        </p>
      </div>

      {/* List of Clips */}
      <div className="space-y-4 pt-3 flex-1">
        {clips.map((clip, idx) => {
          const isCurrentPlaying = activeClipId === clip.id && isPlaying;
          const tr = transcripts[clip.id];
          const hasText = Boolean(tr && tr.text.trim().length > 0);
          const peakList = waveforms[clip.id] || Array(22).fill(0.2);
          const durationSec = Math.round(clip.durationMs / 1000) || 15;
          const mm = String(Math.floor(durationSec / 60)).padStart(2, '0');
          const ss = String(durationSec % 60).padStart(2, '0');

          return (
            <article
              key={clip.id}
              className="glass-panel rounded-2xl border border-white/10 p-4 space-y-3 relative overflow-hidden"
            >
              {/* Top Row: Play/Pause, Title, Status Chip, Delete */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => togglePlay(clip)}
                    className="w-10 h-10 rounded-full bg-[#A8E6E8] text-[#10131B] flex items-center justify-center active:scale-95 transition-transform"
                    aria-label={isCurrentPlaying ? 'Pause clip' : 'Play clip'}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>
                  <div>
                    <h2 className="font-inter font-semibold text-[13px] text-[#F4F3EF]">
                      Clip {String(idx + 1).padStart(2, '0')}
                    </h2>
                    <span className="font-inter text-[11px] text-[#8E97A6]">
                      Duration {mm}:{ss}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasText ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-[#B9B4E8]/15 text-[#B9B4E8] border border-[#B9B4E8]/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B9B4E8]" />
                      {tr.isMock ? 'Demo' : 'Transcript ready'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-inter text-[#8E97A6] bg-white/5 border border-white/10">
                      Not transcribed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteClipId(clip.id)}
                    className="p-1.5 text-[#5C6473] hover:text-[#E27D7D] active:scale-95 transition-colors"
                    aria-label="Delete clip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Waveform Scrubber */}
              <div className="space-y-1">
                <div className="h-9 w-full flex items-center gap-[3px] px-2 bg-[#1B202A]/80 rounded-xl border border-white/5">
                  {peakList.map((peak, barIdx) => {
                    const isPlayed =
                      activeClipId === clip.id &&
                      currentTime / (durationSec || 1) >= barIdx / peakList.length;
                    return (
                      <span
                        key={barIdx}
                        className={`w-1 rounded-full transition-all ${
                          isPlayed ? 'bg-[#A8E6E8]' : 'bg-[#5C6473]/50'
                        }`}
                        style={{ height: `${Math.max(6, peak * 26)}px` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#8E97A6] px-1">
                  <span>{activeClipId === clip.id ? `00:${String(Math.floor(currentTime)).padStart(2, '0')}` : '00:00'}</span>
                  <span>{mm}:{ss}</span>
                </div>
              </div>

              {/* Editable Transcript Area */}
              <div className="bg-[#1B202A]/60 rounded-xl p-3 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-[10px] font-space tracking-wider uppercase text-[#8E97A6] font-semibold">
                    TRANSCRIPT
                  </span>
                  <span className="text-[11px] font-inter text-[#A8E6E8] flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    Edit or type
                  </span>
                </div>
                <textarea
                  value={tr?.text || ''}
                  onChange={(e) => handleTranscriptChange(clip.id, e.target.value)}
                  placeholder="Type or paste your spoken thought here…"
                  rows={2}
                  className="w-full bg-transparent text-[#F4F3EF] font-inter text-[13px] resize-none outline-none leading-relaxed placeholder-[#5C6473]"
                />
                <div className="flex justify-between items-center text-[10px] font-inter text-[#5C6473] pt-0.5">
                  <span>{tr?.isMock ? 'Demo transcript (editable)' : 'Manual transcript entry'}</span>
                  <span>{(tr?.text || '').length} chars</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Sticky Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto p-4 bg-[#10131B]/95 backdrop-blur-xl border-t border-white/10 space-y-2 z-40">
        {/* Whisper button — disabled with honest explanation */}
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 rounded-full bg-[#1B202A] border border-white/10 text-[#5C6473] font-space text-[12px] flex items-center justify-center gap-2 cursor-not-allowed"
          title="On-device Whisper model is not included in this build. Type your transcript manually above."
        >
          <span>Transcribe with Whisper (Not available yet)</span>
        </button>

        {/* Generate Journal CTA — enabled only when at least one transcript exists */}
        <button
          type="button"
          onClick={() => onGenerateJournal(nonEmptyTranscripts)}
          disabled={!canGenerate}
          className={`w-full py-3.5 px-4 rounded-full font-space font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${
            canGenerate
              ? 'bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B]'
              : 'bg-white/5 border border-white/10 text-[#5C6473] cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate my journal</span>
        </button>
      </div>

      {/* Delete Clip Confirmation Modal */}
      <AnimatePresence>
        {deleteClipId && (
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
                  Discard this recording?
                </h3>
              </div>
              <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
                This voice note and its provisional transcript will be permanently removed from this device.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteClipId(null)}
                  className="flex-1 py-2 rounded-full glass-panel border border-white/10 font-space text-[12px] text-[#F4F3EF]"
                >
                  Keep clip
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteClip}
                  className="flex-1 py-2 rounded-full bg-[#E27D7D]/20 border border-[#E27D7D]/50 text-[#E27D7D] font-space text-[12px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit with Unsaved Changes Guard */}
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
                Unsaved changes
              </h3>
              <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
                You have unsaved edits in your transcript. Are you sure you want to leave?
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
                  Discard & leave
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
