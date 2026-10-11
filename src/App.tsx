import { useState, useEffect } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { IntentionSetupScreen } from './screens/IntentionSetupScreen';
import { JournalScreen } from './screens/JournalScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { getAllJournals, clearAllUserData, deleteJournal } from './core/storage';
import type { WalkIntention, JournalEntry } from './core/types';

export function App() {
  const [tab, setTab] = useState<'home' | 'journal' | 'settings'>('home');
  const [subView, setSubView] = useState<'home' | 'intention'>('home');
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

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

  const handleStartWalk = (intention: WalkIntention) => {
    // In Phase 1, we capture intention and log it ready for Phase 2 Walk Preparation
    alert(`Intention recorded: ${intention.topic} (${intention.durationMinutes}m). Phase 2 Walk Preparation & Active Walk engine will launch this session!`);
    setSubView('home');
  };

  const handleClearAll = async () => {
    await clearAllUserData();
    await loadJournals();
  };

  const handleDeleteJournal = async (id: string) => {
    await deleteJournal(id);
    await loadJournals();
    if (selectedJournal?.id === id) {
      setSelectedJournal(null);
    }
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
                    onStartWalk={handleStartWalk}
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

          {/* Persistent Frosted Bottom Navigation */}
          <BottomNav
            currentTab={tab}
            onSelectTab={(selected) => {
              setTab(selected);
              if (selected === 'home') {
                setSubView('home');
              }
            }}
            hide={subView === 'intention'}
          />
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
