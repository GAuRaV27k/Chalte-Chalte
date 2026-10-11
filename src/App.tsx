import { useState, useEffect, useRef } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { IntentionSetupScreen } from './screens/IntentionSetupScreen';
import { WalkPreparationScreen } from './screens/WalkPreparationScreen';
import { ActiveWalkScreen } from './screens/ActiveWalkScreen';
import { WalkCompletionScreen } from './screens/WalkCompletionScreen';
import { ReflectionReviewScreen } from './screens/ReflectionReviewScreen';
import { AIProcessingScreen } from './screens/AIProcessingScreen';
import { JournalResultScreen } from './screens/JournalResultScreen';
import { JournalScreen } from './screens/JournalScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import {
  getAllJournals,
  getAllSessions,
  clearAllUserData,
  deleteJournal,
  saveSession,
  saveJournal,
  discardSession,
  getEndedUnsavedSession,
  getClipsForSession,
} from './core/storage';
import type {
  WalkIntention,
  QuestionPrompt,
  WalkSession,
  JournalEntry,
  RecordedClip,
  TranscriptFragment,
} from './core/types';
import { ApiJournalGenerator } from './core/ai/journal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/GlobalBanners';

export function App() {
  const [tab, setTab] = useState<'home' | 'journal' | 'settings'>('home');
  const [subView, setSubView] = useState<
    'home' | 'intention' | 'prep' | 'active' | 'completion' | 'review' | 'processing' | 'journal_result'
  >('home');

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [, setSelectedJournal] = useState<JournalEntry | null>(null);

  // Active walk session state
  const [activeIntention, setActiveIntention] = useState<WalkIntention | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuestionPrompt[] | null>(null);
  const [completedSession, setCompletedSession] = useState<WalkSession | null>(null);
  const [sessionClips, setSessionClips] = useState<RecordedClip[]>([]);
  const [currentJournal, setCurrentJournal] = useState<JournalEntry | null>(null);

  // AI Processing state
  const [processingError, setProcessingError] = useState<string | null>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  // Startup: Load journals & resume any ended_unsaved session
  useEffect(() => {
    async function init() {
      await loadJournals();
      // If reopened with an ended_unsaved session, show Completion screen again instead of Home
      try {
        const unsaved = await getEndedUnsavedSession();
        if (unsaved) {
          setCompletedSession(unsaved);
          const clips = await getClipsForSession(unsaved.id);
          setSessionClips(clips);
          setSubView('completion');
        }
      } catch (err) {
        console.error('Failed to query ended_unsaved session:', err);
      }
    }
    init();

    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'OPEN_COMPLETION') {
        getEndedUnsavedSession().then((unsaved) => {
          if (unsaved) {
            setCompletedSession(unsaved);
            getClipsForSession(unsaved.id).then(setSessionClips);
            setSubView('completion');
          }
        });
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMsg);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMsg);
  }, []);

  const loadJournals = async () => {
    try {
      const allSessions = await getAllSessions();
      const savedIds = new Set(allSessions.filter((s) => s.status === 'saved').map((s) => s.id));
      const list = await getAllJournals();
      // Only sessions with status 'saved' appear per Phase 4 spec
      setJournals(list.filter((j) => !j.sessionId || savedIds.has(j.sessionId)));
    } catch (err) {
      console.error('Failed to load journals from IndexedDB:', err);
    }
  };

  // Flow handlers
  const handleStartSetup = () => {
    setSubView('intention');
  };

  const handleIntentionConfigured = (intention: WalkIntention) => {
    setActiveIntention(intention);
    setSubView('prep');
  };

  const handlePreparationComplete = (questions: QuestionPrompt[]) => {
    setActiveQuestions(questions);
    setSubView('active');
  };

  const handleWalkFinished = async (session: WalkSession) => {
    setCompletedSession(session);
    try {
      const clips = await getClipsForSession(session.id);
      setSessionClips(clips);
    } catch {
      setSessionClips([]);
    }
    setSubView('completion');
  };

  // Walk Completion actions
  const handleReviewReflections = () => {
    setSubView('review');
  };

  const handleSaveWalk = async () => {
    if (!completedSession) return;
    const updated: WalkSession = {
      ...completedSession,
      status: 'saved',
    };
    await saveSession(updated);
    setCompletedSession(updated);
    await loadJournals();
    // Return to home
    handleGoHome();
  };

  const handleDiscardSession = async () => {
    if (!completedSession) return;
    await discardSession(completedSession.id);
    handleGoHome();
  };

  const handleGoHome = async () => {
    setActiveIntention(null);
    setActiveQuestions(null);
    setCompletedSession(null);
    setSessionClips([]);
    setCurrentJournal(null);
    setSubView('home');
    setTab('home');
    await loadJournals();
  };

  // Reflection Review & Synthesis actions
  const handleGenerateJournal = async (transcripts: TranscriptFragment[]) => {
    if (!completedSession) return;
    setProcessingError(null);
    setSubView('processing');

    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    const synth = new ApiJournalGenerator();
    try {
      const entry = await synth.synthesize(completedSession, transcripts, ctrl.signal);
      setCurrentJournal(entry);
      setSubView('journal_result');
    } catch (err: unknown) {
      if (ctrl.signal.aborted) {
        setSubView('review');
        return;
      }
      setProcessingError(err instanceof Error ? err.message : 'Synthesis failed.');
    }
  };

  const handleRegenerateJournal = async () => {
    if (!completedSession) return;
    const synth = new ApiJournalGenerator();
    const transcripts = sessionClips.map((c) => ({
      id: `tr-${c.id}`,
      clipId: c.id,
      text: currentJournal?.myReflections || '',
      isMock: true,
      timestamp: Date.now(),
    }));
    const newEntry = await synth.synthesize(completedSession, transcripts);
    setCurrentJournal(newEntry);
  };

  const handleSaveJournalResult = async (entry: JournalEntry) => {
    await saveJournal(entry);
    if (completedSession) {
      const updated: WalkSession = {
        ...completedSession,
        status: 'saved',
      };
      await saveSession(updated);
      setCompletedSession(updated);
    }
    await loadJournals();
  };

  const handleClearAll = async () => {
    await clearAllUserData();
    await loadJournals();
    handleGoHome();
  };

  const handleDeleteJournal = async (id: string) => {
    await deleteJournal(id);
    await loadJournals();
    setSelectedJournal(prev => (prev?.id === id ? null : prev));
  };

  return (
    <ToastProvider>
      <ErrorBoundary fallbackName="Root">
        <MotionConfig reducedMotion="user">
          <div className="w-full min-h-screen bg-[#10131B] text-[#F4F3EF] flex justify-center selection:bg-[#A8E6E8]/30 selection:text-[#F4F3EF]">
            {/* Mobile Viewport Shell (Android 390-412px target) */}
            <main className="w-full max-w-[420px] min-h-screen bg-[#10131B] relative flex flex-col shadow-2xl border-x border-white/5 pt-[env(safe-area-inset-top)]">
              {/* Main Screens Container with AnimatePresence transitions */}
              <div className="flex-1 relative overflow-y-auto no-scrollbar">
                <AnimatePresence mode="wait">
                  {tab === 'home' && subView === 'home' && (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="HomeScreen">
                        <HomeScreen
                          onStartSetup={handleStartSetup}
                          onOpenJournal={() => setTab('journal')}
                          onOpenSettings={() => setTab('settings')}
                          recentJournals={journals}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'home' && subView === 'intention' && (
                    <motion.div
                      key="intention"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="IntentionSetupScreen">
                        <IntentionSetupScreen
                          onBack={() => setSubView('home')}
                          onStartWalk={handleIntentionConfigured}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'home' && subView === 'prep' && activeIntention && (
                    <motion.div
                      key="prep"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="WalkPreparationScreen">
                        <WalkPreparationScreen
                          intention={activeIntention}
                          onBeginWalk={handlePreparationComplete}
                          onCancel={() => setSubView('intention')}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'home' && subView === 'active' && activeIntention && activeQuestions && (
                    <motion.div
                      key="active"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="ActiveWalkScreen">
                        <ActiveWalkScreen
                          intention={activeIntention}
                          questions={activeQuestions}
                          onWalkEnd={handleWalkFinished}
                          onCancel={() => setSubView('home')}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'home' && subView === 'completion' && completedSession && (
                    <motion.div
                      key="completion"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="WalkCompletionScreen">
                        <WalkCompletionScreen
                          session={completedSession}
                          clipsCount={sessionClips.length}
                          onReviewReflections={handleReviewReflections}
                          onSaveWalk={handleSaveWalk}
                          onDiscardSession={handleDiscardSession}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'home' && subView === 'review' && completedSession && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="ReflectionReviewScreen">
                        <ReflectionReviewScreen
                          session={completedSession}
                          clips={sessionClips}
                          onBack={() => setSubView('completion')}
                          onGenerateJournal={handleGenerateJournal}
                          onSaveWalkOnly={handleSaveWalk}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'home' && subView === 'processing' && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="AIProcessingScreen">
                        <AIProcessingScreen
                          mode="journal"
                          error={processingError}
                          onRetry={() => {
                            const transcripts = sessionClips.map((c) => ({
                              id: `tr-${c.id}`,
                              clipId: c.id,
                              text: 'Synthesizing voice reflections.',
                              isMock: true,
                              timestamp: Date.now(),
                            }));
                            handleGenerateJournal(transcripts);
                          }}
                          onEditTranscript={() => setSubView('review')}
                          onCancel={() => {
                            abortCtrlRef.current?.abort();
                            setSubView('review');
                          }}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'home' && subView === 'journal_result' && currentJournal && completedSession && (
                    <motion.div
                      key="journal_result"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="JournalResultScreen">
                        <JournalResultScreen
                          journal={currentJournal}
                          session={completedSession}
                          onBack={() => setSubView('review')}
                          onSaveJournal={handleSaveJournalResult}
                          onRegenerate={handleRegenerateJournal}
                          onDeleteSession={handleDiscardSession}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'journal' && (
                    <motion.div
                      key="journal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="JournalScreen">
                        <JournalScreen
                          journals={journals}
                          onSelectEntry={(entry) => setSelectedJournal(entry)}
                          onDeleteEntry={handleDeleteJournal}
                          onStartFirstWalk={() => {
                            setTab('home');
                            setSubView('intention');
                          }}
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                  {tab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="min-h-full"
                    >
                      <ErrorBoundary fallbackName="SettingsScreen">
                        <SettingsScreen onClearAll={handleClearAll} />
                      </ErrorBoundary>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Persistent Frosted Bottom Navigation (only on primary root screens) */}
              <BottomNav
                currentTab={tab}
                onSelectTab={(selected) => {
                  setTab(selected);
                  if (selected === 'home' && subView === 'home') {
                    setSubView('home');
                  }
                }}
                hide={subView !== 'home'}
              />
            </main>
          </div>
        </MotionConfig>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
