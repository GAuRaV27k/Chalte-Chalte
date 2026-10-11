/**
 * WalkPreparationScreen
 *
 * 60-second countdown driven by timestamps (not render ticks).
 * Rotating hints every ~15 s, cross-faded.
 * Mock question generation with AbortController.
 * States: generating | ready | waiting | error
 * Auto-transitions to Active Walk only when countdown = 0 AND questions are ready.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { WalkIntention, QuestionPrompt } from '../core/types';
import { MockQuestionGenerator } from '../core/ai/questions';

// -------------------------------------------------------------------------
// Hints — displayed for ~15 s each
// -------------------------------------------------------------------------
const HINTS = [
  'Relax your shoulders and let them drop.',
  'Take a slow breath and find your pace.',
  'Put on earphones if you have them.',
  'Choose a safe route you enjoy.',
  'Let your arms swing naturally.',
];

type GenState = 'generating' | 'ready' | 'error';

interface WalkPreparationScreenProps {
  intention: WalkIntention;
  onBeginWalk: (questions: QuestionPrompt[]) => void;
  onCancel: () => void;
}

export const WalkPreparationScreen: React.FC<WalkPreparationScreenProps> = ({
  intention,
  onBeginWalk,
  onCancel,
}) => {
  const COUNTDOWN_SEC = 60;

  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
  const [genState, setGenState] = useState<GenState>('generating');
  const [questions, setQuestions] = useState<QuestionPrompt[] | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Timestamp-based countdown
  const startAtRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const hasLaunchedRef = useRef(false);

  // AbortController for question generation
  const abortRef = useRef<AbortController | null>(null);

  // ----- Question generation -----
  const generateQuestions = useCallback(async (signal: AbortSignal) => {
    setGenState('generating');
    setErrorMsg(null);
    try {
      const gen = new MockQuestionGenerator();
      const qs = await gen.generateQuestions(intention, signal);
      if (!signal.aborted) {
        setQuestions(qs);
        setGenState('ready');
      }
    } catch (err: unknown) {
      if (signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Question generation failed.';
      setErrorMsg(message);
      setGenState('error');
    }
  }, [intention]);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    generateQuestions(ctrl.signal);
    return () => ctrl.abort();
  }, [generateQuestions]);

  // ----- Timestamp countdown -----
  useEffect(() => {
    startAtRef.current = Date.now();
    let hintTimer: ReturnType<typeof setInterval>;

    const frame = () => {
      const elapsed = Math.floor((Date.now() - startAtRef.current) / 1000);
      const remaining = Math.max(0, COUNTDOWN_SEC - elapsed);
      setCountdown(remaining);

      if (remaining === 0) {
        // Will launch in the "ready + countdown=0" useEffect
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    hintTimer = setInterval(() => {
      setHintIndex(i => (i + 1) % HINTS.length);
    }, 15_000);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearInterval(hintTimer);
    };
  }, []);

  // ----- Auto-launch when countdown = 0 AND questions ready -----
  useEffect(() => {
    if (countdown === 0 && questions && genState === 'ready' && !hasLaunchedRef.current) {
      hasLaunchedRef.current = true;
      onBeginWalk(questions);
    }
  }, [countdown, questions, genState, onBeginWalk]);

  // ----- Handlers -----
  const handleUseFallback = () => {
    abortRef.current?.abort();
    const gen = new MockQuestionGenerator();
    // Synchronous-ish: generate with a new non-aborted signal
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setUsingFallback(true);
    setGenState('generating');
    gen.generateQuestions(intention, ctrl.signal).then(qs => {
      setQuestions(qs);
      setGenState('ready');
    }).catch(() => {/* already aborted or re-errored */});
  };

  const handleRetry = () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setUsingFallback(false);
    generateQuestions(ctrl.signal);
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onCancel();
  };

  // ----- Format countdown as MM:SS -----
  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <div className="flex flex-col min-h-full px-5 pb-10 pt-3">
      {/* Header */}
      <header className="flex items-center gap-3 py-3 shrink-0">
        <button
          type="button"
          onClick={handleCancel}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#8E97A6] active:scale-90 transition-transform"
          aria-label="Cancel preparation"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-space text-[18px] font-bold text-[#F4F3EF] tracking-tight leading-none">
            Walk Preparation
          </h1>
          <p className="text-[12px] font-inter text-[#8E97A6] mt-0.5">
            {intention.topic}
          </p>
        </div>
      </header>

      {/* Countdown */}
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="relative w-40 h-40">
          {/* SVG ring — progress driven by countdown */}
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
            {/* Track */}
            <circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            {/* Progress — animate strokeDashoffset, not blur or layout */}
            <motion.circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke="#A8E6E8"
              strokeWidth="8"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              animate={{ strokeDashoffset: 1 - countdown / COUNTDOWN_SEC }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
          {/* Countdown digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-space text-[40px] font-bold text-[#F4F3EF] leading-none tabular-nums">
              {mm}:{ss}
            </span>
            <span className="font-inter text-[11px] text-[#8E97A6] mt-1">
              Head out and start walking
            </span>
          </div>
        </div>

        {/* Rotating hint — cross-fade with AnimatePresence */}
        <div className="h-[52px] flex items-center justify-center w-full max-w-[280px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={hintIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="font-instrument text-[18px] italic text-[#F4F3EF]/80 text-center leading-snug"
            >
              {HINTS[hintIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Generation status banner */}
      <div className="mt-auto space-y-3">
        <AnimatePresence mode="wait">
          {genState === 'generating' && (
            <motion.div
              key="gen"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center gap-3"
            >
              {/* Subtle pulsing dot */}
              <motion.div
                className="w-3 h-3 rounded-full bg-[#A8E6E8] shrink-0"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div>
                <p className="font-space text-[13px] font-semibold text-[#F4F3EF]">
                  Preparing your questions…
                </p>
                <p className="font-inter text-[11px] text-[#8E97A6] mt-0.5">
                  {usingFallback
                    ? 'Using prewritten questions (demo content)'
                    : 'Tailoring to your reflection topic'}
                </p>
              </div>
            </motion.div>
          )}

          {genState === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-panel rounded-2xl p-4 border border-[#A8E6E8]/20 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-[#A8E6E8] shrink-0" />
              <div>
                <p className="font-space text-[13px] font-semibold text-[#A8E6E8]">
                  {countdown > 0 ? 'Your questions are ready' : 'Starting walk…'}
                </p>
                <p className="font-inter text-[11px] text-[#8E97A6] mt-0.5">
                  {usingFallback
                    ? '⚠ Demo — prewritten questions, not AI-generated'
                    : 'Walk will begin when the timer reaches 00:00'}
                </p>
              </div>
            </motion.div>
          )}

          {genState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-panel rounded-2xl p-4 border border-[#E27D7D]/30 space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#E27D7D] shrink-0 mt-0.5" />
                <div>
                  <p className="font-space text-[13px] font-semibold text-[#E27D7D]">
                    Could not generate questions
                  </p>
                  <p className="font-inter text-[11px] text-[#8E97A6] mt-0.5 leading-snug">
                    {errorMsg ?? 'Unknown error.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[#F4F3EF] font-space text-[12px] font-semibold active:scale-95 transition-transform"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={handleUseFallback}
                  className="flex-1 py-2 rounded-xl bg-[#A8E6E8]/10 border border-[#A8E6E8]/20 text-[#A8E6E8] font-space text-[12px] font-semibold active:scale-95 transition-transform"
                >
                  Use prewritten ⚠
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-[#8E97A6] font-space text-[12px] font-semibold active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting state: countdown = 0 but questions not ready yet */}
        {countdown === 0 && genState !== 'ready' && genState !== 'error' && (
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#8E97A6] shrink-0" />
            <div>
              <p className="font-space text-[13px] font-semibold text-[#F4F3EF]">
                Almost ready…
              </p>
              <p className="font-inter text-[11px] text-[#8E97A6]">
                Walk will start as soon as questions finish generating.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
