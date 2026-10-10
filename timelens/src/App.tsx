import React, { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Footer } from './components/common/Footer';
import { TopNavBar } from './components/common/TopNavBar';
import { WorkflowStepper } from './components/common/WorkflowStepper';
import { EraSelectionScreen } from './components/screens/EraSelectionScreen';
import { LandingScreen } from './components/screens/LandingScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { StudioScreen } from './components/screens/StudioScreen';
import { SAMPLE_LANDSCAPE_IMAGE } from './data/eras';
import type { ScreenId, UserJourneyState } from './types';

const INITIAL_JOURNEY_STATE: UserJourneyState = {
  currentScreen: 'landing',
  landscapeFile: null,
  landscapePreviewUrl: SAMPLE_LANDSCAPE_IMAGE,
  landscapeFileName: 'hoh_rain_forest_olympic.tiff',
  location: 'Olympic National Park, Hoh Rain Forest, WA',
  locationCoordinates: '47.51° N, 123.82° W',
  includeTraveler: false,
  selfieFile: null,
  selfiePreviewUrl: null,
  attireMode: 'period',
  selectedEraId: 'pleistocene',
  customYear: '-18,000',
  yearSuffix: 'BCE',
  reconstructionMode: 'reconstruct',
  generationJobId: null,
  generationStatus: 'idle',
  generationProgress: 0,
  generationResult: null,
  generationError: null,
  useSimulationDemo: true,
};

