import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { SAMPLE_LANDSCAPE_IMAGE, SAMPLE_SELFIE_IMAGE } from '../../data/eras';
import type { AttireMode, ScreenId, UserJourneyState } from '../../types';

interface StudioScreenProps {
  journeyState: UserJourneyState;
  onUpdateJourney: (updates: Partial<UserJourneyState>) => void;
  onNavigate: (screen: ScreenId) => void;
  onReset: () => void;
}

const MAX_FILE_SIZE_BYTES = 64 * 1024 * 1024; // 64 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];

export const StudioScreen: React.FC<StudioScreenProps> = ({
  journeyState,
  onUpdateJourney,
  onNavigate,
  onReset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [landscapeError, setLandscapeError] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const landscapeInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleLandscapeFile = (file: File) => {
    setLandscapeError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLandscapeError('Invalid file format. Please upload a TIFF, RAW, PNG, or JPEG image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLandscapeError('File size exceeds the 64MB threshold for uncompressed field scans.');
      return;
    }

    // Revoke old object URL if needed
    if (journeyState.landscapePreviewUrl && journeyState.landscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(journeyState.landscapePreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    onUpdateJourney({
      landscapeFile: file,
      landscapePreviewUrl: objectUrl,
      landscapeFileName: file.name,
    });
  };

  const handleSelfieFile = (file: File) => {
    setSelfieError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSelfieError('Invalid image format for portrait. Please use JPEG or PNG.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSelfieError('Portrait size exceeds 20MB.');
      return;
    }

    if (journeyState.selfiePreviewUrl && journeyState.selfiePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(journeyState.selfiePreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    onUpdateJourney({
      selfieFile: file,
      selfiePreviewUrl: objectUrl,
      includeTraveler: true,
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLandscapeFile(e.dataTransfer.files[0]);
    }
  };

  const loadSampleRedwood = () => {
    setLandscapeError(null);
    onUpdateJourney({
      landscapeFile: null,
      landscapePreviewUrl: SAMPLE_LANDSCAPE_IMAGE,
      landscapeFileName: 'sample_redwood_grove_pnw.tiff',
      location: 'Olympic National Park, Hoh Rain Forest, WA',
      locationCoordinates: '47.51° N, 123.82° W',
    });
  };

  const loadSampleSelfie = () => {
    setSelfieError(null);
    onUpdateJourney({
      selfieFile: null,
      selfiePreviewUrl: SAMPLE_SELFIE_IMAGE,
      includeTraveler: true,
    });
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your current browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Querying field GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        const coords = `${lat}° N, ${lon}° W`;
        onUpdateJourney({
          locationCoordinates: coords,
          location: `Field Scan Anchor (${coords})`,
        });
        setLocationStatus(`Locked GPS coordinates: ${coords}`);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(`Location permission not granted (${err.message}). Using manual context.`);
      },
      { timeout: 8000 }
    );
  };

  const isFormValid = Boolean(journeyState.landscapePreviewUrl);

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      {/* Soft Glacial Ambient Halos */}
      <div className="fixed top-[-10vw] left-[-5vw] w-[45vw] h-[45vw] rounded-full bg-sky-200/40 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10vw] right-[-5vw] w-[50vw] h-[50vw] rounded-full bg-cyan-100/50 blur-[140px] pointer-events-none -z-10" />

      {/* Main Studio Canvas */}
      <main className="flex-1 w-full px-4 sm:px-6 md:px-12 py-8 max-w-7xl mx-auto flex flex-col gap-8">
        {/* Viewport Heading Narrative */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-sky-200/50 pb-6 gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-headline font-semibold text-sky-600 tracking-widest uppercase block mb-1">
              Ground-Glass Calibration
            </span>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-polar-navy tracking-tight">
              Plate Registration & Context
            </h1>
            <p className="text-sm text-cool-slate mt-2 leading-relaxed">
              Position a contemporary terrestrial landscape plate. The latent diffusion model decomposes contemporary foliage, soil composition, and horizon gradients to reconstruct geological pasts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadSampleRedwood}
              className="px-5 py-2.5 rounded-full bg-white/80 hover:bg-white border border-sky-200/80 hover:border-sky-400 text-xs font-headline font-semibold text-polar-navy shadow-[0_2px_12px_rgba(2,132,199,0.06)] transition-all flex items-center gap-2 group cursor-pointer"
              id="btn-sample-redwood"
              type="button"
            >
              <span className="material-symbols-outlined text-base text-sky-600 group-hover:rotate-12 transition-transform">
                nature
              </span>
              <span>Load Sample Redwood Grove</span>
            </button>
          </div>
        </div>

        {/* PRIMARY INTERFACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: PRIMARY OPTICAL GROUND-GLASS DROP ZONE (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Large Ground Glass Frame */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_12px_36px_rgba(15,30,49,0.06),0_1px_3px_rgba(2,132,199,0.08)] rounded-3xl p-4 sm:p-6 group transition-all duration-300 ring-1 ${
                isDragging ? 'ring-2 ring-sky-500 bg-sky-50/60' : 'ring-sky-200/40'
              }`}
            >
              {/* Optical Reticle Bracket Corners */}
              <div className="hud-bracket-tl" />
              <div className="hud-bracket-tr" />
              <div className="hud-bracket-bl" />
              <div className="hud-bracket-br" />

              {/* Central Crosshair Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity">
                <div className="w-14 h-px bg-white" />
                <div className="h-14 w-px bg-white absolute" />
                <div className="w-10 h-10 rounded-full border border-white/80 absolute" />
              </div>

              {/* 16:9 Cinematic Aperture Container */}
              <div className="relative aspect-[16/9] w-full bg-slate-100 rounded-2xl border border-white/60 overflow-hidden flex flex-col justify-between shadow-inner">
                {journeyState.landscapePreviewUrl ? (
                  <>
                    <img
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      alt="Source landscape preview"
                      id="source-preview-image"
                      src={journeyState.landscapePreviewUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/30 pointer-events-none" />

                    {/* Top Viewfinder Header HUD */}
                    <div className="relative z-10 flex items-center justify-between px-3.5 py-2 font-mono text-[11px] text-white bg-slate-900/40 backdrop-blur-md rounded-b-xl mx-2 border-b border-white/20 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                        <span className="font-semibold tracking-wider">
                          PLATE: {journeyState.landscapeFileName || 'CALIBRATED_PLATE'}
                        </span>
                        <span className="text-white/40">|</span>
                        <span className="text-cyan-300 font-medium">REGISTERED</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/80">
                        <span>50mm f/2.8</span>
                        <span className="text-white/40">ISO 100</span>
                        <span>1/250s</span>
                      </div>
                    </div>

                    {/* Bottom EXIF & Telemetry Badges HUD */}
                    <div className="relative z-10 p-2.5 flex flex-wrap items-end justify-between gap-2 bg-slate-900/50 backdrop-blur-md rounded-t-xl mx-2 border-t border-white/20">
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-100">
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-[10px]">
                          GPS: {journeyState.locationCoordinates}
                        </span>
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-[10px]">
                          ELEV: 240m
                        </span>
                        <span className="px-2.5 py-1 bg-sky-500/30 backdrop-blur-sm rounded-full border border-sky-300/50 text-[10px] text-sky-200 font-semibold">
                          CANOPY BIOMASS: 92%
                        </span>
                      </div>
                      <button
                        onClick={() => landscapeInputRef.current?.click()}
                        className="font-headline font-semibold text-white/90 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">crop</span> Replace Plate
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => landscapeInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6 text-center hover:bg-sky-50/50 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full frost-glass flex items-center justify-center text-glacial-cyan mb-3 shadow-sm border border-sky-200">
                      <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                    </div>
                    <span className="font-headline font-bold text-polar-navy text-base">
                      Select or Drag Landscape Photograph
                    </span>
                    <span className="text-xs text-cool-slate mt-1 max-w-sm">
                      Click to choose high-resolution field capture or drag image file here (up to 64MB).
                    </span>
                  </div>
                )}
              </div>

              {/* Validation Error Message */}
              {landscapeError && (
                <div
                  role="alert"
                  className="mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base text-red-600">error</span>
                  <span>{landscapeError}</span>
                </div>
              )}

              {/* Drop Invitation Bar */}
              <div className="mt-4 pt-3 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <p className="text-sm font-headline font-semibold text-polar-navy">
                    Drop high-resolution landscape photograph or capture with field camera
                  </p>
                  <p className="text-xs text-cool-slate mt-0.5">
                    TIFF, RAW, PNG, or JPEG accepted up to 64MB. Uncompressed color profile maintained.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={landscapeInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="landscape-file-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLandscapeFile(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    onClick={() => landscapeInputRef.current?.click()}
                    className="px-4 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 hover:border-sky-300 text-xs font-headline font-semibold text-sky-800 rounded-full transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-sky-600">upload_file</span>
                    <span>Browse Disk</span>
                  </button>
                  <button
                    onClick={loadSampleRedwood}
                    className="p-2 rounded-full border border-sky-200/80 bg-white hover:bg-sky-50 text-cool-slate hover:text-sky-600 transition-colors shadow-sm cursor-pointer"
                    title="Load Pre-calibrated Pacific Northwest Plate"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Open-Source Privacy Reassurance Callout */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/90 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-[0_6px_20px_rgba(15,30,49,0.03)] ring-1 ring-sky-200/30">
              <div className="w-10 h-10 rounded-2xl border border-sky-200 bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-xl">shield</span>
              </div>
              <div>
                <h4 className="text-sm font-headline font-bold text-polar-navy flex items-center gap-2 flex-wrap">
                  <span>Privacy by Architecture</span>
                  <span className="px-2.5 py-0.5 text-[10px] font-mono tracking-wider uppercase rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-semibold">
                    Ephemeral Processing
                  </span>
                </h4>
                <p className="text-xs text-cool-slate mt-1 leading-relaxed">
                  Your photographs and biometric facial embeddings are processed ephemerally on open-weight weights (Llama-Vision + SVD) and never stored or used for model training. Volatile memory instances terminate upon epoch completion.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: GEODETIC PARAMETERS & TRAVELER INCLUSION (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* MODULE 1: LOCATION INPUT & GEO-TAGGING */}
            <div className="bg-white/75 backdrop-blur-xl border border-white/90 rounded-3xl p-6 shadow-[0_12px_36px_rgba(15,30,49,0.05)] ring-1 ring-sky-200/40">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-600 text-lg">distance</span>
                  <h2 className="text-xs font-headline font-bold text-polar-navy uppercase tracking-wider">
                    Geodetic Anchor
                  </h2>
                </div>
                <span className="font-mono text-cool-slate text-[11px] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  WGS 84
                </span>
              </div>

              <label className="block text-xs font-medium text-cool-slate mb-2" htmlFor="location-input">
                Geographic context for botanical and strata accuracy
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600">
                  <span className="material-symbols-outlined text-base">location_on</span>
                </div>
                <input
                  id="location-input"
                  data-testid="location-input"
                  type="text"
                  value={journeyState.location}
                  onChange={(e) => onUpdateJourney({ location: e.target.value })}
                  placeholder="e.g., Olympic National Park, Hoh Rain Forest or 47.51°N, 123.82°W"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/90 border border-sky-200/80 rounded-2xl text-polar-navy text-sm font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all placeholder-cool-slate/50 shadow-sm"
                />
                <button
                  onClick={requestBrowserLocation}
                  disabled={isLocating}
                  title="Acquire coordinates from device GPS (Explicit action only)"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-cool-slate hover:text-sky-600 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className={`material-symbols-outlined text-base ${isLocating ? 'animate-spin' : ''}`}>
                    my_location
                  </span>
                </button>
              </div>

              {locationStatus && (
                <p className="text-[11px] text-sky-700 mt-2 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>{locationStatus}</span>
                </p>
              )}

              {/* Suggested Geographic Strata Badges */}
              <div className="mt-4 pt-3 border-t border-sky-100/70 flex flex-col gap-2">
                <span className="font-mono text-cool-slate text-[10px] uppercase tracking-wider font-semibold">
                  Identified Ecological Biome:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full text-[11px] font-mono font-medium">
                    Temperate Coniferous
                  </span>
                  <span className="px-3 py-1 bg-white/90 text-cool-slate border border-slate-200 rounded-full text-[11px] font-mono font-medium">
                    Pleistocene Glacial Fluvial
                  </span>
                  <span className="px-3 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-full text-[11px] font-mono font-medium">
                    Basalt Basement
                  </span>
                </div>
              </div>
            </div>

            {/* MODULE 2: TRAVELER / FIELD RESEARCHER INCLUSION */}
            <div className="bg-white/75 backdrop-blur-xl border border-white/90 rounded-3xl p-6 shadow-[0_12px_36px_rgba(15,30,49,0.05)] ring-1 ring-sky-200/40 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-600 text-lg">person_pin</span>
                  <h2 className="text-xs font-headline font-bold text-polar-navy uppercase tracking-wider">
                    Field Researcher Synthesis
                  </h2>
                </div>

                {/* Architectural Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer" htmlFor="traveler-toggle">
                  <input
                    type="checkbox"
                    checked={journeyState.includeTraveler}
                    onChange={(e) => onUpdateJourney({ includeTraveler: e.target.checked })}
                    className="sr-only peer"
                    id="traveler-toggle"
                    aria-label="Include Traveler in Scene"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white peer-checked:bg-sky-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all" />
                </label>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-headline font-bold text-polar-navy">
                  Include Traveler in Scene (Optional)
                </span>
                <span className="font-mono text-sky-600 font-semibold text-[11px] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  PORTRAIT EMBEDDING
                </span>
              </div>

              <p className="text-xs text-cool-slate mb-4 leading-relaxed">
                Upload a reference portrait to seamlessly composite yourself into the reconstructed era. The diffusion engine translates modern garments into period-accurate historical attire or atmospheric naturalist silhouette.
              </p>

              {/* Traveler Reference Upload Zone */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-sky-50/50 p-4 rounded-2xl border border-sky-200/70">
                {/* Portrait Slot */}
                <div className="sm:col-span-4 aspect-square bg-white rounded-2xl border-2 border-dashed border-sky-300 relative flex flex-col items-center justify-center overflow-hidden group shadow-sm">
                  {journeyState.selfiePreviewUrl ? (
                    <>
                      <img
                        src={journeyState.selfiePreviewUrl}
                        alt="Traveler reference portrait"
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-[10px] text-cyan-300 font-mono rounded-full border border-white/20">
                        EMBED: 512d
                      </div>
                    </>
                  ) : (
                    <div
                      onClick={() => selfieInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-sky-50 transition-colors w-full h-full"
                    >
                      <span className="material-symbols-outlined text-2xl text-sky-600 mb-1">add_a_photo</span>
                      <span className="text-[10px] font-headline font-semibold text-polar-navy">Add Selfie</span>
                    </div>
                  )}
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="selfie-file-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelfieFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {/* Blend Control Settings */}
                <div className="sm:col-span-8 flex flex-col gap-2">
                  <span className="text-[11px] font-headline font-bold text-cool-slate uppercase tracking-wider">
                    Historical Adaptation Mode
                  </span>
                  <div className="space-y-1.5">
                    {[
                      { mode: 'period' as AttireMode, label: 'Period-Accurate Expedition Gear' },
                      { mode: 'silhouette' as AttireMode, label: 'Silhouetted Naturalist (Contre-Jour)' },
                      { mode: 'modern' as AttireMode, label: 'Modern Field Jacket (Temporal Anachronism)' },
                    ].map((item) => (
                      <label key={item.mode} className="flex items-center gap-2 text-xs text-polar-navy cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="attire-mode"
                          checked={journeyState.attireMode === item.mode}
                          onChange={() => onUpdateJourney({ attireMode: item.mode })}
                          className="text-sky-600 focus:ring-sky-500 bg-white border-sky-300 h-4 w-4"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-2 mt-1 border-t border-sky-200/70 flex items-center justify-between font-mono text-cool-slate text-[11px]">
                    <span>
                      Pose Confidence: <strong className="text-sky-700">98.4%</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={loadSampleSelfie}
                        className="text-sky-600 font-semibold hover:text-sky-700 underline text-[11px] cursor-pointer"
                        type="button"
                      >
                        Sample Face
                      </button>
                      <button
                        onClick={() => selfieInputRef.current?.click()}
                        className="text-sky-600 font-semibold hover:text-sky-700 underline text-[11px] cursor-pointer"
                        type="button"
                      >
                        Upload Face
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {selfieError && (
                <div className="mt-2 text-red-600 text-xs font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{selfieError}</span>
                </div>
              )}
            </div>

            {/* MODULE 3: SENSOR & RESOLUTION AUDIT */}
            <div className="bg-white/75 backdrop-blur-xl border border-white/90 rounded-2xl p-4 shadow-sm ring-1 ring-sky-200/40">
              <div className="flex items-center justify-between font-mono text-xs text-cool-slate flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]" />
                  DIFFUSION LENS RATIO: 2.39:1 CINEMATIC READY
                </span>
                <span className="text-sky-700 font-semibold bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/60">
                  LATENT 4K UPSCALER READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= ACTION STICKY DOCK / FOOTER BAR ================= */}
      <aside className="sticky bottom-0 z-40 bg-white/85 backdrop-blur-xl border-t border-white/90 py-4 px-4 sm:px-6 md:px-12 shadow-[0_-8px_24px_rgba(15,30,49,0.04)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Status Prompt */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 font-mono text-xs text-cool-slate">
              <span className="material-symbols-outlined text-base text-sky-600">check_circle</span>
              <span className="font-medium text-polar-navy">
                {isFormValid ? 'Source Plate Calibrated & Geo-Anchored' : 'Select or upload a landscape photo to proceed'}
              </span>
            </div>
            <button
              onClick={onReset}
              className="text-xs font-headline font-semibold text-cool-slate hover:text-red-600 transition-colors flex items-center gap-1.5 uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-red-50 cursor-pointer"
              id="btn-clear-reset"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>Clear & Reset</span>
            </button>
          </div>

          {/* Right: Primary Step Forward Trigger */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={loadSampleRedwood}
              className="px-5 py-2.5 rounded-full border border-sky-200/80 bg-white/80 hover:bg-white text-xs font-headline font-semibold text-cool-slate hover:text-polar-navy hover:border-sky-400 transition-all uppercase tracking-wider hidden sm:block shadow-sm cursor-pointer"
              type="button"
            >
              Inspect EXIF Matrix
            </button>
            <motion.button
              whileHover={isFormValid ? { scale: 1.02 } : {}}
              whileTap={isFormValid ? { scale: 0.98 } : {}}
              disabled={!isFormValid}
              onClick={() => onNavigate('era')}
              className={`w-full sm:w-auto px-7 py-3 rounded-full font-headline font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(2,132,199,0.35)] ${
                isFormValid
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
              type="button"
            >
              <span>Proceed to Historical Epochs</span>
              <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
            </motion.button>
          </div>
        </div>
      </aside>
    </div>
  );
};
