import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { ScreenId } from '../../types';

interface LandingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  const [sliderPos, setSliderPos] = useState<number>(48);
  const [activeHorizon, setActiveHorizon] = useState<string>('pleistocene');

  const horizons = [
    { id: 'pleistocene', label: 'Late Pleistocene (-18K BP)', sliderVal: 48 },
    { id: 'holocene', label: 'Holocene Optimum (-6K BP)', sliderVal: 30 },
    { id: 'bronze', label: 'Bronze Age Megafauna (-3K BP)', sliderVal: 65 },
    { id: 'pre-industrial', label: 'Pre-Industrial Wilds (1650 CE)', sliderVal: 80 },
  ];

  return (
    <div className="relative overflow-x-hidden min-h-screen">
      {/* Atmospheric Glacial Ambient Radiance */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-sky-200/40 to-cyan-100/30 rounded-full blur-[130px]" />
        <div className="absolute top-[40%] -right-[15%] w-[800px] h-[800px] bg-gradient-to-bl from-blue-200/30 to-teal-100/25 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[10%] left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-sky-200/35 to-indigo-100/20 rounded-full blur-[120px]" />
      </div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[850px] md:min-h-[900px] flex items-center justify-center overflow-hidden border-b border-sky-100/70">
        {/* Landscape Plate with Glacial Veil Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover object-center opacity-30 scale-105 filter saturate-75 brightness-110"
            alt="Deep cinematic ancient primeval conifer forest shrouded in primordial morning mist"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0a60grqM5HjKjMm20CYMecEsNdVzp8hQvD0rbuV008oz8byotCBHO3I4im_0Aeh6R3SD9xUqmnaKkxDA3fVB_7YKeqluqspMKC0QAfh5axjpx1UGb9AQGNLfD3_ofkqCmkUpQbUlwVBuizgQ_UPOQnwO6y2s2chgDWp9hFOJhwRlqm0RgrHsUmMsV4sC0-zHYndL8AcaaFowWKmXa9-lBbryliGm4b3NX7hPSFBSWStsFwMYQY-6f_Q"
          />
          {/* Glacial gradient light veil overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#edf5fa] via-[#edf5fa]/85 to-[#f6fafc]/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#edf5fa]/90 via-transparent to-[#edf5fa]/90" />
        </div>

        {/* Telemetry Frame Viewfinder HUD Elements */}
        <div className="absolute top-10 left-10 hidden lg:flex items-center gap-2 text-frost-slate font-code-telemetry text-xs pointer-events-none frost-glass px-4 py-2 rounded-full border border-white/80">
          <span className="w-2 h-2 rounded-full bg-glacial-cyan" />
          <span>LAT: 46.2044° N / LON: 06.1432° E</span>
          <span className="text-glacial-cyan ml-2 font-medium">● REC // FROST-SYNTH</span>
        </div>

        <div className="absolute top-10 right-10 hidden lg:flex items-center gap-2 text-frost-slate font-code-telemetry text-xs pointer-events-none frost-glass px-4 py-2 rounded-full border border-white/80">
          <span>OPTICAL RETICLE: 65MM ANA-WIDE</span>
          <span className="material-symbols-outlined text-sm text-glacial-cyan">lens_blur</span>
        </div>

        <div className="absolute bottom-10 left-10 hidden lg:flex items-center gap-2 text-frost-slate font-code-telemetry text-xs pointer-events-none frost-glass px-4 py-2 rounded-full border border-white/80">
          <span>FIDELITY TOLERANCE: ±0.04% STRATIGRAPHIC</span>
        </div>

        <div className="absolute bottom-10 right-10 hidden lg:flex items-center gap-2 text-frost-slate font-code-telemetry text-xs pointer-events-none frost-glass px-4 py-2 rounded-full border border-white/80">
          <span>DIFFUSION SEED: 0x9F33A_PLEISTOCENE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        </div>

        {/* Hero Main Glass Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center py-20 flex flex-col items-center"
        >
          {/* Open Science Frost Pill */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 frost-glass rounded-full mb-8 shadow-sm border border-white">
            <span className="w-2 h-2 rounded-full bg-glacial-cyan animate-pulse" />
            <span className="text-polar-navy font-label-caps text-xs tracking-widest uppercase font-semibold">
              Open Science Initiative • Zero Persistent Telemetry
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display-hero text-polar-navy tracking-tight mb-6 max-w-4xl drop-shadow-sm leading-tight">
            Every Place Has a Past
          </h1>

          {/* Evocative Subheadline */}
          <p className="text-base sm:text-lg md:text-xl font-body-lead text-frost-slate max-w-2xl mb-10 leading-relaxed font-normal">
            Photograph any landscape today. Reconstruct how the earth breathed centuries, millennia, or millions of years ago using open-weight diffusion and cinematic video synthesis.
          </p>

          {/* CTA Cluster */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('studio')}
              className="w-full sm:w-auto bg-gradient-to-r from-glacial-cyan to-sky-500 text-white font-semibold text-xs font-label-caps px-8 py-4 rounded-full hover:shadow-[0_8px_25px_rgba(2,132,199,0.35)] transition-all text-center tracking-widest uppercase shadow-md shadow-sky-500/20 cursor-pointer"
            >
              Explore the Past
            </motion.button>

            <a
              href="#visualizer"
              className="w-full sm:w-auto frost-glass hover:bg-white text-polar-navy font-label-caps text-xs px-8 py-4 rounded-full transition-all text-center tracking-widest uppercase flex items-center justify-center gap-2 shadow-sm border border-white hover:shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-glacial-cyan">play_arrow</span>
              <span className="font-medium">Explore Sample Reconstructions</span>
            </a>
          </div>

          {/* Micro Telemetry Scroll Cue */}
          <div className="mt-16 flex flex-col items-center gap-2 text-frost-slate">
            <span className="text-xs font-code-telemetry tracking-widest uppercase">Epoch Continuum</span>
            <div className="w-px h-10 bg-gradient-to-b from-glacial-cyan to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* ================= INTERACTIVE TEMPORAL COMPARISON VISUALIZER ================= */}
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-12 relative" id="visualizer">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-label-caps text-glacial-cyan uppercase tracking-widest font-semibold mb-2">
                Instrument Aperture — Comparative Synthesis
              </div>
              <h2 className="text-3xl md:text-4xl font-headline-lg text-polar-navy tracking-tight font-semibold">
                Temporal Epoch Reconstruction
              </h2>
            </div>
            {/* Coordinate Badges */}
            <div className="text-xs font-code-telemetry text-frost-slate frost-glass px-5 py-3 rounded-full flex items-center gap-4 border border-white/80 shadow-sm self-start md:self-auto">
              <span>Coordinates: <strong className="text-polar-navy">46.2044° N, 6.1432° E</strong></span>
              <span className="text-sky-200">|</span>
              <span>Carbon Datum: <strong className="text-glacial-cyan font-semibold">-18,000 BP</strong></span>
            </div>
          </div>

          {/* Cinematic Comparison Frame */}
          <div
            className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden border border-white/80 frost-glass-card shadow-[0_20px_50px_rgba(2,132,199,0.12)] select-none group"
            data-testid="interactive-comparison-slider"
          >
            {/* Background Layer: Reconstructed Epoch (Pleistocene) */}
            <div className="absolute inset-0 w-full h-full">
              <img
                className="w-full h-full object-cover object-center"
                alt="Expansive panoramic alpine glacial valley during the late Pleistocene epoch"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4CLOLOx3RHMpjmhHJXOsF-LCuUEyYXtN7j4qviBiL4jAHRVNx_groM5cHF7CCvBPyKf1agw8PdLE0eBRAPixH6cNhqT5mmyv4ckOtwToD7lVMgXmpmOXjQ-aVkqRy8ZHaikzcQ0s2HxoyrwR8lcfn1S95BOFX7cPLAhyAaNWudxEPFuaIhMLKgq8IUwLlCrAFXazzUtcqcj0zPMYO4i8jTzvw4JAL6A48m_R1ynRNELkLHIBtdzOdLw"
              />
              <div className="absolute top-4 sm:top-5 right-4 sm:right-5 frost-glass px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-code-telemetry text-glacial-cyan font-semibold border border-white shadow-md">
                PLEISTOCENE GLACIAL FORESTS • -18,000 BP
              </div>
            </div>

            {/* Foreground Layer: Contemporary Landscape (Clipped via sliding mask) */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden transition-[width] duration-75"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="w-[100vw] max-w-[1152px] h-full relative">
                <img
                  className="w-full h-full object-cover object-center"
                  alt="Modern alpine valley in Switzerland in late autumn with clear blue-gray skies"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDySZzQQ9h6LnGepN0dl6xw0oDCZeNGr6r_gJGbe0BUIw5t1tmLO9zGknlCWs9pSKrOD2mbvEWBTxgzfeED0VpFWo8c8k5CQkZtrof0hdriXmPq25hQ8MLN-DfpG40EzncmVUlSmYgcJG8o5QPxDexwqJ4a9IYtjipDQ_hXx96CmupqpxvN18IoFOkO46zvn2zVTl3Teivs3DBXxvhEBS9fkZovyXkGRPaugJntJKB4Ra1rbLjHIeogAw"
                />
                <div className="absolute top-4 sm:top-5 left-4 sm:left-5 frost-glass px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-code-telemetry text-polar-navy font-semibold border border-white shadow-md">
                  CONTEMPORARY ALPINE VALLEY • ANTHROPOCENE (2025 CE)
                </div>
              </div>
            </div>

            {/* Vertical Scrub Line Reticle */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none transition-[left] duration-75"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-0.5 h-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.9)] relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full frost-glass border border-white flex items-center justify-center shadow-lg -translate-x-1/2 text-glacial-cyan">
                  <span className="material-symbols-outlined text-sm font-semibold">compare_arrows</span>
                </div>
              </div>
            </div>

            {/* Range Input Slider Overlay */}
            <input
              aria-label="Temporal Comparison Slider"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              max="100"
              min="0"
              type="range"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
            />

            {/* Bottom Viewfinder Telemetry Bar */}
            <div className="absolute bottom-0 inset-x-0 frost-glass border-t border-white/80 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between text-xs font-code-telemetry text-frost-slate z-20">
              <div className="flex items-center gap-4 sm:gap-6">
                <span className="flex items-center gap-1.5 font-medium text-polar-navy">
                  <span className="w-2 h-2 rounded-full bg-glacial-cyan animate-ping" />
                  <span>STRATIGRAPHY LENS: ACTIVE</span>
                </span>
                <span className="hidden sm:inline">SAMPLE DEPTH: 1,420M SEDIMENTARY</span>
              </div>
              <div className="flex items-center gap-2 text-glacial-cyan font-semibold">
                <span className="material-symbols-outlined text-sm">drag_indicator</span>
                <span className="text-xs font-label-caps tracking-wider uppercase">Scrub Across Millennia</span>
              </div>
            </div>
          </div>

          {/* Micro Stepper Epoch Chips */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-between gap-3 frost-glass p-3.5 sm:p-4 rounded-3xl border border-white/90 shadow-sm text-frost-slate">
            <div className="text-xs font-label-caps uppercase tracking-widest text-polar-navy font-semibold pl-2">
              Stratigraphic Horizons:
            </div>
            <div className="flex flex-wrap gap-2">
              {horizons.map((h) => {
                const isActive = activeHorizon === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      setActiveHorizon(h.id);
                      setSliderPos(h.sliderVal);
                    }}
                    className={`px-4 sm:px-5 py-2 text-xs font-label-caps rounded-full uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-glacial-cyan to-sky-500 text-white font-medium'
                        : 'frost-glass text-frost-slate hover:text-polar-navy hover:bg-white border border-white/80'
                    }`}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    <span>{h.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= ARCHIVAL FEATURE PILLARS SECTION ================= */}
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-12 relative border-b border-sky-100/70">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <div className="text-xs font-label-caps text-glacial-cyan uppercase tracking-widest font-semibold mb-2">
              Methodology & Foundations
            </div>
            <h2 className="text-3xl md:text-4xl font-headline-lg text-polar-navy tracking-tight font-semibold">
              Scientific Reconstruction Pillars
            </h2>
            <p className="text-frost-slate font-body-muted text-sm sm:text-base mt-3 leading-relaxed">
              Trained on millions of historical botanical records, satellite terrain heights, and paleoclimatology models rather than commercial marketing feeds.
            </p>
          </div>

          {/* 3 Frozen Glass Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 01 */}
            <div className="frost-glass-card rounded-3xl p-8 flex flex-col justify-between group hover:shadow-[0_20px_40px_rgba(2,132,199,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div>
                <div className="text-xs font-code-telemetry text-glacial-cyan font-semibold tracking-widest mb-4 flex items-center justify-between">
                  <span>01 // WEIGHT ARCHITECTURE</span>
                  <div className="w-8 h-8 rounded-full frost-glass flex items-center justify-center text-glacial-cyan">
                    <span className="material-symbols-outlined text-base">memory</span>
                  </div>
                </div>
                <h3 className="text-2xl font-headline-md text-polar-navy mb-3 font-semibold">
                  Geomorphic Open Weights
                </h3>
                <p className="text-frost-slate leading-relaxed mb-6 text-sm">
                  Run natively on your personal workstation with Ollama / ComfyUI integration or orchestrate via sovereign distributed clusters. Zero lock-in, zero cloud mandate, zero persistent telemetry.
                </p>
              </div>
              <div className="pt-4 border-t border-sky-100 flex items-center justify-between text-xs font-code-telemetry text-frost-slate">
                <span>WEIGHT SIZE: 7.4B PARAMETERS</span>
                <span className="text-glacial-cyan font-semibold bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                  APACHE 2.0
                </span>
              </div>
            </div>

            {/* Column 02 */}
            <div className="frost-glass-card rounded-3xl p-8 flex flex-col justify-between group hover:shadow-[0_20px_40px_rgba(2,132,199,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div>
                <div className="text-xs font-code-telemetry text-glacial-cyan font-semibold tracking-widest mb-4 flex items-center justify-between">
                  <span>02 // DOMAIN FIDELITY</span>
                  <div className="w-8 h-8 rounded-full frost-glass flex items-center justify-center text-glacial-cyan">
                    <span className="material-symbols-outlined text-base">history_edu</span>
                  </div>
                </div>
                <h3 className="text-2xl font-headline-md text-polar-navy mb-3 font-semibold">
                  Historical Fidelity Engine
                </h3>
                <p className="text-frost-slate leading-relaxed mb-6 text-sm">
                  Incorporates fossil pollen databases, palynological maps, and peer-reviewed quaternary science to guarantee botanical fauna accurately reflects the chosen geochronological era.
                </p>
              </div>
              <div className="pt-4 border-t border-sky-100 flex items-center justify-between text-xs font-code-telemetry text-frost-slate">
                <span>ACCURACY PRIORS: 98.2% BOTANIC</span>
                <span className="text-glacial-cyan font-semibold bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                  QUATERNARY
                </span>
              </div>
            </div>

            {/* Column 03 */}
            <div className="frost-glass-card rounded-3xl p-8 flex flex-col justify-between group hover:shadow-[0_20px_40px_rgba(2,132,199,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div>
                <div className="text-xs font-code-telemetry text-glacial-cyan font-semibold tracking-widest mb-4 flex items-center justify-between">
                  <span>03 // KINEMATICS & MOTION</span>
                  <div className="w-8 h-8 rounded-full frost-glass flex items-center justify-center text-glacial-cyan">
                    <span className="material-symbols-outlined text-base">videocam</span>
                  </div>
                </div>
                <h3 className="text-2xl font-headline-md text-polar-navy mb-3 font-semibold">
                  Cinematic Temporal Video
                </h3>
                <p className="text-frost-slate leading-relaxed mb-6 text-sm">
                  Transition from a solitary still camera phone frame to a slow 4K atmospheric 60-second drone tracking shot capturing prehistoric wind currents, fog dissipation, and canopy sway.
                </p>
              </div>
              <div className="pt-4 border-t border-sky-100 flex items-center justify-between text-xs font-code-telemetry text-frost-slate">
                <span>OUTPUT SPECS: 4K 2.39:1 PRORES</span>
                <span className="text-glacial-cyan font-semibold bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                  DIFFUSION
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= EXPEDITION PLATE LEDGER (BENTO) ================= */}
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-12 relative border-b border-sky-100/70" id="archives">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <div className="text-xs font-label-caps text-glacial-cyan uppercase tracking-widest font-semibold mb-2">
                Expedition Plate Ledger
              </div>
              <h2 className="text-3xl md:text-4xl font-headline-lg text-polar-navy tracking-tight font-semibold">
                Recent Landscape Decodings
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('era')}
                className="px-5 py-2.5 bg-gradient-to-r from-glacial-cyan to-sky-500 text-white rounded-full text-xs font-label-caps uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-sky-500/20 hover:scale-[1.02] transition-transform font-medium cursor-pointer"
              >
                <span>Browse Geological Epochs</span>
                <span className="material-symbols-outlined text-xs">north_east</span>
              </button>
            </div>
          </div>

          {/* Archival Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Plate 1: Large Featured Plate */}
            <div className="md:col-span-8 frost-glass-card rounded-3xl overflow-hidden flex flex-col group border border-white/80 hover:shadow-[0_24px_50px_rgba(2,132,199,0.14)] transition-all duration-300">
              <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl bg-slate-100">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="Ancient North American inland seaway during the Cretaceous era"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeF3nuDTSNvVoAvytsrg3pSb0akqed4jcaBt-Uo8GZWjZHxunoDQSstZj9Om4F0MrUYdf-LoJUGiHT-g1Jb5-rVLJ-UhngqIJoBv-txkWEkxX_WaXUtMFfA_C-MjuO1n58xCm-JA06xToI_aOE3VPG1KUqjeY6WX1uzfBL7u2oYHcDTwC9ANhrR4s-PFrYKv9EW8dFZRMBtuYmrLHZWXIFruYMO9gVGhuQg1ROKsv2pvWlDisEmLjskQ"
                />
                <div className="absolute top-4 left-4 frost-glass px-4 py-2 rounded-full text-xs font-code-telemetry text-glacial-cyan font-semibold border border-white shadow-md">
                  PLATE NO. 084 // WESTERN INTERIOR SEAWAY
                </div>
              </div>
              <div className="p-8 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-code-telemetry text-frost-slate mb-2">
                    <span>DATUM: -82,000,000 BP</span>
                    <span>•</span>
                    <span>LOCATION: COLORADO BASIN</span>
                  </div>
                  <h3 className="text-2xl font-headline-md text-polar-navy mb-2 font-semibold">
                    Submerged Continents & Coastal Brackish Marshes
                  </h3>
                  <p className="text-sm font-body-muted text-frost-slate leading-relaxed">
                    Reconstructed from present-day arid red sandstone mesas. The model inverted tectonic shifts to reveal a temperate inland sea teeming with prehistoric shorelines and towering cycad forests.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-sky-100 flex items-center justify-between text-xs font-code-telemetry text-frost-slate">
                  <span>SYNTHESIS LATENCY: 4.8 SEC</span>
                  <button
                    onClick={() => onNavigate('studio')}
                    className="text-glacial-cyan hover:text-sky-600 font-semibold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    Reconstruct Your Landscape <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plate 2: Vertical Telemetry Card */}
            <div className="md:col-span-4 frost-glass-card rounded-3xl overflow-hidden flex flex-col group border border-white/80 hover:shadow-[0_24px_50px_rgba(2,132,199,0.14)] transition-all duration-300">
              <div className="relative aspect-square overflow-hidden rounded-t-3xl bg-slate-100">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="Ancient British Isles during the Mesolithic era with oak and birch forest"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFSKR9M10Hn1bHK7dmO0MBEcABIEpcBr1q_FM2SBunNX_otR2ivKPO8nj_HoKK32KcrRBPrvXb_SrHSVDSmhuTeySr8dYRZ7-4z1a1T3iXCZNj8X78_uCRQA-rWRIoX1RPyyQCwWLd4KKfqLs6kJsYvyjeubX2wi0KWj2h4FfyAskvkkHXjrvT1zBoQ31Si_ZR9Ikx09s5k7JhDEHtIy-43QcB9HD3tj9MF4JZD9F9vvrUESCqs-qR9A"
                />
                <div className="absolute top-4 left-4 frost-glass px-4 py-2 rounded-full text-xs font-code-telemetry text-polar-navy font-semibold border border-white shadow-md">
                  PLATE NO. 042 // MESOLITHIC HIGHLANDS
                </div>
              </div>
              <div className="p-8 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-code-telemetry text-frost-slate mb-2">
                    <span>DATUM: -9,500 BP</span>
                  </div>
                  <h3 className="text-xl font-headline-sm text-polar-navy mb-2 font-semibold">
                    The Atlantic Rainforest Canopy
                  </h3>
                  <p className="text-sm font-body-muted text-frost-slate leading-relaxed">
                    Regenerated from present-day sheep pastures in the Scottish borders, restoring dense moss-draped sessile oak and wild hazelwood.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-sky-100 flex items-center justify-between text-xs font-code-telemetry text-frost-slate">
                  <span>CONFIDENCE: 99.1%</span>
                  <button
                    onClick={() => onNavigate('studio')}
                    className="text-glacial-cyan font-semibold hover:underline cursor-pointer"
                  >
                    Open Studio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SOVEREIGN OPEN SCIENCE / CLI CONSOLE ================= */}
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-12 relative border-b border-sky-100/70">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="text-xs font-label-caps text-glacial-cyan uppercase tracking-widest font-semibold mb-2">
                Sovereign Execution
              </div>
              <h2 className="text-3xl md:text-4xl font-headline-lg text-polar-navy tracking-tight mb-4 leading-tight font-semibold">
                Run Locally. No Data Leaves Your Field Kit.
              </h2>
              <p className="text-frost-slate mb-6 leading-relaxed text-sm sm:text-base">
                Designed for geological surveyors, naturalists, and documentary filmmakers in remote locations. TimeLens weights can be compiled to quantized GGUF format and executed on offline laptops without internet connectivity.
              </p>
              <ul className="space-y-3 font-body-muted text-sm text-polar-navy mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full frost-glass flex items-center justify-center text-glacial-cyan shadow-sm">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  </div>
                  <span>Fully air-gapped field mode supported</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full frost-glass flex items-center justify-center text-glacial-cyan shadow-sm">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  </div>
                  <span>Hardware acceleration via Apple Silicon Metal & CUDA</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full frost-glass flex items-center justify-center text-glacial-cyan shadow-sm">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  </div>
                  <span>Raw EXIF preservation with georeferenced metadata outputs</span>
                </li>
              </ul>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('studio')}
                  className="bg-gradient-to-r from-glacial-cyan to-sky-500 text-white font-semibold text-xs font-label-caps px-7 py-3.5 rounded-full hover:shadow-[0_8px_25px_rgba(2,132,199,0.3)] transition-all uppercase tracking-widest shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  Launch Web Studio
                </button>
              </div>
            </div>

            {/* Code / Telemetry Terminal Box */}
            <div className="lg:col-span-7 frost-glass-card rounded-3xl overflow-hidden border border-white/90 shadow-[0_20px_50px_rgba(2,132,199,0.12)]">
              <div className="bg-white/70 border-b border-sky-100/80 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-code-telemetry text-frost-slate font-medium">terminal — timelens-cli v2.4.1</span>
                </div>
                <span className="text-xs font-code-telemetry text-glacial-cyan font-semibold bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                  STATUS: READY
                </span>
              </div>
              <div className="p-6 sm:p-8 font-code-telemetry text-xs sm:text-sm leading-relaxed text-polar-navy space-y-3 bg-white/40">
                <p className="text-frost-slate"># Initialize local geomorphic diffusion pipeline</p>
                <p className="text-polar-navy font-semibold">
                  <span className="text-glacial-cyan font-bold">$</span> timelens pull weights/geomorphic-v2-7b-q8.bin
                </p>
                <p className="text-frost-slate">[INFO] Verified sha256 checksum: 9c34f8a... (7.42 GB)</p>
                <p className="text-polar-navy font-semibold">
                  <span className="text-glacial-cyan font-bold">$</span> timelens reconstruct \
                </p>
                <p className="pl-4 text-frost-slate">--input ./field-scans/dolomites-contemporary.raw \</p>
                <p className="pl-4 text-frost-slate">--target-epoch &quot;Late Triassic (-220M BP)&quot; \</p>
                <p className="pl-4 text-frost-slate">--botanical-priors &quot;Thetys_Tethyan_Carbonate_Shelf&quot; \</p>
                <p className="pl-4 text-frost-slate">--render-video --fps 24 --duration 12s --output-res 4k</p>
                <div className="pt-3 text-glacial-cyan flex items-center gap-2 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-glacial-cyan animate-pulse" />
                  <span>[SYNTHESIS COMPLETE] Output stored to ./renders/dolomites_triassic_4k.mov</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NATURALIST INVITATION CALLOUT ================= */}
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-12 relative text-center">
        <div className="max-w-4xl mx-auto frost-glass-card rounded-3xl p-8 sm:p-10 md:p-16 border border-white/90 shadow-[0_20px_60px_rgba(2,132,199,0.12)]">
          <div className="w-16 h-16 rounded-full frost-glass mx-auto flex items-center justify-center text-glacial-cyan mb-6 shadow-sm border border-white">
            <span className="material-symbols-outlined text-3xl">travel_explore</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline-lg text-polar-navy mb-4 tracking-tight leading-tight font-semibold">
            Unearth the Primeval World from Any Vantage
          </h2>
          <p className="text-base sm:text-lg font-body-lead text-frost-slate mb-8 max-w-2xl mx-auto leading-relaxed">
            Join natural history curators, landscape ecologists, and cinematic storytellers recreating vanished worlds with scientific reverence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('studio')}
              className="w-full sm:w-auto bg-gradient-to-r from-glacial-cyan to-sky-500 text-white font-semibold text-xs font-label-caps px-8 py-4 rounded-full hover:shadow-[0_8px_25px_rgba(2,132,199,0.35)] transition-all uppercase tracking-widest shadow-md shadow-sky-500/20 cursor-pointer"
            >
              Launch TimeLens Studio
            </motion.button>
            <button
              onClick={() => onNavigate('era')}
              className="w-full sm:w-auto frost-glass hover:bg-white text-polar-navy hover:border-glacial-cyan text-xs font-label-caps px-8 py-4 rounded-full transition-all uppercase tracking-widest border border-white/80 shadow-sm font-medium cursor-pointer"
            >
              Explore Geological Epochs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