export const App: React.FC = () => {
  const [journeyState, setJourneyState] = useState<UserJourneyState>(INITIAL_JOURNEY_STATE);
  const [terminalOpen, setTerminalOpen] = useState<boolean>(false);

  const updateJourney = (updates: Partial<UserJourneyState>) => {
    setJourneyState((prev) => ({ ...prev, ...updates }));
  };

  const navigateTo = (screen: ScreenId) => {
    // Input validation: cannot jump to Era or Results without a valid landscape image
    if ((screen === 'era' || screen === 'results') && !journeyState.landscapePreviewUrl) {
      setJourneyState((prev) => ({ ...prev, currentScreen: 'studio' }));
      return;
    }

    if (screen === 'results' && journeyState.generationStatus === 'idle') {
      setJourneyState((prev) => ({
        ...prev,
        currentScreen: screen,
        generationStatus: 'idle', // will trigger progress simulation in ResultsScreen
      }));
      return;
    }

    setJourneyState((prev) => ({ ...prev, currentScreen: screen }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    // Revoke any created blob object URLs to avoid memory leaks
    if (journeyState.landscapePreviewUrl && journeyState.landscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(journeyState.landscapePreviewUrl);
    }
    if (journeyState.selfiePreviewUrl && journeyState.selfiePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(journeyState.selfiePreviewUrl);
    }

    setJourneyState((prev) => ({
      ...prev,
      landscapeFile: null,
      landscapePreviewUrl: null,
      landscapeFileName: '',
      location: '',
      locationCoordinates: '',
      includeTraveler: false,
      selfieFile: null,
      selfiePreviewUrl: null,
      generationJobId: null,
      generationStatus: 'idle',
      generationProgress: 0,
      generationResult: null,
      generationError: null,
    }));
  };

  const handleStartNewJourney = () => {
    setJourneyState((prev) => ({
      ...prev,
      currentScreen: 'studio',
      generationStatus: 'idle',
      generationProgress: 0,
      generationResult: null,
      generationError: null,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canNavigateToEra = Boolean(journeyState.landscapePreviewUrl);
  const canNavigateToResults = Boolean(journeyState.landscapePreviewUrl && journeyState.selectedEraId);

  const isTest = import.meta.env.MODE === 'test';
  const screenTransition = isTest ? { duration: 0 } : { duration: 0.35, ease: 'easeInOut' as const };
  const exitAnimation = isTest ? undefined : { opacity: 0, y: -10 };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f6fafc] via-[#edf5fa] to-[#e6eff6] text-polar-navy selection:bg-sky-200 selection:text-polar-navy">
      {/* Top Navigation Bar */}
      <TopNavBar
        currentScreen={journeyState.currentScreen}
        onNavigate={navigateTo}
        onOpenTerminal={() => setTerminalOpen(true)}
      />

      {/* Editorial Workflow Stepper (visible on Studio, Era, and Results) */}
      {journeyState.currentScreen !== 'landing' && (
        <WorkflowStepper
          currentScreen={journeyState.currentScreen}
          onNavigate={navigateTo}
          canNavigateToEra={canNavigateToEra}
          canNavigateToResults={canNavigateToResults}
          locationName={journeyState.location.split(',')[0] || 'Captured Plate'}
        />
      )}

      {/* Screen Transition Area */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence initial={false}>
          {journeyState.currentScreen === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={exitAnimation}
              transition={screenTransition}
              className="flex-1 flex flex-col"
            >
              <LandingScreen onNavigate={navigateTo} />
            </motion.div>
          )}

          {journeyState.currentScreen === 'studio' && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={exitAnimation}
              transition={screenTransition}
              className="flex-1 flex flex-col"
            >
              <StudioScreen
                journeyState={journeyState}
                onUpdateJourney={updateJourney}
                onNavigate={navigateTo}
                onReset={handleReset}
              />
            </motion.div>
          )}

          {journeyState.currentScreen === 'era' && (
            <motion.div
              key="era"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={exitAnimation}
              transition={screenTransition}
              className="flex-1 flex flex-col"
            >
              <EraSelectionScreen
                journeyState={journeyState}
                onUpdateJourney={updateJourney}
                onNavigate={navigateTo}
              />
            </motion.div>
          )}

          {journeyState.currentScreen === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={exitAnimation}
              transition={screenTransition}
              className="flex-1 flex flex-col"
            >
              <ResultsScreen
                journeyState={journeyState}
                onUpdateJourney={updateJourney}
                onNavigate={navigateTo}
                onStartNewJourney={handleStartNewJourney}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shared Light Frosted Footer */}
      <Footer />

      {/* Scientific Terminal Modal */}
      {terminalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="frost-glass-card rounded-3xl max-w-2xl w-full border border-white shadow-2xl overflow-hidden">
            <div className="bg-white/80 border-b border-sky-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-code-telemetry text-frost-slate font-medium">
                  timelens-terminal // telemetry & status
                </span>
              </div>
              <button
                onClick={() => setTerminalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-polar-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-6 font-code-telemetry text-xs sm:text-sm leading-relaxed text-polar-navy space-y-3 bg-white/50">
              <p className="text-frost-slate"># TimeLens AI Architecture Status</p>
              <p className="text-polar-navy font-semibold">
                <span className="text-glacial-cyan font-bold">&gt;</span> active_screen: {journeyState.currentScreen}
              </p>
              <p className="text-polar-navy font-semibold">
                <span className="text-glacial-cyan font-bold">&gt;</span> target_epoch: {journeyState.selectedEraId} ({journeyState.customYear} {journeyState.yearSuffix})
              </p>
              <p className="text-polar-navy font-semibold">
                <span className="text-glacial-cyan font-bold">&gt;</span> geodetic_anchor: {journeyState.location} ({journeyState.locationCoordinates})
              </p>
              <p className="text-polar-navy font-semibold">
                <span className="text-glacial-cyan font-bold">&gt;</span> reconstruction_mode: {journeyState.reconstructionMode} (Empirical Palynology)
              </p>
              <p className="text-polar-navy font-semibold">
                <span className="text-glacial-cyan font-bold">&gt;</span> traveler_embedding: {journeyState.includeTraveler ? `ACTIVE (${journeyState.attireMode})` : 'DISABLED'}
              </p>
              <div className="pt-2 text-glacial-cyan flex items-center gap-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-glacial-cyan animate-pulse" />
                <span>[TERMINAL ONLINE] Zero Persistent Cloud Telemetry Mandate Active</span>
              </div>
            </div>
            <div className="p-4 bg-white/70 border-t border-sky-100 flex justify-end">
              <button
                onClick={() => setTerminalOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-bold bg-glacial-cyan text-white shadow-sm cursor-pointer"
              >
                Close Terminal
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </MotionConfig>
  );
};

export default App;
