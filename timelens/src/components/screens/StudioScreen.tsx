import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SAMPLE_LANDSCAPE_IMAGE, SAMPLE_SELFIE_IMAGE } from '../../data/eras';
import type { AttireMode, ScreenId, UserJourneyState } from '../../types';

interface StudioScreenProps {
  journeyState: UserJourneyState;
  onUpdateJourney: (updates: Partial<UserJourneyState>) => void;
  onNavigate: (screen: ScreenId) => void;
  onReset: () => void;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
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
  
  // Location sub-states
  const [pinCodeInput, setPinCodeInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);

  const landscapeInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleLandscapeFile = (file: File) => {
    setLandscapeError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLandscapeError('This file type is not supported. Please choose a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLandscapeError('File size exceeds 25MB limit. Please select a smaller landscape image.');
      return;
    }

    // Revoke old object URL if needed to prevent memory leaks
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

  const handleRemoveLandscape = () => {
    if (journeyState.landscapePreviewUrl && journeyState.landscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(journeyState.landscapePreviewUrl);
    }
    onUpdateJourney({
      landscapeFile: null,
      landscapePreviewUrl: null,
      landscapeFileName: '',
    });
    setLandscapeError(null);
  };

  const handleSelfieFile = (file: File) => {
    setSelfieError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSelfieError('This file type is not supported. Please choose a JPG or PNG image.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setSelfieError('Portrait size exceeds 15MB limit.');
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

  const handleRemoveSelfie = () => {
    if (journeyState.selfiePreviewUrl && journeyState.selfiePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(journeyState.selfiePreviewUrl);
    }
    onUpdateJourney({
      selfieFile: null,
      selfiePreviewUrl: null,
      includeTraveler: false,
    });
    setSelfieError(null);
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
      landscapeFileName: 'sample_redwood_grove.jpg',
      location: 'Olympic National Park, Hoh Rain Forest, WA',
      locationCoordinates: '',
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

  // Option A: Handle PIN Code input
  const handlePinCodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);
    setLocationStatusMessage(null);

    const trimmed = pinCodeInput.trim();
    if (!trimmed) {
      setPinError('Please enter a 6-digit PIN code.');
      return;
    }

    // Validate 6 digits numeric
    if (!/^\d{6}$/.test(trimmed)) {
      setPinError('Enter a valid six-digit PIN code.');
      return;
    }

    const formattedLoc = `PIN Code ${trimmed} (Approximate Area)`;
    onUpdateJourney({
      location: formattedLoc,
      locationCoordinates: '',
    });
    setLocationStatusMessage(`Location set to PIN ${trimmed}. Identifies approximate geographic area.`);
  };

  // Option B: Browser Geolocation
  const requestBrowserLocation = () => {
    setPinError(null);
    setLocationStatusMessage(null);

    if (!navigator.geolocation) {
      setLocationStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        const coordsStr = `${lat}° N, ${lon}° E`;
        const locName = `Device Location (${coordsStr})`;
        onUpdateJourney({
          location: locName,
          locationCoordinates: coordsStr,
        });
        setLocationStatusMessage(`Coordinates acquired: ${coordsStr}`);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatusMessage('Location permission was denied. You can enter a PIN code or continue without a location.');
        } else if (err.code === err.TIMEOUT) {
          setLocationStatusMessage('Location request timed out. You can enter a PIN code or continue without a location.');
        } else {
          setLocationStatusMessage('Unable to retrieve location. You can enter a PIN code or continue without a location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
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
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-sky-200/50 pb-6 gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-headline font-semibold text-sky-600 tracking-widest uppercase block mb-1">
              Step 1 of 3 — Image & Context
            </span>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-polar-navy tracking-tight">
              Capture Your Landscape
            </h1>
            <p className="text-sm text-cool-slate mt-2 leading-relaxed">
              Upload a photograph of a real landscape, set optional location context, and optionally include yourself to begin historical reconstruction.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadSampleRedwood}
              className="px-5 py-2.5 rounded-full bg-white/90 hover:bg-white border border-sky-200/80 hover:border-sky-400 text-xs font-headline font-semibold text-polar-navy shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              id="btn-sample-redwood"
              type="button"
            >
              <span className="material-symbols-outlined text-base text-sky-600">nature</span>
              <span>Load Sample Redwood Grove</span>
            </button>
          </div>
        </div>

        {/* PRIMARY INTERFACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: LANDSCAPE PHOTO UPLOAD & PREVIEW (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <motion.div
              layout
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm rounded-3xl p-4 sm:p-6 transition-colors duration-300 ring-1 ${
                isDragging ? 'ring-2 ring-sky-500 bg-sky-50/60' : 'ring-sky-200/40'
              }`}
            >
              {/* Aspect Ratio Landscape Frame */}
              <div className="relative aspect-[16/9] w-full bg-slate-100 rounded-2xl border border-sky-200/60 overflow-hidden shadow-inner">
                <AnimatePresence mode="wait">
                  {journeyState.landscapePreviewUrl ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col justify-between"
                    >
                      <img
                        className="absolute inset-0 w-full h-full object-cover select-none"
                        alt="Source landscape preview"
                        id="source-preview-image"
                        src={journeyState.landscapePreviewUrl}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/10 pointer-events-none" />

                      {/* Top Preview Badge */}
                      <div className="relative z-10 flex items-center justify-between px-3.5 py-2 font-mono text-[11px] text-white bg-slate-900/50 backdrop-blur-md rounded-b-xl mx-2 mt-2 border border-white/20 shadow-sm">
                        <div className="flex items-center gap-2 truncate">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-medium truncate">
                            {journeyState.landscapeFileName || 'Landscape Photo Loaded'}
                          </span>
                        </div>
                        <span className="text-cyan-300 font-semibold text-[10px] shrink-0 ml-2">READY</span>
                      </div>

                      {/* Bottom Action Controls */}
                      <div className="relative z-10 p-3 flex items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-md rounded-t-xl mx-2 mb-2 border border-white/20">
                        <span className="text-xs font-headline text-white/90 truncate">
                          {journeyState.landscapeFileName || 'Landscape Image'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => landscapeInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Change Photo</span>
                          </button>
                          <button
                            onClick={handleRemoveLandscape}
                            className="px-3 py-1.5 rounded-full bg-red-500/30 hover:bg-red-500/50 text-red-100 text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => landscapeInputRef.current?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6 text-center hover:bg-sky-50/60 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-sky-100/80 text-sky-600 flex items-center justify-center mb-3 shadow-xs border border-sky-200">
                        <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                      </div>
                      <span className="font-headline font-bold text-polar-navy text-base">
                        Upload or Drag Landscape Photograph
                      </span>
                      <span className="text-xs text-cool-slate mt-1 max-w-sm">
                        Click to choose a landscape photo from your device or drag an image here (JPG, PNG, WebP up to 25MB).
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Validation Error Message */}
              <AnimatePresence>
                {landscapeError && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    role="alert"
                    className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base text-red-600">error</span>
                    <span>{landscapeError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden File Input & Upload Bar */}
              <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between gap-3">
                <div className="text-xs text-cool-slate">
                  Accepted formats: JPG, PNG, WebP (up to 25MB)
                </div>
                <div className="flex items-center gap-2">
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
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-headline font-semibold rounded-full transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">upload</span>
                    <span>Browse Files</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: LOCATION & OPTIONAL TRAVELER (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* LOCATION INPUT CARD */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-3xl p-6 shadow-sm ring-1 ring-sky-200/40">
              <div className="flex items-center gap-2 pb-3 border-b border-sky-100 mb-4">
                <span className="material-symbols-outlined text-sky-600 text-xl">location_on</span>
                <h2 className="text-sm font-headline font-bold text-polar-navy uppercase tracking-wider">
                  Location Context (Optional)
                </h2>
              </div>

              <p className="text-xs text-cool-slate mb-4 leading-relaxed">
                Provide an approximate area or PIN code to help inform regional climate and plant life. Location is completely optional.
              </p>

              {/* OPTION A: PIN CODE INPUT */}
              <div className="mb-4 bg-sky-50/50 p-4 rounded-2xl border border-sky-200/70">
                <span className="text-xs font-headline font-bold text-polar-navy block mb-1">
                  Option A — Enter a PIN Code
                </span>
                <p className="text-[11px] text-cool-slate mb-2">
                  Enter an Indian 6-digit PIN code. Identifies an approximate area, not your exact address.
                </p>
                <form onSubmit={handlePinCodeSubmit} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 110001"
                    value={pinCodeInput}
                    data-testid="pin-input"
                    onChange={(e) => {
                      setPinCodeInput(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    className="w-32 px-3 py-2 bg-white border border-sky-200 rounded-xl text-polar-navy font-mono text-sm focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Set PIN
                  </button>
                </form>
                <AnimatePresence>
                  {pinError && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <span>{pinError}</span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* OPTION B: USE MY LOCATION BUTTON */}
              <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-200/70">
                <span className="text-xs font-headline font-bold text-polar-navy block mb-1">
                  Option B — Use My Current Location
                </span>
                <p className="text-[11px] text-cool-slate mb-2">
                  Requests browser geolocation only when clicked.
                </p>
                <button
                  type="button"
                  onClick={requestBrowserLocation}
                  disabled={isLocating}
                  className="px-4 py-2 bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className={`material-symbols-outlined text-base text-sky-600 ${isLocating ? 'animate-spin' : ''}`}>
                    my_location
                  </span>
                  <span>{isLocating ? 'Acquiring location...' : 'Use My Location'}</span>
                </button>
              </div>

              {/* Selected Location Display & Direct Input */}
              <div className="mt-2">
                <label className="text-xs font-semibold text-polar-navy block mb-1">
                  Selected Location / Region
                </label>
                <div className="relative flex items-center">
                  <input
                    id="location-input"
                    data-testid="location-input"
                    type="text"
                    value={journeyState.location}
                    onChange={(e) => onUpdateJourney({ location: e.target.value })}
                    placeholder="e.g. 110001 or Olympic National Park, WA"
                    className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-polar-navy text-xs font-medium focus:border-sky-500 focus:outline-none"
                  />
                  {journeyState.location && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateJourney({ location: '', locationCoordinates: '' });
                        setLocationStatusMessage(null);
                        setPinCodeInput('');
                      }}
                      className="absolute right-2 text-cool-slate hover:text-red-600 text-xs font-semibold px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* General location status message */}
              <AnimatePresence>
                {locationStatusMessage && !journeyState.location && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-sky-800 mt-2 bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                      {locationStatusMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* OPTIONAL SELFIE CARD */}
            <motion.div layout className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-3xl p-6 shadow-sm ring-1 ring-sky-200/40">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-600 text-xl">person_pin</span>
                  <h2 className="text-sm font-headline font-bold text-polar-navy uppercase tracking-wider">
                    Include Yourself (Optional)
                  </h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" htmlFor="traveler-toggle">
                  <input
                    type="checkbox"
                    checked={journeyState.includeTraveler}
                    onChange={(e) => onUpdateJourney({ includeTraveler: e.target.checked })}
                    className="sr-only peer"
                    id="traveler-toggle"
                    data-testid="traveler-toggle"
                    aria-label="Include Traveler in Scene"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white peer-checked:bg-sky-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all" />
                </label>
              </div>

              <p className="text-xs text-cool-slate mb-4 leading-relaxed">
                Upload a portrait photo to appear as an observer in the reconstructed historical scene.
              </p>

              <AnimatePresence>
                {journeyState.includeTraveler && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 bg-sky-50/50 p-4 rounded-2xl border border-sky-200/70">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-sky-300 overflow-hidden relative flex items-center justify-center shrink-0">
                          {journeyState.selfiePreviewUrl ? (
                            <img
                              src={journeyState.selfiePreviewUrl}
                              alt="Selfie preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-2xl text-sky-400">person</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
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
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => selfieInputRef.current?.click()}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              {journeyState.selfiePreviewUrl ? 'Change Portrait' : 'Upload Selfie'}
                            </button>
                            <button
                              type="button"
                              onClick={loadSampleSelfie}
                              className="px-3 py-1.5 bg-white border border-sky-300 text-sky-800 text-xs font-semibold rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
                            >
                              Sample Face
                            </button>
                          </div>
                          {journeyState.selfiePreviewUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveSelfie}
                              className="text-xs text-red-600 hover:underline self-start cursor-pointer"
                            >
                              Remove Selfie
                            </button>
                          )}
                        </div>
                      </div>

                      {selfieError && (
                        <p className="text-xs text-red-600">{selfieError}</p>
                      )}

                      {/* Attire Choice */}
                      <div className="pt-2 border-t border-sky-200/60">
                        <span className="text-xs font-headline font-bold text-polar-navy block mb-2">
                          Attire Adaptation Mode
                        </span>
                        <div className="space-y-1.5">
                          {[
                            { mode: 'period' as AttireMode, label: 'Period-Accurate Attire' },
                            { mode: 'silhouette' as AttireMode, label: 'Silhouetted Observer' },
                            { mode: 'modern' as AttireMode, label: 'Modern Outfit' },
                          ].map((item) => (
                            <label key={item.mode} className="flex items-center gap-2 text-xs text-polar-navy font-medium cursor-pointer">
                              <input
                                type="radio"
                                name="attire-mode"
                                checked={journeyState.attireMode === item.mode}
                                onChange={() => onUpdateJourney({ attireMode: item.mode })}
                                className="text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      </main>

      {/* STICKY BOTTOM DOCK */}
      <aside className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-sky-200/60 py-4 px-4 sm:px-6 md:px-12 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onReset}
            className="text-xs font-headline font-semibold text-cool-slate hover:text-red-600 transition-colors flex items-center gap-1.5 uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-red-50 cursor-pointer"
            id="btn-clear-reset"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Clear & Reset</span>
          </button>

          <motion.button
            whileHover={isFormValid ? { scale: 1.02 } : {}}
            whileTap={isFormValid ? { scale: 0.98 } : {}}
            disabled={!isFormValid}
            onClick={() => onNavigate('era')}
            className={`px-7 py-3 rounded-full font-headline font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
              isFormValid
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            type="button"
          >
            <span>Proceed to Historical Epochs</span>
            <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
          </motion.button>
        </div>
      </aside>
    </div>
  );
};
