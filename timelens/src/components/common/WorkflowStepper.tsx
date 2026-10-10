import React from 'react';
import type { ScreenId } from '../../types';

interface WorkflowStepperProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  canNavigateToEra: boolean;
  canNavigateToResults: boolean;
  locationName?: string;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentScreen,
  onNavigate,
  canNavigateToEra,
  canNavigateToResults,
  locationName = 'Hoh Rain Forest',
}) => {
  return (
    <div className="bg-white/45 backdrop-blur-lg border-b border-sky-100/80 px-4 sm:px-6 md:px-12 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Stepper Sequence */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
          {/* Step 1 */}
          <button
            onClick={() => onNavigate('studio')}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all whitespace-nowrap text-xs font-headline cursor-pointer ${
              currentScreen === 'studio'
                ? 'bg-white/95 border-sky-400 shadow-sm text-sky-700 font-bold'
                : 'text-frost-slate border-transparent hover:bg-white/60 font-medium'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                currentScreen === 'studio'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'border border-sky-300/70 text-cool-slate'
              }`}
            >
              1
            </span>
            <span className="tracking-wider uppercase">
              Step 1: Capture Source {currentScreen !== 'studio' && `(${locationName})`}
            </span>
          </button>

          <span className="text-sky-300 text-xs font-bold">/</span>

          {/* Step 2 */}
          <button
            onClick={() => canNavigateToEra && onNavigate('era')}
            disabled={!canNavigateToEra}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all whitespace-nowrap text-xs font-headline ${
              currentScreen === 'era'
                ? 'bg-white/95 border-sky-400 shadow-sm text-sky-700 font-bold'
                : canNavigateToEra
                ? 'text-frost-slate border-transparent hover:bg-white/60 font-medium cursor-pointer'
                : 'text-slate-400 border-transparent cursor-not-allowed opacity-60 font-medium'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                currentScreen === 'era'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'border border-sky-300/70 text-cool-slate'
              }`}
            >
              2
            </span>
            <span className="tracking-wider uppercase">Step 2: Era Selection</span>
          </button>

          <span className="text-sky-300 text-xs font-bold">/</span>

          {/* Step 3 */}
          <button
            onClick={() => canNavigateToResults && onNavigate('results')}
            disabled={!canNavigateToResults}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all whitespace-nowrap text-xs font-headline ${
              currentScreen === 'results'
                ? 'bg-white/95 border-sky-400 shadow-sm text-sky-700 font-bold'
                : canNavigateToResults
                ? 'text-frost-slate border-transparent hover:bg-white/60 font-medium cursor-pointer'
                : 'text-slate-400 border-transparent cursor-not-allowed opacity-60 font-medium'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                currentScreen === 'results'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'border border-sky-300/70 text-cool-slate'
              }`}
            >
              3
            </span>
            <span className="tracking-wider uppercase">Step 3: Synthesis</span>
          </button>
        </div>

        {/* Live Pipeline Telemetry Indicator */}
        <div className="flex items-center gap-4 text-xs font-mono text-cool-slate">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/80 border border-sky-200/60 shadow-xs">
            <span className="material-symbols-outlined text-sky-600 text-sm">satellite_alt</span>
            <span className="font-medium text-sky-800">GEODETIC ANCHOR: ONLINE</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-cool-slate">
            <span>LAT/LONG BUFFER ±0.001°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
