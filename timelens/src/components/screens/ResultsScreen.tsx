import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { SAMPLE_MODERN_IMAGE, SAMPLE_RECONSTRUCTION_IMAGE } from '../../data/eras';
import type { ScreenId, UserJourneyState } from '../../types';

interface ResultsScreenProps {
  journeyState: UserJourneyState;
  onUpdateJourney: (updates: Partial<UserJourneyState>) => void;
  onNavigate: (screen: ScreenId) => void;
  onStartNewJourney: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  journeyState,
  onUpdateJourney,
  onNavigate,
  onStartNewJourney,
}) => {
  const [viewportMode, setViewportMode] = useState<'compare' | 'video'>('compare');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(4.2);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '0.5x'>('1x');
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const stageRef = useRef<HTMLDivElement>(null);

  const hasTriggeredRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Simulated generation progress simulation when entering Results
  useEffect(() => {
    if (journeyState.generationStatus === 'idle' && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onUpdateJourney({
        generationStatus: 'processing',
        generationProgress: 20,
      });

      const isTestEnv = import.meta.env.MODE === 'test';
      const delay1 = isTestEnv ? 30 : 700;
      const delay2 = isTestEnv ? 60 : 1500;

      const timer1 = setTimeout(() => {
        onUpdateJourney({ generationProgress: 65 });
      }, delay1);

      const timer2 = setTimeout(() => {
        onUpdateJourney({
          generationStatus: 'completed',
          generationProgress: 100,
        });
      }, delay2);

      timersRef.current.push(timer1, timer2);
    }
  }, [journeyState.generationStatus, onUpdateJourney]);

  // Video playback time simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && viewportMode === 'video') {
      const step = playbackSpeed === '1x' ? 0.2 : 0.1;
      interval = setInterval(() => {
        setPlaybackTime((prev) => (prev >= 10.0 ? 0.0 : Number((prev + step).toFixed(1))));
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, viewportMode, playbackSpeed]);

  const handleSliderMove = (clientX: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0.05, Math.min(0.95, pos));
    setSliderPos(clamped * 100);
  };

  const handleCopyLatent = () => {
    const jsonStr = journeyState.generationResult?.promptLatentJson || JSON.stringify(
      {
        epoch: 'Pleistocene (LGM -18ka)',
        location: journeyState.location || 'Olympic Peninsula, WA',
        paleo_params: {
          cfg_scale: 7.5,
          denoise: 0.88,
          svd_fps: 24,
          motion_bucket_id: 127,
        },
        weights_hash: 'sha256:d8c07f43b91a729e083c9284...',
      },
      null,
      2
    );

    navigator.clipboard?.writeText(jsonStr);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRetry = () => {
    onUpdateJourney({
      generationStatus: 'processing',
      generationProgress: 10,
      generationError: null,
    });

    setTimeout(() => {
      onUpdateJourney({
        generationStatus: 'completed',
        generationProgress: 100,
      });
    }, 1200);
  };

  const triggerSimulatedFailure = () => {
    onUpdateJourney({
      generationStatus: 'failed',
      generationError: 'Simulated Latent VAE tensor mismatch. Pipeline caught a simulated anomaly.',
    });
  };

  const modernImageSrc = journeyState.landscapePreviewUrl || SAMPLE_MODERN_IMAGE;
  const reconstructedImageSrc = journeyState.generationResult?.reconstructedImageUrl || SAMPLE_RECONSTRUCTION_IMAGE;

  // Format time mm:ss.s
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    const padS = s.length < 4 ? `0${s}` : s;
    return `0${m}:${padS}`;
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col gap-6">
        {/* Screen Narrative Breadcrumb & Title Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-sky-100/80 pb-4 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cool-slate flex-wrap">
              <span className="material-symbols-outlined text-sm text-glacial-cyan">explore</span>
              <span>PACIFIC NORTHWEST ARCHIVES</span>
              <span className="text-sky-200">/</span>
              <span>{journeyState.locationCoordinates || 'LAT 47.8601° N, LON 123.9348° W'}</span>
              <span className="text-sky-200">/</span>
              <span className="text-glacial-cyan font-semibold">EXPEDITION RUN #0884</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-headline-md font-semibold text-polar-slate tracking-tight">
              {journeyState.location || 'Olympic Hoh Forest'}{' '}
              <span className="text-cool-slate italic font-normal">Transformed to</span>{' '}
              Pleistocene Glacial Epoch ({journeyState.customYear || '18,000 BCE'})
            </h1>
          </div>

          {/* Traveler Integration & Mode Badges */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {journeyState.includeTraveler && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-white/90 text-xs font-semibold text-sky-800 shadow-[0_2px_12px_rgba(2,132,199,0.08)]">
                <span className="w-2 h-2 rounded-full bg-glacial-cyan animate-pulse ring-2 ring-sky-200" />
                <span>Traveler Silhouetted against Moraine (Selfie Blend applied)</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-white/90 text-xs font-semibold text-cool-slate shadow-sm">
              <span className="material-symbols-outlined text-sm text-glacial-cyan">science</span>
              <span>
                {journeyState.reconstructionMode === 'reconstruct'
                  ? 'Botanical Stratum Reconstruction'
                  : 'Imaginative Paleo-Scenario'}
              </span>
            </div>
          </div>
        </div>

        {/* Demo Simulation Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-frost-slate">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-glacial-cyan">info</span>
            <span>
              <strong>Simulated Demonstration Mode: </strong>
              Visualizing sample output generated from open-weight paleobotanical parameters. Not verified archaeological evidence.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={triggerSimulatedFailure}
              className="text-[11px] font-mono text-red-600 hover:underline px-2 py-0.5 rounded cursor-pointer"
              title="Test simulated error state to verify retry flow"
              type="button"
            >
              Simulate Failure State
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {journeyState.generationStatus === 'processing' && (
          <div
            role="status"
            className="w-full frost-glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center my-8 shadow-lg"
          >
            <div className="w-16 h-16 rounded-full border-4 border-sky-200 border-t-glacial-cyan animate-spin mb-4" />
            <h3 className="text-xl font-headline font-bold text-polar-navy mb-2">
              Synthesizing Geological Stratigraphy...
            </h3>
            <p className="text-sm text-frost-slate max-w-md mb-6 leading-relaxed">
              Applying latent diffusion with quaternary botanical priors, permafrost cryosol mappings, and glacial silt dispersal.
            </p>
            <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-glacial-cyan to-sky-400 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${journeyState.generationProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-glacial-cyan font-semibold">
              PROGRESS: {journeyState.generationProgress}% • SVD INFERENCE
            </span>
          </div>
        )}

        {/* FAILED STATE */}
        {journeyState.generationStatus === 'failed' && (
          <div
            role="alert"
            className="w-full bg-rose-50/80 border border-rose-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center my-6 shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <span className="material-symbols-outlined text-3xl">error_outline</span>
            </div>
            <h3 className="text-xl font-headline font-bold text-rose-950 mb-2">
              Synthesis Interrupted
            </h3>
            <p className="text-sm text-rose-700 max-w-md mb-6 leading-relaxed">
              {journeyState.generationError ||
                'The latent diffusion pipeline encountered a memory constraint. You can retry synthesis or calibrate input parameters.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-headline font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                type="button"
              >
                Retry Synthesis
              </button>
              <button
                onClick={() => onNavigate('era')}
                className="px-6 py-2.5 bg-white border border-rose-300 text-rose-900 rounded-full font-headline font-semibold text-xs uppercase tracking-wider hover:bg-rose-50 cursor-pointer"
                type="button"
              >
                Tweak Era Parameters
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED STATE / MAIN BENTO LAYOUT */}
        {journeyState.generationStatus !== 'processing' && journeyState.generationStatus !== 'failed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT / TOP (8-col): Primary Cinematic Stage & Viewport Controls */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Stage Header: Viewport Mode Switcher & Telemetry Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white/75 backdrop-blur-xl border border-white/80 px-4 py-2.5 rounded-3xl shadow-[0_8px_30px_rgba(2,132,199,0.06)]">
                <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-sky-100">
                  <button
                    id="tab-compare"
                    onClick={() => {
                      setViewportMode('compare');
                      setIsPlaying(false);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewportMode === 'compare'
                        ? 'bg-white text-glacial-cyan shadow-sm font-bold'
                        : 'text-cool-slate hover:text-polar-slate'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm text-glacial-cyan">compare</span>
                    <span>Interactive Comparison</span>
                  </button>
                  <button
                    id="tab-video"
                    onClick={() => setViewportMode('video')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewportMode === 'video'
                        ? 'bg-white text-glacial-cyan shadow-sm font-bold'
                        : 'text-cool-slate hover:text-polar-slate'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">movie</span>
                    <span>Animate 4K Video Reel</span>
                  </button>
                </div>

                {/* Real-Time Inference Tag */}
                <div className="flex items-center gap-2 text-xs font-code-telemetry text-cool-slate pr-2">
                  <span className="material-symbols-outlined text-glacial-cyan text-sm">timer</span>
                  <span>
                    Synthesized in <strong className="text-polar-slate font-semibold">14.2s</strong> on H100 SXM5
                  </span>
                  <span className="text-sky-200">•</span>
                  <span className="text-glacial-cyan font-semibold">Seed: 914088219</span>
                </div>
              </div>

              {/* The 16:9 Cinematic Viewport Stage */}
              <div
                ref={stageRef}
                id="viewport-stage"
                onMouseMove={(e) => {
                  if (isDragging && viewportMode === 'compare') {
                    handleSliderMove(e.clientX);
                  }
                }}
                onMouseUp={() => setIsDragging(false)}
                onTouchMove={(e) => {
                  if (isDragging && e.touches[0] && viewportMode === 'compare') {
                    handleSliderMove(e.touches[0].clientX);
                  }
                }}
                onTouchEnd={() => setIsDragging(false)}
                className="relative w-full aspect-[16/9] bg-slate-900 rounded-3xl overflow-hidden border-2 border-white/90 shadow-[0_16px_40px_rgba(2,132,199,0.12)] select-none group"
              >
                {/* Optical Reticle Corners */}
                <div className="hud-bracket-tl" />
                <div className="hud-bracket-tr" />
                <div className="hud-bracket-bl" />
                <div className="hud-bracket-br" />

                {/* Top Viewfinder HUD */}
                <div className="absolute top-4 left-6 right-6 z-20 flex justify-between items-center pointer-events-none text-xs font-code-telemetry text-slate-100 tracking-wider drop-shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-glacial-sky font-semibold">
                      REC ● 4K 23.98 FPS
                    </span>
                    <span className="hidden sm:inline bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-slate-300">
                      FOVI: 35mm f/1.8
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-slate-300">
                      LATENT DEPTH: 1024×576 → 3840×2160
                    </span>
                    <span className="bg-cyan-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-400/50 text-cyan-200 font-semibold">
                      18,000 BCE ±120y
                    </span>
                  </div>
                </div>

                {/* Base Layer: Reconstructed Epoch Image */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <img
                    id="pleistocene-img"
                    src={reconstructedImageSrc}
                    alt="Reconstructed Pleistocene landscape"
                    className="w-full h-full object-cover"
                  />

                  {/* Silhouetted Traveler Overlay (if opted-in) */}
                  {journeyState.includeTraveler && (
                    <div className="absolute bottom-12 right-20 pointer-events-none flex flex-col items-center opacity-90">
                      <div className="w-12 h-28 border border-white/50 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md shadow-lg">
                        <span className="material-symbols-outlined text-white text-2xl">accessibility_new</span>
                      </div>
                      <span className="text-[10px] font-code-telemetry text-cyan-200 tracking-wider uppercase mt-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                        Traveler Anchor
                      </span>
                    </div>
                  )}
                </div>

                {/* Layer 2: Modern Reference Image (Clipped via Slider width in compare mode) */}
                {viewportMode === 'compare' && (
                  <>
                    <div
                      id="split-layer-modern"
                      style={{ width: `${sliderPos}%` }}
                      className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-[0_0_25px_rgba(2,132,199,0.35)] z-10 transition-[width] duration-75"
                    >
                      <div className="absolute inset-0 w-[100vw] max-w-[1200px] h-full">
                        <img
                          src={modernImageSrc}
                          alt="Modern landscape reference"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Modern Epoch Tag */}
                      <div className="absolute bottom-4 left-6 z-20 bg-white/85 backdrop-blur-md border border-white/90 px-3 py-1.5 rounded-2xl shadow-lg">
                        <p className="text-xs font-semibold text-polar-slate uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Modern 2025 Baseline</span>
                        </p>
                        <p className="text-[11px] font-code-telemetry text-cool-slate">
                          Temperate Rainforest • +11.4°C
                        </p>
                      </div>
                    </div>

                    {/* Reconstructed Epoch Tag (Right Side) */}
                    <div className="absolute bottom-4 right-6 z-10 bg-white/85 backdrop-blur-md border border-white/90 px-3 py-1.5 rounded-2xl shadow-lg pointer-events-none">
                      <p className="text-xs font-semibold text-glacial-cyan uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-glacial-cyan" />
                        <span>Pleistocene Glacial Epoch</span>
                      </p>
                      <p className="text-[11px] font-code-telemetry text-cool-slate">
                        Periglacial Tundra • -6.2°C
                      </p>
                    </div>

                    {/* Draggable Handle */}
                    <div
                      id="split-handle"
                      style={{ left: `${sliderPos}%` }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onTouchStart={() => setIsDragging(true)}
                      className="absolute top-0 bottom-0 -ml-3 w-6 z-30 cursor-ew-resize flex items-center justify-center pointer-events-auto"
                    >
                      <div className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border-2 border-glacial-cyan flex items-center justify-center shadow-[0_4px_16px_rgba(2,132,199,0.4)] text-glacial-cyan group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-base">drag_handle</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Video Playback Center Floating Play Button (Visible in Video Mode) */}
                {viewportMode === 'video' && (
                  <div
                    id="center-play-button"
                    className="absolute inset-0 z-20 flex items-center justify-center bg-sky-950/20 backdrop-blur-xs"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-glacial-cyan to-glacial-sky text-white flex items-center justify-center shadow-[0_8px_25px_rgba(2,132,199,0.45)] ring-4 ring-white/60 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-3xl">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Cinematic Video Transport Bar & Archival Scrub Controls */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl p-4 shadow-[0_8px_30px_rgba(2,132,199,0.06)] flex flex-col gap-3">
                {/* Top Row: Drone Flight Scrubber Axis */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-code-telemetry font-semibold text-cool-slate tabular-nums w-14">
                    {formatTime(playbackTime)}
                  </span>
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      setPlaybackTime(Number((ratio * 10).toFixed(1)));
                    }}
                    className="relative flex-1 h-5 flex items-center cursor-pointer group"
                  >
                    <div className="w-full h-2 bg-slate-200/80 rounded-full relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-glacial-cyan to-glacial-sky rounded-full transition-all duration-75"
                        style={{ width: `${(playbackTime / 10) * 100}%` }}
                      />
                    </div>
                    {/* Tick marks */}
                    <div className="absolute inset-x-0 h-full flex justify-between items-center pointer-events-none px-2">
                      <span className="h-2 w-0.5 bg-slate-300 rounded-full" />
                      <span className="h-1.5 w-0.5 bg-slate-300 rounded-full" />
                      <span className="h-3 w-1 bg-glacial-cyan rounded-full ring-2 ring-white" title="Keyframe A" />
                      <span className="h-1.5 w-0.5 bg-slate-300 rounded-full" />
                      <span className="h-3 w-1 bg-glacial-cyan rounded-full ring-2 ring-white" title="Keyframe B" />
                      <span className="h-1.5 w-0.5 bg-slate-300 rounded-full" />
                      <span className="h-2 w-0.5 bg-slate-300 rounded-full" />
                    </div>
                    {/* Playhead */}
                    <div
                      style={{ left: `${(playbackTime / 10) * 100}%` }}
                      className="absolute -ml-2.5 w-5 h-5 bg-white border-2 border-glacial-cyan rounded-full shadow-[0_2px_8px_rgba(2,132,199,0.35)] group-hover:scale-125 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-code-telemetry font-semibold text-cool-slate tabular-nums w-14 text-right">
                    00:10.0
                  </span>
                </div>

                {/* Bottom Row: Documentary Transport Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-sky-100/80">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-9 h-9 rounded-full bg-gradient-to-tr from-glacial-cyan to-glacial-sky text-white hover:shadow-[0_4px_12px_rgba(2,132,199,0.3)] flex items-center justify-center transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <button
                      onClick={() => setPlaybackTime(0)}
                      className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-cool-slate hover:text-glacial-cyan flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      title="Rewind to In-Point"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">replay_10</span>
                    </button>
                    <div className="h-4 w-px bg-slate-200 mx-1" />
                    <span className="text-xs font-code-telemetry text-cool-slate hidden sm:inline">
                      Reel Path: <strong className="text-polar-slate font-medium">Low-Altitude Drone Drift (10s Tracking)</strong>
                    </span>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2.5">
                    {/* Playback Speed Chip */}
                    <div className="flex items-center bg-slate-100/90 border border-sky-100 rounded-full p-0.5 text-xs font-code-telemetry">
                      <button
                        onClick={() => setPlaybackSpeed('1x')}
                        className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                          playbackSpeed === '1x'
                            ? 'bg-white text-glacial-cyan font-semibold shadow-sm'
                            : 'text-cool-slate'
                        }`}
                        type="button"
                      >
                        1x
                      </button>
                      <button
                        onClick={() => setPlaybackSpeed('0.5x')}
                        className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                          playbackSpeed === '0.5x'
                            ? 'bg-white text-glacial-cyan font-semibold shadow-sm'
                            : 'text-cool-slate'
                        }`}
                        type="button"
                      >
                        0.5x Archival
                      </button>
                    </div>

                    {/* Atmospheric Audio Toggle */}
                    <button
                      onClick={() => setIsAudioOn(!isAudioOn)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-100 bg-white/80 text-cool-slate hover:text-glacial-cyan transition-all text-xs font-semibold shadow-sm cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base text-glacial-cyan">
                        {isAudioOn ? 'volume_up' : 'volume_off'}
                      </span>
                      <span className="hidden md:inline">
                        {isAudioOn ? 'Ambient Pleistocene Wind' : 'Muted'}
                      </span>
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      onClick={() => {
                        if (stageRef.current?.requestFullscreen) {
                          stageRef.current.requestFullscreen();
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-cool-slate hover:text-glacial-cyan flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      title="Toggle Fullscreen"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">fullscreen</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Synthesis Status Badge Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl text-xs font-code-telemetry shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-glacial-cyan text-base">verified</span>
                  <span className="text-polar-slate font-semibold">Reconstruction Complete:</span>
                  <span className="text-cool-slate">SVD Temporal Diffusion 4K (Open Weights)</span>
                </div>
                <div className="text-cool-slate flex items-center gap-3">
                  <span>Latent VAE: SDXL-Refined</span>
                  <span className="text-sky-200">|</span>
                  <span className="text-glacial-cyan font-semibold">Tolerance Error: ±0.42%</span>
                </div>
              </div>
            </div>

            {/* RIGHT / BOTTOM (4-col): Field Notes, Paleoclimate Telemetry & Actions */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Panel 1: Field Notes & Telemetry */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-[0_8px_30px_rgba(2,132,199,0.06)] flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
                  <h2 className="text-base font-headline font-semibold text-polar-slate flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-glacial-cyan">
                      <span className="material-symbols-outlined text-base">biotech</span>
                    </div>
                    <span>Field Notes & Telemetry</span>
                  </h2>
                  <span className="text-xs font-semibold text-glacial-cyan bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100 uppercase tracking-wider">
                    Epoch 18k BCE
                  </span>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-sky-50/60 p-3.5 rounded-2xl border border-white/80 shadow-xs">
                    <span className="text-[11px] font-code-telemetry text-cool-slate block font-semibold">
                      MEAN ANNUAL TEMP
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-headline font-bold text-glacial-cyan">-6.2°C</span>
                      <span className="text-[11px] text-cool-slate">(-17.6°C)</span>
                    </div>
                    <span className="text-[10px] text-cool-slate mt-1 block">Late Wisconsinan Glaciation</span>
                  </div>

                  <div className="bg-sky-50/60 p-3.5 rounded-2xl border border-white/80 shadow-xs">
                    <span className="text-[11px] font-code-telemetry text-cool-slate block font-semibold">
                      CORDILLERAN ICE MARGIN
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-headline font-bold text-polar-slate">14.8 km</span>
                      <span className="text-[11px] font-semibold text-glacial-sky">Advancing</span>
                    </div>
                    <span className="text-[10px] text-cool-slate mt-1 block">Hoh Glacier lobe terminus</span>
                  </div>

                  <div className="col-span-2 bg-sky-50/60 p-3.5 rounded-2xl border border-white/80 shadow-xs">
                    <span className="text-[11px] font-code-telemetry text-cool-slate block font-semibold">
                      PALEOBOTANICAL SYNTHESIS
                    </span>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Subalpine fir (<em className="text-polar-slate font-medium">Abies lasiocarpa</em>) & Tundra lichen dominance. Dense spruce canopy completely stripped to open steppe-tundra gravel flats.
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-sky-200/50 text-[11px] text-cool-slate">
                      <span className="material-symbols-outlined text-glacial-cyan text-sm">water</span>
                      <span>Glacial runoff dynamics: High-velocity periglacial braided streams</span>
                    </div>
                  </div>
                </div>

                {/* Prompt Latent Seed Inspector */}
                <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-glacial-cyan uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">terminal</span>
                      <span>Prompt Latent Seed</span>
                    </span>
                    <button
                      onClick={handleCopyLatent}
                      className="text-xs font-code-telemetry text-cool-slate hover:text-glacial-cyan transition-colors flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-sky-100 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      <span>{isCopied ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-code-telemetry overflow-x-auto whitespace-pre-wrap leading-tight bg-slate-900 text-sky-200 p-3 rounded-xl border border-slate-800 text-left max-h-32">
{`"epoch": "Pleistocene (LGM -18ka)",
"location": "Olympic Peninsula, WA",
"paleo_params": {
  "cfg_scale": 7.5,
  "denoise": 0.88,
  "svd_fps": 24,
  "motion_bucket_id": 127
},
"weights_hash": "sha256:d8c07f43b91..."`}
                  </pre>
                </div>
              </div>

              {/* Panel 2: Archival Export Suite */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-[0_8px_30px_rgba(2,132,199,0.06)] flex flex-col gap-2.5">
                <h3 className="text-xs font-semibold text-cool-slate uppercase tracking-wider mb-0.5">
                  Archival Export Suite
                </h3>

                <button
                  onClick={() => alert('Downloading 4K ProRes Video Master (Simulated 240MB package)...')}
                  className="w-full bg-gradient-to-r from-glacial-cyan to-glacial-sky hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-between text-xs shadow-[0_4px_16px_rgba(2,132,199,0.25)] cursor-pointer"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>Export 4K Master Video</span>
                  </span>
                  <span className="text-[11px] opacity-90 font-code-telemetry font-normal">
                    ProRes / MP4 (240 MB)
                  </span>
                </button>

                <button
                  onClick={() => alert('Downloading High-Resolution 16-bit PNG comparison plate...')}
                  className="w-full bg-white hover:bg-sky-50 border border-sky-100 hover:border-glacial-cyan text-polar-slate py-2.5 px-4 rounded-full transition-all flex items-center justify-between text-xs shadow-xs cursor-pointer"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-glacial-cyan">photo</span>
                    <span className="font-medium">Download Comparison Plate</span>
                  </span>
                  <span className="text-[11px] text-cool-slate font-code-telemetry">Raw 16-bit PNG</span>
                </button>

                <button
                  onClick={() => onNavigate('era')}
                  className="w-full bg-transparent hover:bg-sky-100/60 border border-slate-200 text-cool-slate hover:text-glacial-cyan py-2 px-4 rounded-full transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider mt-1 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  <span>Re-run with Alternate Climate Scenario</span>
                </button>

                <button
                  onClick={onStartNewJourney}
                  className="w-full bg-white/70 hover:bg-white border border-sky-200 text-sky-800 py-2 px-4 rounded-full transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                  <span>Start Another Journey (New Plate)</span>
                </button>
              </div>

              {/* Panel 3: Related Geological Epoch Iterations */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-[0_8px_30px_rgba(2,132,199,0.06)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cool-slate uppercase tracking-wider">
                    Other Epochs for this Coordinate
                  </span>
                  <button
                    onClick={() => onNavigate('era')}
                    className="text-xs font-semibold text-glacial-cyan hover:underline cursor-pointer"
                  >
                    Explore all
                  </button>
                </div>
                <div className="space-y-2 mt-1">
                  <button
                    onClick={() => onNavigate('era')}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-2xl bg-white/80 border border-sky-100 hover:border-glacial-cyan hover:shadow-sm transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-xs font-semibold text-polar-slate group-hover:text-glacial-cyan transition-colors">
                          Early Eocene Subtropical (50 Mya)
                        </p>
                        <p className="text-[11px] text-cool-slate">Palm fronds, crocodylomorph swamp basin</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-cool-slate text-sm group-hover:translate-x-1 group-hover:text-glacial-cyan transition-all">
                      arrow_forward
                    </span>
                  </button>

                  <button
                    onClick={() => onNavigate('era')}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-2xl bg-white/80 border border-sky-100 hover:border-glacial-cyan hover:shadow-sm transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold text-polar-slate group-hover:text-glacial-cyan transition-colors">
                          Carboniferous Giant Ferns (310 Mya)
                        </p>
                        <p className="text-[11px] text-cool-slate">Hyper-oxygenated lycopsid canopy</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-cool-slate text-sm group-hover:translate-x-1 group-hover:text-glacial-cyan transition-all">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
