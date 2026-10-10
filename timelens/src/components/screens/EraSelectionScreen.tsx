import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  const [customYearInput, setCustomYearInput] = useState<string>(journeyState.customYear || '-18,000');
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
      customYear: era.numericYear.toLocaleString(),
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
    <div className="w-full flex-1 flex flex-col justify-between">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-32">
        {/* Hero Title & Mode Switcher Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-sky-200/50">
          <div>
            <div className="text-xs font-headline font-semibold text-glacier-blue uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px] text-glacier-blue">timelapse</span>
              </span>
              Chronological Calibration
            </div>
            <h1 className="font-headline text-3xl md:text-5xl font-bold text-polar-navy tracking-tight">
              Select Target Geological Epoch
            </h1>
            <p className="text-frost-slate text-base md:text-lg mt-2 max-w-2xl font-normal leading-relaxed">
              Anchor your captured coordinates to an empirical paleoclimatic baseline or unleash speculative paleo-ecological drift.
            </p>
          </div>

          {/* Engine Mode Switcher (Pill Style) */}
          <div className="glass-panel p-1.5 border border-sky-200/70 rounded-full inline-flex self-start lg:self-auto shadow-frost-sm">
            <button
              onClick={() => onUpdateJourney({ reconstructionMode: 'reconstruct' })}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-headline rounded-full transition-all duration-200 cursor-pointer ${
                journeyState.reconstructionMode === 'reconstruct'
                  ? 'bg-glacier-blue text-white shadow-sm font-bold'
                  : 'text-frost-slate hover:text-polar-navy font-medium'
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
                  ? 'bg-glacier-blue text-white shadow-sm font-bold'
                  : 'text-frost-slate hover:text-polar-navy font-medium'
              }`}
              id="mode-imagine"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Imagine the Past</span>
            </button>
          </div>
        </div>

        {/* Scientific Integrity Disclaimer Notice */}
        <div className="mb-8 p-4 rounded-2xl frost-glass border border-sky-200/80 flex items-start gap-3 shadow-xs">
          <span className="material-symbols-outlined text-sky-600 text-lg mt-0.5">info</span>
          <div className="text-xs text-frost-slate leading-relaxed">
            <strong className="text-polar-navy font-semibold">Scientific Transparency: </strong>
            {journeyState.reconstructionMode === 'reconstruct'
              ? 'Empirical mode activates fossil pollen matrices, sediment core records, and quaternary paleoclimate bounds. Reconstructions represent probabilistic scientific interpretations, not absolute photographic fact.'
              : 'Imaginative scenario mode prioritizes atmospheric speculation and cinematic artistic freedom over rigid palynological constraints.'}
          </div>
        </div>

        {/* Timeline Scrubber & Year Selector Module (Frozen Glass Panel) */}
        <section className="glass-panel-elevated rounded-3xl p-6 md:p-8 mb-10 relative shadow-frost-md border border-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <span className="text-xs font-headline font-bold uppercase text-glacier-blue tracking-wider block mb-1">
                Global Chrono-Axis
              </span>
              <span className="text-xs md:text-sm text-frost-slate">
                Continuous geological timeline spanning late Paleozoic to Anthropocene transition
              </span>
            </div>

            {/* Custom Year Precision Console */}
            <div className="flex items-center gap-2 bg-white/80 border border-sky-200/80 rounded-full px-3.5 py-1.5 shadow-sm self-start md:self-auto">
              <label className="text-[11px] font-mono text-frost-slate uppercase" htmlFor="custom-year">
                PRECISION_TARGET:
              </label>
              <input
                id="custom-year"
                type="text"
                value={customYearInput}
                onChange={(e) => setCustomYearInput(e.target.value)}
                className="bg-transparent border-0 text-polar-navy text-xs font-mono font-bold w-20 p-0 focus:ring-0 focus:outline-none text-right"
              />
              <div className="border-l border-sky-200 pl-2 flex items-center">
                <select
                  value={customYearSuffix}
                  onChange={(e) => setCustomYearSuffix(e.target.value as 'BCE' | 'CE')}
                  className="bg-transparent text-glacier-blue text-xs font-mono font-bold border-0 focus:ring-0 p-0 pr-3 cursor-pointer uppercase"
                >
                  <option value="BCE">BCE / BP</option>
                  <option value="CE">CE / AD</option>
                </select>
              </div>
              <button
                onClick={handleApplyCustomYear}
                className="bg-glacier-blue hover:bg-sky-500 text-white text-[11px] font-bold font-mono px-3 py-1 rounded-full transition-colors shadow-sm cursor-pointer"
                type="button"
              >
                CALIBRATE
              </button>
            </div>
          </div>

          {/* Scrubber Track & Markers */}
          <div className="relative pt-6 pb-4">
            {/* Baseline track */}
            <div className="h-2 bg-sky-100 rounded-full w-full relative overflow-visible shadow-inner">
              <div className="absolute h-full bg-gradient-to-r from-sky-200 to-sky-400 rounded-full left-[8%] w-[62%]" />
              {/* Playhead indicator */}
              <div className="absolute left-[70%] -top-2.5 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-20">
                <div className="w-7 h-7 rounded-full border-2 border-white bg-glacier-blue shadow-lg flex items-center justify-center ring-4 ring-sky-200/70 transition-transform hover:scale-110">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="mt-2.5 text-[11px] font-mono font-bold bg-white/95 border border-sky-200 rounded-full px-3 py-0.5 text-glacier-blue whitespace-nowrap shadow-frost-sm">
                  TARGET: {selectedEra.yearLabel}
                </div>
              </div>
            </div>

            {/* Major Epoch Tick Markers */}
            <div className="grid grid-cols-5 text-center mt-7 text-xs font-mono text-frost-slate gap-1">
              {HISTORICAL_ERAS.map((era) => {
                const isSelected = journeyState.selectedEraId === era.id;
                return (
                  <button
                    key={era.id}
                    onClick={() => handleSelectEra(era)}
                    className={`flex flex-col items-center cursor-pointer transition-colors text-center ${
                      isSelected ? 'text-glacier-blue font-bold' : 'hover:text-glacier-blue'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mb-1.5 ${
                        isSelected ? 'bg-glacier-blue ring-2 ring-sky-200' : 'bg-sky-300'
                      }`}
                    />
                    <span className="text-xs truncate max-w-[120px]">{era.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-cool-slate">{era.yearLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Carousel Section Title & Filter Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-headline font-bold text-xl md:text-2xl text-polar-navy">
              Preserved Epoch Formations
            </h2>
            <p className="text-xs md:text-sm text-frost-slate">
              Select an epoch profile to calibrate biome synthesis parameters.
            </p>
          </div>

          {/* Epoch Quick Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterOptions.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 text-xs font-semibold font-headline rounded-full whitespace-nowrap shadow-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-glacier-blue text-white'
                      : 'border border-sky-200/80 bg-white/70 hover:bg-white text-frost-slate hover:text-polar-navy'
                  }`}
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
              <article
                key={era.id}
                onClick={() => handleSelectEra(era)}
                className={`group rounded-3xl flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 ${
                  isSelected
                    ? 'glass-panel-elevated border-2 border-glacier-blue shadow-frost-active ring-4 ring-sky-100/60'
                    : 'glass-panel border border-white hover:border-sky-300 hover:shadow-frost-lg shadow-frost-sm'
                }`}
              >
                <div>
                  {/* Visual Aperture 16:9 */}
                  <div className="relative aspect-video w-full overflow-hidden bg-sky-100 rounded-t-3xl">
                    <img
                      src={era.imageUrl}
                      alt={era.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {isSelected ? (
                      <div className="absolute top-3 left-3 bg-glacier-blue text-white border border-sky-300 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        SELECTED EPOCH
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-md border border-white/90 px-3 py-1 rounded-full text-xs font-mono font-bold text-glacier-blue shadow-sm">
                        {era.yearLabel}
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 text-[11px] font-mono font-medium bg-slate-900/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
                      {era.category}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className={`p-6 ${isSelected ? 'bg-gradient-to-b from-sky-50/60 to-transparent' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-headline font-bold text-glacier-blue uppercase tracking-wider">
                        {era.category}
                      </span>
                      {era.isCalibratedBaseline && (
                        <span className="text-xs font-mono text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">verified</span> Baseline
                        </span>
                      )}
                    </div>
                    <h3 className="font-headline font-bold text-lg md:text-xl text-polar-navy mb-2 group-hover:text-glacier-blue transition-colors">
                      {era.name}
                    </h3>
                    <p className="text-xs md:text-sm text-frost-slate line-clamp-2 mb-4 leading-relaxed">
                      {era.description}
                    </p>

                    {/* Telemetry Matrix */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-sky-100 font-mono text-xs">
                      <div>
                        <span className="block text-cool-slate text-[10px] uppercase font-sans">Avg Temp</span>
                        <span className="text-polar-navy font-bold">{era.avgTemp}</span>
                      </div>
                      <div>
                        <span className="block text-cool-slate text-[10px] uppercase font-sans">CO2 Level</span>
                        <span className="text-polar-navy font-bold">{era.co2Level}</span>
                      </div>
                      <div>
                        <span className="block text-cool-slate text-[10px] uppercase font-sans">Flora</span>
                        <span className="text-glacier-blue font-bold">{era.floraIndex}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-1 flex items-center justify-between text-xs font-mono text-frost-slate">
                  <span>{era.durationLabel}</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      isSelected ? 'text-glacier-blue font-bold' : 'group-hover:text-glacier-blue'
                    }`}
                  >
                    {isSelected ? 'Active Profile' : 'Configure Epoch'}
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </span>
                </div>
              </article>
            );
          })}

          {/* Interpolated Custom Epoch Card */}
          <article
            onClick={() => setShowCustomModal(true)}
            className="glass-panel rounded-3xl border-2 border-dashed border-sky-200/90 p-6 flex flex-col justify-between items-center text-center group hover:border-glacier-blue hover:shadow-frost-lg transition-all duration-300 shadow-frost-sm cursor-pointer"
          >
            <div className="my-auto py-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-sky-100/80 border border-sky-200 flex items-center justify-center text-glacier-blue mb-4 group-hover:scale-110 group-hover:bg-glacier-blue group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-2xl">tune</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-polar-navy mb-2">
                Interpolated Custom Epoch
              </h3>
              <p className="text-xs md:text-sm text-frost-slate max-w-xs mx-auto mb-6 leading-relaxed">
                Synthesize an unlisted temporal coordinate by dialing paleoclimatic isotopic levels directly.
              </p>
              <button
                type="button"
                className="px-5 py-2.5 text-xs font-headline font-bold rounded-full border border-sky-300/80 bg-white/80 group-hover:bg-glacier-blue group-hover:text-white text-glacier-blue transition-all uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Enter Paleoclimatic Mode
              </button>
            </div>
            <div className="w-full pt-4 border-t border-sky-100 text-xs font-mono font-medium text-frost-slate">
              SYNTHESIS ENGINE READY
            </div>
          </article>
        </div>

        {/* Supplementary Paleobotanical Metadata Inspector */}
        <section className="mt-12 glass-panel-elevated rounded-3xl border border-white p-6 md:p-8 shadow-frost-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sky-200/60 pb-4 mb-5 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-glacier-blue">
                <span className="material-symbols-outlined text-[18px]">biotech</span>
              </div>
              <h4 className="text-xs md:text-sm font-headline font-bold uppercase text-polar-navy tracking-wider">
                Reconstruction Ground Truth Telemetry ({selectedEra.name})
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-glacier-blue bg-sky-50 px-3 py-1 rounded-full border border-sky-200/60">
              PALEONTOLOGICAL RECORD CONFIDENCE: 98.4%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs font-mono">
            <div className="bg-white/60 p-4 rounded-2xl border border-sky-100">
              <span className="text-cool-slate block mb-1 text-[11px] font-sans font-semibold">SOIL CORE PROFILE:</span>
              <p className="text-polar-navy font-medium leading-relaxed">
                Permafrost cryosol with active freeze-thaw solifluction bands.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-sky-100">
              <span className="text-cool-slate block mb-1 text-[11px] font-sans font-semibold">PREDOMINANT TAXA:</span>
              <p className="text-polar-navy font-medium leading-relaxed">
                Picea glauca (White spruce), Betula nana, Artemisia steppe.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-sky-100">
              <span className="text-cool-slate block mb-1 text-[11px] font-sans font-semibold">ATMOSPHERIC OPTICS:</span>
              <p className="text-polar-navy font-medium leading-relaxed">
                High-latitude ice-crystal refraction, persistent low cold morning haze.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-sky-100">
              <span className="text-cool-slate block mb-1 text-[11px] font-sans font-semibold">GLACIOLOGY OFFSET:</span>
              <p className="text-polar-navy font-medium leading-relaxed">
                Cordilleran Ice Sheet terminus located ~12.4 km north of viewfinder.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Docked Selected Epoch Detail Bar & Action */}
      <aside className="sticky bottom-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-white/80 py-4 px-4 sm:px-6 md:px-8 shadow-frost-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Selection Summary HUD */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-glacier-blue to-sky-300 text-white flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-2xl">hourglass_top</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-headline font-bold uppercase text-glacier-blue">Selected Target:</span>
                <span className="font-headline font-bold text-polar-navy text-sm md:text-base">
                  {selectedEra.name} ({selectedEra.yearLabel})
                </span>
              </div>
              <div className="text-xs font-mono text-frost-slate flex flex-wrap items-center gap-2 md:gap-3 mt-0.5">
                <span className="bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/50">
                  MODE: {journeyState.reconstructionMode.toUpperCase()}
                </span>
                <span>•</span>
                <span>MODEL: TL-PALEO-70B-DIFFUSION</span>
                <span>•</span>
                <span className="text-glacier-blue font-bold">PRECISION: BOTANICAL RECONSTRUCTION</span>
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => onNavigate('studio')}
              className="px-5 py-2.5 text-xs font-headline font-bold rounded-full border border-sky-200 bg-white hover:bg-sky-50 text-polar-navy transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm text-glacier-blue">arrow_back</span>
              Back to Source Plate
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('results')}
              className="w-full md:w-auto bg-gradient-to-r from-glacier-blue via-sky-600 to-sky-500 text-white px-6 py-2.5 font-headline font-bold text-xs hover:shadow-lg hover:brightness-105 transition-all rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-base">auto_videocam</span>
              Synthesize Ancient Landscape
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Custom Epoch Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h3 className="font-headline font-bold text-polar-navy text-lg">Interpolate Custom Epoch</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-polar-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <p className="text-xs text-frost-slate">
              Enter specific years BCE/CE to extrapolate target paleoclimatic conditions:
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-polar-navy block mb-1">Target Year</label>
                <input
                  type="text"
                  value={customYearInput}
                  onChange={(e) => setCustomYearInput(e.target.value)}
                  placeholder="e.g. -25,000"
                  className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-polar-navy block mb-1">Epoch Era</label>
                <select
                  value={customYearSuffix}
                  onChange={(e) => setCustomYearSuffix(e.target.value as 'BCE' | 'CE')}
                  className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm font-mono"
                >
                  <option value="BCE">BCE (Before Common Era / BP)</option>
                  <option value="CE">CE (Common Era / AD)</option>
                </select>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-frost-slate hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleApplyCustomYear();
                  setShowCustomModal(false);
                }}
                className="px-5 py-2 rounded-full text-xs font-bold bg-glacier-blue text-white shadow-sm"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
