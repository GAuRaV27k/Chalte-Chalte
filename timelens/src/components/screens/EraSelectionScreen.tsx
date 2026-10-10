import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HISTORICAL_ERAS } from '../../data/eras';
import type { HistoricalEra, ScreenId, UserJourneyState } from '../../types';

interface EraSelectionScreenProps {
  journeyState: UserJourneyState;
  onUpdateJourney: (updates: Partial<UserJourneyState>) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const EraSelectionScreen: React.FC<EraSelectionScreenProps> = ({
  journeyState,
  onUpdateJourney,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('All Epochs');
  const [customYearInput, setCustomYearInput] = useState<string>(journeyState.customYear || '18000');
  const [customYearSuffix, setCustomYearSuffix] = useState<'BCE' | 'CE'>(journeyState.yearSuffix || 'BCE');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const filterOptions = [
    'All Epochs',
    'Deep Paleozoic',
    'Mesozoic Fauna',
    'Quaternary Ice',
    'Holocene Biomes',
  ];

  const filteredEras =
    activeFilter === 'All Epochs'
      ? HISTORICAL_ERAS
      : HISTORICAL_ERAS.filter((era) => era.filterTag === activeFilter);

  const selectedEra: HistoricalEra =
    HISTORICAL_ERAS.find((e) => e.id === journeyState.selectedEraId) || HISTORICAL_ERAS[2];

  const handleSelectEra = (era: HistoricalEra) => {
    onUpdateJourney({
      selectedEraId: era.id,
      customYear: era.numericYear.toString(),
      yearSuffix: era.yearSuffix,
    });
  };

  const handleApplyCustomYear = () => {
    onUpdateJourney({
      customYear: customYearInput,
      yearSuffix: customYearSuffix,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full flex-1 flex flex-col justify-between transition-colors duration-700 ${
        journeyState.reconstructionMode === 'imagine' ? 'bg-slate-900' : 'bg-transparent'
      }`}
    >
      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-32 transition-colors duration-700 ${
        journeyState.reconstructionMode === 'imagine' ? 'text-white' : 'text-polar-navy'
      }`}>
        {/* Header & Reconstruction Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-sky-200/50">
          <div>
            <span className="text-xs font-headline font-semibold text-sky-600 uppercase tracking-widest mb-1 block">
              Step 2 of 3 — Time Period
            </span>
            <h1 className={`font-headline text-3xl md:text-4xl font-bold tracking-tight transition-colors duration-700 ${
              journeyState.reconstructionMode === 'imagine' ? 'text-white' : 'text-polar-navy'
            }`}>
              Select Target Geological Epoch
            </h1>
            <p className="text-cool-slate text-sm md:text-base mt-2 max-w-2xl font-normal leading-relaxed">
              Choose a historical era to reconstruct how your landscape appeared in the past.
            </p>
          </div>

          {/* Reconstruction Mode Switcher */}
          <div className="bg-white/90 p-1.5 border border-sky-200/80 rounded-full inline-flex self-start lg:self-auto shadow-sm">
            <button
              onClick={() => onUpdateJourney({ reconstructionMode: 'reconstruct' })}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-headline rounded-full transition-all duration-200 cursor-pointer ${
                journeyState.reconstructionMode === 'reconstruct'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-cool-slate hover:text-polar-navy font-medium'
              }`}
              id="mode-reconstruct"
              type="button"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  journeyState.reconstructionMode === 'reconstruct' ? 'bg-white' : 'bg-sky-400'
                }`}
              />
              <span>Historical Reconstruction</span>
            </button>
            <button
              onClick={() => onUpdateJourney({ reconstructionMode: 'imagine' })}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-headline rounded-full transition-all duration-200 cursor-pointer ${
                journeyState.reconstructionMode === 'imagine'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-cool-slate hover:text-polar-navy font-medium'
              }`}
              id="mode-imagine"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Imagine the Past</span>
            </button>
          </div>
        </div>

        {/* Scientific Transparency Disclaimer Notice */}
        <div className="mb-8 p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex items-start gap-3 shadow-xs">
          <span className="material-symbols-outlined text-sky-600 text-lg mt-0.5">info</span>
          <div className="text-xs text-cool-slate leading-relaxed">
            <strong className="text-polar-navy font-semibold">Scientific Transparency: </strong>
            {journeyState.reconstructionMode === 'reconstruct'
              ? 'Empirical mode activates fossil pollen matrices, sediment core records, and quaternary paleoclimate bounds. Reconstructions represent probabilistic scientific interpretations, not absolute photographic fact.'
              : 'Imaginative scenario mode prioritizes atmospheric speculation and cinematic artistic freedom over rigid palynological constraints.'}
          </div>
        </div>

        {/* Horizontal Scrollable Timeline Selector */}
        <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 mb-10 shadow-sm border border-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-headline font-bold uppercase text-sky-600 tracking-wider block mb-1">
                Historical Timeline
              </span>
              <span className="text-xs text-cool-slate">
                Select an era from 300 million years ago to modern history
              </span>
            </div>

            {/* Custom Year Selector Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="px-4 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-headline font-semibold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit_calendar</span>
                <span>Enter Custom Year</span>
              </button>
            </div>
          </div>

          {/* Timeline Nodes Dial */}
          <div className="relative pt-4 pb-2">
            <div className="h-1.5 bg-sky-100 rounded-full w-full relative mb-6">
              <div className="absolute h-full bg-sky-400 rounded-full left-0 right-0" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {HISTORICAL_ERAS.map((era) => {
                const isSelected = journeyState.selectedEraId === era.id;
                return (
                  <motion.button
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: isSelected ? 1.05 : 1 }}
                    key={era.id}
                    type="button"
                    onClick={() => handleSelectEra(era)}
                    className={`p-3 rounded-2xl flex flex-col items-center cursor-pointer transition-colors border text-center relative ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 shadow-sm'
                        : 'bg-white/90 border-sky-100 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeTimelineBorder"
                        className="absolute inset-0 border-2 border-sky-500 rounded-2xl pointer-events-none"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span
                      className={`w-3 h-3 rounded-full mb-2 z-10 transition-colors ${
                        isSelected ? 'bg-sky-600 ring-4 ring-sky-200' : 'bg-sky-300'
                      }`}
                    />
                    <span className="text-xs font-headline font-bold text-polar-navy line-clamp-1 z-10">
                      {era.name.split(' ')[0]}
                    </span>
                    <span className="text-[11px] font-mono text-sky-700 font-semibold mt-0.5 z-10">
                      {era.yearLabel}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Filter Chips & Era Cards */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-headline font-bold text-xl text-polar-navy">
              Historical Era Cards
            </h2>
            <p className="text-xs text-cool-slate">
              Click any era card to set it as your target historical period.
            </p>
          </div>

          {/* Quick Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterOptions.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 text-xs font-semibold font-headline rounded-full whitespace-nowrap shadow-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'border border-sky-200/80 bg-white/80 hover:bg-white text-cool-slate hover:text-polar-navy'
                  }`}
                  type="button"
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selectable Historical Eras Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEras.map((era) => {
            const isSelected = journeyState.selectedEraId === era.id;
            return (
              <motion.article
                layout
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                key={era.id}
                onClick={() => handleSelectEra(era)}
                className={`group rounded-3xl flex flex-col justify-between cursor-pointer relative overflow-hidden transition-colors duration-300 ${
                  isSelected
                    ? 'bg-white shadow-md'
                    : 'bg-white/80 border border-sky-200/80 hover:border-sky-300 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeEraCardBorder"
                    className="absolute inset-0 border-2 border-sky-500 rounded-3xl pointer-events-none z-20 shadow-[0_0_0_4px_rgba(224,242,254,0.5)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div>
                  {/* Image Aperture */}
                  <div className="relative aspect-video w-full overflow-hidden bg-sky-100 rounded-t-3xl">
                    <img
                      src={era.imageUrl}
                      alt={era.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <AnimatePresence mode="wait">
                      {isSelected ? (
                        <motion.div
                          key="selected-badge"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute top-3 left-3 bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm z-10"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          SELECTED ERA
                        </motion.div>
                      ) : (
                        <motion.div
                          key="year-badge"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-3 left-3 bg-white/90 border border-white px-3 py-1 rounded-full text-xs font-mono font-bold text-sky-800 shadow-sm z-10"
                        >
                          {era.yearLabel}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-headline font-bold text-sky-600 uppercase tracking-wider">
                        {era.category}
                      </span>
                      <span className="text-xs font-mono text-cool-slate">
                        {era.durationLabel}
                      </span>
                    </div>
                    <h3 className="font-headline font-bold text-lg text-polar-navy mb-2 group-hover:text-sky-600 transition-colors">
                      {era.name}
                    </h3>
                    <p className="text-xs text-cool-slate leading-relaxed mb-4">
                      {era.description}
                    </p>

                    {/* Metrics Pill Grid */}
                    <div className="grid grid-cols-2 gap-2 py-3 border-t border-sky-100 font-mono text-xs">
                      <div>
                        <span className="block text-cool-slate text-[10px] font-sans">Avg Temp</span>
                        <span className="text-polar-navy font-bold">{era.avgTemp}</span>
                      </div>
                      <div>
                        <span className="block text-cool-slate text-[10px] font-sans">CO₂ Level</span>
                        <span className="text-polar-navy font-bold">{era.co2Level}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-1 flex items-center justify-between text-xs font-headline">
                  <span className={`font-bold flex items-center gap-1 ${isSelected ? 'text-sky-600' : 'text-cool-slate group-hover:text-sky-600'}`}>
                    {isSelected ? 'Selected' : 'Select Era'}
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      </main>

      {/* STICKY BOTTOM DOCK */}
      <aside className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-sky-200/60 py-4 px-4 sm:px-6 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-xl">hourglass_top</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-headline font-bold text-sky-600">Selected Target:</span>
                <span className="font-headline font-bold text-polar-navy text-sm">
                  {selectedEra.name} ({selectedEra.yearLabel})
                </span>
              </div>
              <div className="text-xs text-cool-slate mt-0.5">
                Mode: <span className="font-semibold text-polar-navy uppercase">{journeyState.reconstructionMode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => onNavigate('studio')}
              className="px-5 py-2.5 text-xs font-headline font-semibold rounded-full border border-sky-200 bg-white hover:bg-sky-50 text-polar-navy transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Capture</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('results')}
              className="w-full md:w-auto bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-7 py-2.5 font-headline font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>Reconstruct This Era</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Custom Year Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-sky-100 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <h3 className="font-headline font-bold text-polar-navy text-base">Enter Custom Year</h3>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-polar-navy cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className="text-xs text-cool-slate">
                Enter a specific year to target for your historical reconstruction:
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-polar-navy block mb-1">Year</label>
                  <input
                    type="text"
                    value={customYearInput}
                    onChange={(e) => setCustomYearInput(e.target.value)}
                    placeholder="e.g. 18000"
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-polar-navy block mb-1">Era Suffix</label>
                  <select
                    value={customYearSuffix}
                    onChange={(e) => setCustomYearSuffix(e.target.value as 'BCE' | 'CE')}
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm font-mono"
                  >
                    <option value="BCE">BCE (Before Common Era)</option>
                    <option value="CE">CE (Common Era)</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-cool-slate hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyCustomYear();
                    setShowCustomModal(false);
                  }}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-sky-600 text-white shadow-xs"
                >
                  Apply Year
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
