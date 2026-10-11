import { useState, useEffect } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { IntentionSetupScreen } from './screens/IntentionSetupScreen';
import { WalkPreparationScreen } from './screens/WalkPreparationScreen';
import { ActiveWalkScreen } from './screens/ActiveWalkScreen';
import { WalkCompletionScreen } from './screens/WalkCompletionScreen';
import { JournalScreen } from './screens/JournalScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { getAllJournals, clearAllUserData, deleteJournal } from './core/storage';
import type { WalkIntention, QuestionPrompt, WalkSession, JournalEntry } from './core/types';

export function App() {
  const [tab, setTab] = useState<'home' | 'journal' | 'settings'>('home');
  const [subView, setSubView] = useState<'home' | 'intention' | 'prep' | 'active' | 'completed'>('home');
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [, setSelectedJournal] = useState<JournalEntry | null>(null);

  // Active walk session state
  const [activeIntention, setActiveIntention] = useState<WalkIntention | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuestionPrompt[] | null>(null);
  const [completedSession, setCompletedSession] = useState<WalkSession | null>(null);
  const [completedClipsCount, setCompletedClipsCount] = useState<number>(0);

  // Load existing journals from IndexedDB on startup
  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      const list = await getAllJournals();
      setJournals(list);
    } catch (err) {
      console.error('Failed to load journals from IndexedDB:', err);
    }
  };

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

  const handleWalkFinished = (session: WalkSession, clipsCount: number) => {
    setCompletedSession(session);
    setCompletedClipsCount(clipsCount);
    setSubView('completed');
  };

  const handleGoHome = async () => {
    setActiveIntention(null);
    setActiveQuestions(null);
    setCompletedSession(null);
    setCompletedClipsCount(0);
    setSubView('home');
    setTab('home');
    await loadJournals();
  };

  const handleClearAll = async () => {
    await clearAllUserData();
    await loadJournals();
  };

  const handleDeleteJournal = async (id: string) => {
    await deleteJournal(id);
    await loadJournals();
    setSelectedJournal(prev => (prev?.id === id ? null : prev));
  };

  return (
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
                  <HomeScreen
                    onStartSetup={handleStartSetup}
                    onOpenJournal={() => setTab('journal')}
                    onOpenSettings={() => setTab('settings')}
                    recentJournals={journals}
                  />
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
                  <IntentionSetupScreen
                    onBack={() => setSubView('home')}
                    onStartWalk={handleIntentionConfigured}
                  />
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
                  <WalkPreparationScreen
                    intention={activeIntention}
                    onBeginWalk={handlePreparationComplete}
                    onCancel={() => setSubView('intention')}
                  />
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
                  <ActiveWalkScreen
                    intention={activeIntention}
                    questions={activeQuestions}
                    onWalkEnd={handleWalkFinished}
                    onCancel={() => setSubView('home')}
                  />
                </motion.div>
              )}

              {tab === 'home' && subView === 'completed' && completedSession && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="min-h-full"
                >
                  <WalkCompletionScreen
                    session={completedSession}
                    clipsCount={completedClipsCount}
                    onGoHome={handleGoHome}
                  />
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
                  <JournalScreen
                    journals={journals}
                    onSelectEntry={(entry) => setSelectedJournal(entry)}
                    onDeleteEntry={handleDeleteJournal}
                  />
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
                  <SettingsScreen onClearAll={handleClearAll} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Persistent Frosted Bottom Navigation (only on main tabs) */}
          <BottomNav
            currentTab={tab}
            onSelectTab={(selected) => {
              setTab(selected);
              if (selected === 'home' && subView !== 'active' && subView !== 'prep') {
                setSubView('home');
              }
            }}
            hide={subView !== 'home'}
          />
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
