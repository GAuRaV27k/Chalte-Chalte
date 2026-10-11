/**
 * ActiveWalkScreen
 *
 * Layout per Stitch:
 *  - Session header: elapsed time
 *  - Large serif question text
 *  - "QUESTION N OF 3" label
 *  - Circular remaining-time ring (SVG pathLength driven by MotionValue)
 *  - Controls: pause/resume, skip, end walk
 *  - "Record a thought" mic button
 *  - Pause glass overlay
 *
 * Motion rules:
 *  - transform + opacity only; no blur, no height/width animation
 *  - Question fades in with slight upward slide (250–400 ms)
 *  - Ring driven by MotionValue fed from engine tick, not React state per tick
 *  - During reflection windows, motion is nearly still
 *  - <MotionConfig reducedMotion="user"> is on the App root
 *
 * Honesty rules:
 *  - Recording indicator bound to recorder.isRecording() only
 *  - No success state before IndexedDB write resolves
 *  - Speech errors show the question text + error notice; no fake waveform claim
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  Pause, Play, SkipForward, Square, Mic, MicOff, StopCircle, AlertTriangle
} from 'lucide-react';
import type { WalkIntention, QuestionPrompt, WalkSession } from '../core/types';
import { WalkEngine, type EngineState } from '../core/walkEngine';
import { WebSpeechTTS } from '../core/speech';
import { BrowserAudioRecorder } from '../core/recorder';
import { saveSession, saveClip } from '../core/storage';
import { PauseOverlay } from '../components/PauseOverlay';

// -----------------------------------------------------------------------
// Waveform bars: real mic amplitude while recording;
// calm decorative animation while TTS is speaking.
// We do NOT claim the decorative bars reflect audio levels.
// -----------------------------------------------------------------------

const WaveformBars: React.FC<{
  isRecording: boolean;
  recorderRef: React.RefObject<BrowserAudioRecorder>;
}> = ({ isRecording, recorderRef }) => {
  const BAR_COUNT = 7;
  const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(0.15));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      setLevels(Array(BAR_COUNT).fill(0.15));
      return;
    }

    const animate = () => {
      const rms = recorderRef.current?.getLevel() ?? 0;
      setLevels(prev =>
        prev.map((_, i) => {
          const noise = (Math.random() - 0.5) * 0.08;
          const bar = Math.min(1, Math.max(0.08, rms + noise + (i % 2 === 0 ? 0.05 : 0)));
          return bar;
        }),
      );
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRecording, recorderRef]);

  return (
    <div className="flex items-end gap-1 h-8" aria-hidden="true">
      {levels.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-[#A8E6E8] transition-none"
          style={{ height: `${h * 32}px`, opacity: 0.6 + h * 0.4 }}
        />
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------
// Decorative TTS speaking waveform
// Calm sine-wave-ish bars — explicitly NOT claiming to reflect audio.
// -----------------------------------------------------------------------

const DecorativeWaveform: React.FC = () => {
  const BAR_COUNT = 9;
  return (
    <div className="flex items-center gap-1 h-8" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-[#B9B4E8]/60"
          style={{ height: 8 }}
          animate={{ scaleY: [1, 1.8 + Math.sin(i) * 0.6, 1] }}
          transition={{
            duration: 1.2 + i * 0.08,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface ActiveWalkScreenProps {
  intention: WalkIntention;
  questions: QuestionPrompt[];
  onWalkEnd: (session: WalkSession, clipsCount: number) => void;
  onCancel: () => void;
}

// -----------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------

export const ActiveWalkScreen: React.FC<ActiveWalkScreenProps> = ({
  intention,
  questions,
  onWalkEnd,
  onCancel,
}) => {
  const totalSeconds = intention.durationMinutes * 60;

  // Engine refs — stable across renders
  const engineRef = useRef<WalkEngine | null>(null);
  const ttsRef = useRef(new WebSpeechTTS());
  const recorderRef = useRef(new BrowserAudioRecorder());

  // Screen Wake Lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // MotionValue for ring — fed from tick, no React setState per tick
  const ringProgress = useMotionValue(1); // 1 = full; animates toward 0
  const strokeDashoffset = useTransform(ringProgress, p => 1 - p);

  // State (only state that must trigger a re-render)
  const [engineState, setEngineState] = useState<EngineState>('preparing');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [remainingSec, setRemainingSec] = useState(totalSeconds);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPrompt | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0); // 1-based display
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStartMs, setRecordingStartMs] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [showPause, setShowPause] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [clipsCount, setClipsCount] = useState(0);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  // Recording duration tick
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Wake Lock ----
  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as Navigator & { wakeLock: WakeLock }).wakeLock.request('screen');
    } catch {
      // Silently ignored per spec — do not claim lock-screen works
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release();
      wakeLockRef.current = null;
    } catch {/* noop */}
  }, []);

  // ---- Media Session ----
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Chalte-Chalte Walk',
      artist: 'Walking Philosopher',
    });
    navigator.mediaSession.setActionHandler('pause', () => handlePause());
    navigator.mediaSession.setActionHandler('play', () => handleResume());
    return () => {
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('play', null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Engine init ----
  useEffect(() => {
    const session: WalkSession = {
      id: sessionId,
      createdAt: Date.now(),
      intention,
      status: 'active',
      elapsedSeconds: 0,
      questionsDelivered: [],
      clipsCount: 0,
    };

    const engine = new WalkEngine(session, questions, {
      onTick: (elapsed, remaining) => {
        setElapsedSec(elapsed);
        setRemainingSec(remaining);
        ringProgress.set(remaining / totalSeconds);
      },
      onQuestionReady: async (question, idx) => {
        setCurrentQuestion(question);
        setQuestionIndex(idx + 1);
        setSpeechError(null);

        try {
          await ttsRef.current.speak(question.text, intention.language);
          engine.onSpeakingFinished();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setSpeechError(msg);
          engine.onSpeakingFinished();
        }
      },
      onStateChange: (state) => {
        setEngineState(state);
      },
      onCompleted: async () => {
        await releaseWakeLock();
        ttsRef.current.stop();
        const s = engine.getSession();
        s.status = 'completed';
        s.completedAt = Date.now();
        s.clipsCount = clipsCount;
        try { await saveSession(s); } catch {/* noop */}
        onWalkEnd(s, clipsCount);
      },
    });

    engineRef.current = engine;
    engine.start();
    acquireWakeLock();

    return () => {
      engine.endWalk();
      ttsRef.current.stop();
      recorderRef.current.abort();
      releaseWakeLock();
    };
  // intentionally running only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Pause ----
  const handlePause = useCallback(() => {
    if (isRecording) return; // must stop recording first
    engineRef.current?.pause();
    ttsRef.current.stop();
    releaseWakeLock();
    setShowPause(true);
  }, [isRecording, releaseWakeLock]);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
    acquireWakeLock();
    setShowPause(false);
  }, [acquireWakeLock]);

  // ---- Skip ----
  const handleSkip = useCallback(() => {
    ttsRef.current.stop();
    engineRef.current?.skip();
  }, []);

  // ---- End Walk ----
  const handleEndWalk = useCallback(() => {
    if (isRecording) {
      setShowEndConfirm(true);
    } else {
      finishWalk();
    }
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishWalk = useCallback(async () => {
    setShowEndConfirm(false);
    if (isRecording) {
      // Stop and save current recording before ending
      const blob = await recorderRef.current.stop();
      setIsRecording(false);
      engineRef.current?.setRecordingActive(false);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (blob) {
        await saveClipBlob(blob);
      }
    }
    ttsRef.current.stop();
    engineRef.current?.endWalk();
  }, [isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Recording ----
  const handleRecordStart = useCallback(async () => {
    if (isRecording || engineState === 'paused' || engineState === 'ended') return;
    setMicError(null);
    setSaveStatus('idle');
    setSaveError(null);

    try {
      await recorderRef.current.start();
      setIsRecording(true);
      setRecordingStartMs(Date.now());
      setRecordingDuration(0);
      engineRef.current?.setRecordingActive(true);

      recTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone error.';
      const isDenied = msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission');
      setMicError(
        isDenied
          ? 'Microphone permission was denied. You can continue the walk without recording.'
          : msg,
      );
    }
  }, [isRecording, engineState]);

  const handleRecordStop = useCallback(async () => {
    if (!isRecording) return;
    if (recTimerRef.current) clearInterval(recTimerRef.current);

    const durationMs = recordingStartMs ? Date.now() - recordingStartMs : 0;
    setIsRecording(false);
    engineRef.current?.setRecordingActive(false);

    setSaveStatus('saving');
    try {
      const blob = await recorderRef.current.stop();
      if (blob) {
        await saveClipBlob(blob, durationMs);
        setClipsCount(c => c + 1);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save recording.';
      setSaveError(msg);
      setSaveStatus('error');
    }
  }, [isRecording, recordingStartMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveClipBlob = useCallback(async (blob: Blob, durationMs?: number) => {
    await saveClip({
      id: `clip-${Date.now()}`,
      sessionId,
      questionId: currentQuestion?.id,
      recordedAt: Date.now(),
      durationMs: durationMs ?? 0,
      audioBlob: blob,
      mimeType: recorderRef.current.getMimeType() || blob.type,
    });
  }, [sessionId, currentQuestion]);

  // ---- Format time ----
  const formatTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatRecDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // ---- SVG ring radius ----
  const RING_R = 68;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

  const isPaused = engineState === 'paused';
  const isSpeaking = engineState === 'speaking';

  return (
    <div className="flex flex-col min-h-full bg-[#10131B] relative overflow-hidden">
      {/* Session header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div>
          <p className="font-inter text-[11px] text-[#5C6473] uppercase tracking-wider font-semibold">
            Active walk
          </p>
          <div className="font-space text-[22px] font-bold text-[#F4F3EF] tabular-nums leading-none mt-0.5">
            {formatTime(elapsedSec)}
          </div>
        </div>
        <div className="text-right">
          <p className="font-inter text-[11px] text-[#5C6473]">Remaining</p>
          <p className="font-space text-[16px] text-[#8E97A6] tabular-nums">{formatTime(remainingSec)}</p>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center px-5 pt-2 pb-4 gap-6">
        {/* Question area */}
        <div className="w-full min-h-[140px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-2"
              >
                <motion.span
                  className="font-space text-[11px] uppercase tracking-widest text-[#A8E6E8] font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Question {questionIndex} of {questions.length}
                </motion.span>
                <p className="font-instrument text-[26px] italic text-[#F4F3EF] leading-snug">
                  {currentQuestion.text}
                </p>
                <p className="font-inter text-[11px] text-[#5C6473]">
                  {currentQuestion.philosophySchool}
                </p>

                {/* Speech error — honest, not hidden */}
                {speechError && (
                  <div className="flex items-start gap-2 mt-2 p-2 rounded-xl bg-[#E27D7D]/10 border border-[#E27D7D]/20">
                    <AlertTriangle className="w-4 h-4 text-[#E27D7D] shrink-0 mt-0.5" />
                    <p className="font-inter text-[11px] text-[#E27D7D] leading-snug">
                      Text-to-speech unavailable: {speechError}. Read the question above.
                    </p>
                  </div>
                )}

                {/* Waveform: decorative while TTS speaking; real while recording */}
                <div className="h-10 flex items-center gap-3 mt-1">
                  {isSpeaking && !isRecording && (
                    <>
                      <DecorativeWaveform />
                      <span className="font-inter text-[10px] text-[#5C6473] italic">
                        (visual only — not audio levels)
                      </span>
                    </>
                  )}
                  {isRecording && (
                    <WaveformBars isRecording={isRecording} recorderRef={recorderRef} />
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-2 py-8"
              >
                <p className="font-instrument text-[22px] italic text-[#F4F3EF]/50 text-center leading-snug">
                  Walk gently. Your first question will arrive in a moment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ring timer */}
        <div className="relative w-44 h-44 shrink-0">
          <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
            {/* Track */}
            <circle cx="80" cy="80" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {/* Progress */}
            <motion.circle
              cx="80" cy="80" r={RING_R}
              fill="none"
              stroke="#A8E6E8"
              strokeWidth="8"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              style={{ strokeDashoffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-space text-[30px] font-bold text-[#F4F3EF] tabular-nums leading-none">
              {formatTime(remainingSec)}
            </span>
            <span className="font-inter text-[11px] text-[#8E97A6] mt-1">remaining</span>
          </div>
        </div>

        {/* Controls row: pause, skip, end */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isPaused ? handleResume : handlePause}
            disabled={isRecording}
            title={isRecording ? 'Stop recording to pause' : undefined}
            className="w-12 h-12 rounded-full glass-panel border border-white/10 flex items-center justify-center text-[#F4F3EF] active:scale-90 transition-transform disabled:opacity-40"
            aria-label={isPaused ? 'Resume walk' : 'Pause walk'}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isRecording || !currentQuestion}
            className="w-12 h-12 rounded-full glass-panel border border-white/10 flex items-center justify-center text-[#8E97A6] active:scale-90 transition-transform disabled:opacity-40"
            aria-label="Skip question"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleEndWalk}
            className="w-12 h-12 rounded-full bg-[#E27D7D]/10 border border-[#E27D7D]/30 flex items-center justify-center text-[#E27D7D] active:scale-90 transition-transform"
            aria-label="End walk"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        {/* Recording hint when paused while recording */}
        {isRecording && (
          <p className="font-inter text-[11px] text-[#8E97A6] text-center -mt-2">
            Stop recording to pause
          </p>
        )}

        {/* Mic button */}
        <div className="w-full flex flex-col items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={handleRecordStart}
              className="w-full max-w-[260px] py-3.5 rounded-2xl glass-panel border border-white/10 flex items-center justify-center gap-2.5 text-[#F4F3EF] font-space text-[14px] font-semibold active:scale-95 transition-transform"
            >
              <Mic className="w-5 h-5 text-[#A8E6E8]" />
              Record a thought
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRecordStop}
              className="w-full max-w-[260px] py-3.5 rounded-2xl bg-[#E27D7D]/15 border border-[#E27D7D]/30 flex items-center justify-center gap-2.5 text-[#E27D7D] font-space text-[14px] font-semibold active:scale-95 transition-transform"
            >
              <StopCircle className="w-5 h-5" />
              Stop recording · {formatRecDuration(recordingDuration)}
            </button>
          )}

          {/* Save status — only shown after operation resolves */}
          <AnimatePresence>
            {saveStatus === 'saving' && (
              <motion.p
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-inter text-[11px] text-[#8E97A6]"
              >
                Saving…
              </motion.p>
            )}
            {saveStatus === 'saved' && (
              <motion.p
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-inter text-[11px] text-[#A8E6E8]"
              >
                ✓ Saved to local storage
              </motion.p>
            )}
            {saveStatus === 'error' && (
              <motion.p
                key="err"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-inter text-[11px] text-[#E27D7D]"
              >
                ✗ {saveError} —{' '}
                <button
                  className="underline"
                  onClick={handleRecordStop}
                  type="button"
                >
                  retry
                </button>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Mic permission error */}
          {micError && (
            <div className="w-full max-w-[300px] p-3 rounded-xl bg-[#E27D7D]/10 border border-[#E27D7D]/20 flex items-start gap-2">
              <MicOff className="w-4 h-4 text-[#E27D7D] shrink-0 mt-0.5" />
              <p className="font-inter text-[11px] text-[#E27D7D] leading-snug">
                {micError}
              </p>
            </div>
          )}
        </div>

        {/* Clips counter */}
        {clipsCount > 0 && (
          <p className="font-inter text-[11px] text-[#5C6473]">
            {clipsCount} recording{clipsCount !== 1 ? 's' : ''} saved
          </p>
        )}
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {showPause && (
          <PauseOverlay
            elapsedSec={elapsedSec}
            onResume={handleResume}
            onEndWalk={finishWalk}
          />
        )}
      </AnimatePresence>

      {/* End-walk confirm while recording */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end px-5 pb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-[#10131B]/80" onClick={() => setShowEndConfirm(false)} />
            <div className="relative w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
              <p className="font-space text-[14px] font-semibold text-[#F4F3EF]">
                Stop recording and end walk?
              </p>
              <p className="font-inter text-[12px] text-[#8E97A6]">
                Your current recording will be saved before the walk ends.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F4F3EF] font-space text-[13px] font-semibold"
                >
                  Continue walk
                </button>
                <button
                  type="button"
                  onClick={finishWalk}
                  className="flex-1 py-2.5 rounded-xl bg-[#E27D7D]/10 border border-[#E27D7D]/30 text-[#E27D7D] font-space text-[13px] font-semibold"
                >
                  Stop & end
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
