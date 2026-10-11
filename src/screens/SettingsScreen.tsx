import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Trash2,
  Mic,
  Bell,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Shield,
  Server,
  Smartphone,
} from 'lucide-react';
import {
  checkServerHealth,
  isServerAiEnabled,
  setServerAiEnabled,
  getApiBaseUrl,
} from '../core/api/client';
import type { HealthResponse } from '../core/api/schemas';
import pkg from '../../package.json';

interface SettingsScreenProps {
  onClearAll: () => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClearAll }) => {
  // 1. Defaults
  const [defaultDuration, setDefaultDuration] = useState<number>(() => {
    const s = localStorage.getItem('chalte_default_duration');
    return s ? parseInt(s, 10) : 20;
  });
  const [defaultLanguage, setDefaultLanguage] = useState<'en' | 'hi'>(() => {
    const s = localStorage.getItem('chalte_default_language');
    return s === 'hi' ? 'hi' : 'en';
  });

  // 2. TTS
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return localStorage.getItem('chalte_tts_voice') || '';
  });
  const [pace, setPace] = useState<number>(() => {
    const p = localStorage.getItem('chalte_tts_rate');
    return p ? parseFloat(p) : 0.9;
  });
  const [pitch, setPitch] = useState<number>(() => {
    const p = localStorage.getItem('chalte_tts_pitch');
    return p ? parseFloat(p) : 1.0;
  });
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // 3. Haptics
  const isVibrationSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('chalte_haptics') !== 'false';
  });

  // 4. Permissions
  const [micPermission, setMicPermission] = useState<string>('checking…');
  const [notifPermission, setNotifPermission] = useState<string>('checking…');

  // 5. Storage
  const [storageEstimate, setStorageEstimate] = useState<{ usedMB: string; quotaMB: string } | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);

  // 6. AI Processing & Server Health
  const [serverMode, setServerMode] = useState<boolean>(() => isServerAiEnabled());
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [serverHealth, setServerHealth] = useState<HealthResponse | null>(null);
  const [serverStatusMessage, setServerStatusMessage] = useState<string>('Checking…');
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  // 7. Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTypedText, setDeleteTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Load voices honestly
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const populate = () => {
      const all = window.speechSynthesis.getVoices();
      const prefix = defaultLanguage === 'hi' ? 'hi' : 'en';
      const filtered = all.filter(
        (v) => v.lang.startsWith(prefix) || (defaultLanguage === 'hi' && v.lang.includes('IN'))
      );
      const list = filtered.length > 0 ? filtered : all.filter((v) => v.lang.startsWith('en'));
      setVoices(list);
      if (list.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(list[0].voiceURI);
      }
    };

    populate();
    window.speechSynthesis.onvoiceschanged = populate;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [defaultLanguage, selectedVoiceURI]);

  // Query permissions
  useEffect(() => {
    async function checkPermissions() {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        try {
          const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermission(micStatus.state);
          micStatus.onchange = () => setMicPermission(micStatus.state);
        } catch {
          setMicPermission('unsupported');
        }

        try {
          const notifStatus = await navigator.permissions.query({ name: 'notifications' as PermissionName });
          setNotifPermission(notifStatus.state);
          notifStatus.onchange = () => setNotifPermission(notifStatus.state);
        } catch {
          setNotifPermission(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
        }
      } else {
        setMicPermission('prompt');
        setNotifPermission(typeof Notification !== 'undefined' ? Notification.permission : 'prompt');
      }
    }
    checkPermissions();
  }, []);

  // Check Storage
  useEffect(() => {
    async function checkStorage() {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        try {
          const est = await navigator.storage.estimate();
          const usedMB = ((est.usage || 0) / (1024 * 1024)).toFixed(1);
          const quotaMB = ((est.quota || 0) / (1024 * 1024)).toFixed(0);
          setStorageEstimate({ usedMB, quotaMB });

          if (navigator.storage.persisted) {
            const persisted = await navigator.storage.persisted();
            setIsPersisted(persisted);
          }
        } catch {
          // ignore
        }
      }
    }
    checkStorage();
  }, []);

  // Check Server Health when in server mode
  const refreshServerHealth = async () => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      setServerStatusMessage('No base URL configured (VITE_API_BASE_URL unset)');
      setServerHealth(null);
      return;
    }

    setIsCheckingServer(true);
    setServerStatusMessage('Probing /v1/health…');
    try {
      const health = await checkServerHealth();
      setServerHealth(health);
      setServerStatusMessage(`Healthy (v${health.version})`);
    } catch (err) {
      setServerHealth(null);
      setServerStatusMessage('Unreachable (Offline or refused connection)');
    } finally {
      setIsCheckingServer(false);
    }
  };

  useEffect(() => {
    if (serverMode) {
      refreshServerHealth();
    }
  }, [serverMode]);

  // Update duration default
  const handleDurationChange = (d: number) => {
    setDefaultDuration(d);
    localStorage.setItem('chalte_default_duration', String(d));
  };

  // Update language default
  const handleLanguageChange = (lang: 'en' | 'hi') => {
    setDefaultLanguage(lang);
    localStorage.setItem('chalte_default_language', lang);
  };

  // Test voice
  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsTestingVoice(true);

    const testText =
      defaultLanguage === 'hi'
        ? 'कदम दर कदम, खामोशी में मन की उलझनें शांत होने लगती हैं।'
        : 'To walk alone is to let silence organize the world.';

    const utterance = new SpeechSynthesisUtterance(testText);
    const chosen = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (chosen) utterance.voice = chosen;
    utterance.rate = pace;
    utterance.pitch = pitch;

    utterance.onend = () => setIsTestingVoice(false);
    utterance.onerror = () => setIsTestingVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  // Test haptics
  const handleTestHaptics = () => {
    if (isVibrationSupported) {
      navigator.vibrate([40, 60, 40]);
    }
  };

  // Request persistent storage
  const handleRequestPersist = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      setIsPersisted(granted);
    }
  };

  // Toggle server mode
  const handleToggleServer = (enable: boolean) => {
    if (enable) {
      setShowConsentModal(true);
    } else {
      setServerMode(false);
      setServerAiEnabled(false);
    }
  };

  const handleConfirmServerConsent = () => {
    setServerMode(true);
    setServerAiEnabled(true);
    setShowConsentModal(false);
    refreshServerHealth();
  };

  // Delete all local data
  const handleConfirmDelete = async () => {
    if (deleteTypedText.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await onClearAll();
      localStorage.clear();
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setIsDeleting(false);
      alert('Failed to clear storage cleanly: ' + String(err));
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-28 px-5 pt-3">
      {/* Header */}
      <header className="flex justify-between items-center w-full py-3 shrink-0">
        <div>
          <h1 className="font-space text-[24px] font-bold text-[#F4F3EF] tracking-tight">
            Settings
          </h1>
          <p className="text-[12px] font-inter text-[#8E97A6] leading-none mt-0.5">
            Preferences, storage & privacy
          </p>
        </div>
      </header>

      {/* Quote */}
      <div className="pt-2 pb-3">
        <p className="font-instrument text-[22px] italic text-[#F4F3EF]/90 leading-tight">
          “Solitude gives space for thoughts to settle like clear water.”
        </p>
        <span className="font-space text-[10px] uppercase tracking-widest text-[#5C6473] mt-1 block font-semibold">
          Quiet Calibration
        </span>
      </div>

      <div className="space-y-5 flex-1">
        {/* 1. WALKING PREFERENCES */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-4 text-left">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#A8E6E8]">
              <Volume2 className="w-4 h-4" />
            </span>
            <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
              Walking Preferences
            </h2>
          </div>

          {/* Duration Options */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-inter font-semibold text-[#F4F3EF]">
              Default Walk Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 10, label: '10 min', sub: 'Quick reset' },
                { val: 20, label: '20 min', sub: 'Recommended' },
                { val: 30, label: '30 min', sub: 'Deep reflection' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleDurationChange(opt.val)}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center min-h-[50px] transition-all active:scale-95 ${
                    defaultDuration === opt.val
                      ? 'border-[#A8E6E8]/60 bg-[#232A38]/90 text-[#A8E6E8]'
                      : 'border-white/5 bg-[#1B202A]/40 text-[#8E97A6] hover:text-[#F4F3EF]'
                  }`}
                >
                  <span className="font-space text-[14px] font-bold">{opt.label}</span>
                  <span className="text-[10px] font-inter opacity-70">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Toggle */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-inter font-semibold text-[#F4F3EF]">
              Spoken Reflection Language
            </label>
            <div className="flex bg-[#1B202A] rounded-xl p-1 border border-white/5">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 py-1.5 rounded-lg text-[13px] font-inter transition-all ${
                  defaultLanguage === 'en'
                    ? 'bg-[#A8E6E8] text-[#10131B] font-semibold'
                    : 'text-[#8E97A6]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('hi')}
                className={`flex-1 py-1.5 rounded-lg text-[13px] font-inter transition-all ${
                  defaultLanguage === 'hi'
                    ? 'bg-[#A8E6E8] text-[#10131B] font-semibold'
                    : 'text-[#8E97A6]'
                }`}
              >
                Hinglish
              </button>
            </div>
          </div>

          {/* TTS Voices */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-inter font-semibold text-[#F4F3EF]">
                Text-to-Speech Voice
              </label>
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={isTestingVoice || voices.length === 0}
                className="text-[11px] font-space text-[#A8E6E8] flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isTestingVoice ? 'Speaking…' : 'Test voice'}</span>
              </button>
            </div>

            {voices.length > 0 ? (
              <select
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
                  localStorage.setItem('chalte_tts_voice', e.target.value);
                }}
                className="w-full bg-[#1B202A] border border-white/10 rounded-xl p-2.5 text-[13px] text-[#F4F3EF] outline-none focus:border-[#A8E6E8]"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-[#10131B]">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[12px] text-[#8E97A6] bg-[#1B202A] p-2.5 rounded-xl border border-white/5">
                No system voices found for {defaultLanguage === 'hi' ? 'Hindi/Hinglish' : 'English'}. Default browser voice will be used.
              </p>
            )}

            {/* Speaking Pace Slider */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-[11px] text-[#8E97A6]">
                <span>Speaking Pace</span>
                <span className="font-mono text-[#A8E6E8]">{pace.toFixed(1)}x ({pace < 1.0 ? 'Mindful' : pace === 1.0 ? 'Natural' : 'Brisk'})</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={pace}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPace(val);
                  localStorage.setItem('chalte_tts_rate', String(val));
                }}
                className="w-full accent-[#A8E6E8]"
              />
            </div>

            {/* Speaking Pitch Slider */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-[11px] text-[#8E97A6]">
                <span>Voice Pitch</span>
                <span className="font-mono text-[#A8E6E8]">{pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={pitch}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPitch(val);
                  localStorage.setItem('chalte_tts_pitch', String(val));
                }}
                className="w-full accent-[#A8E6E8]"
              />
            </div>
          </div>

          {/* Haptic Cues Toggle */}
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <div>
              <span className="block text-[13px] font-inter font-semibold text-[#F4F3EF]">
                Haptic Cues
              </span>
              <span className="block text-[11px] font-inter text-[#8E97A6]">
                {isVibrationSupported
                  ? 'Subtle vibration when inquiry questions appear'
                  : 'Haptics are not supported on this browser/platform'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isVibrationSupported && hapticsEnabled && (
                <button
                  type="button"
                  onClick={handleTestHaptics}
                  className="px-2 py-1 text-[11px] font-space text-[#A8E6E8] bg-white/5 rounded-lg hover:bg-white/10"
                >
                  Test
                </button>
              )}
              <button
                type="button"
                disabled={!isVibrationSupported}
                onClick={() => {
                  const next = !hapticsEnabled;
                  setHapticsEnabled(next);
                  localStorage.setItem('chalte_haptics', String(next));
                }}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  !isVibrationSupported
                    ? 'bg-white/5 cursor-not-allowed opacity-40'
                    : hapticsEnabled
                    ? 'bg-[#A8E6E8] justify-end'
                    : 'bg-white/20 justify-start'
                }`}
                aria-label="Toggle haptics"
              >
                <span
                  className={`w-5 h-5 rounded-full shadow-md transition-transform ${
                    hapticsEnabled ? 'bg-[#10131B]' : 'bg-white'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 2. AI PROCESSING: LOCAL VS SERVER */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#B9B4E8]">
                <Cpu className="w-4 h-4" />
              </span>
              <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
                AI Processing
              </h2>
            </div>
            <span className="text-[11px] font-space text-[#8E97A6] uppercase tracking-wider">
              {serverMode ? 'My Server' : 'On-Device (Manual)'}
            </span>
          </div>

          <p className="text-[12px] font-inter text-[#8E97A6] leading-relaxed">
            By default, Chalte-Chalte is 100% on-device and manual. You can optionally connect your own local FastAPI server for automated Whisper transcription and Gemma journal synthesis.
          </p>

          {/* Toggle */}
          <div className="flex bg-[#1B202A] rounded-xl p-1 border border-white/5">
            <button
              type="button"
              onClick={() => handleToggleServer(false)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-inter transition-all ${
                !serverMode
                  ? 'bg-[#A8E6E8] text-[#10131B] font-semibold'
                  : 'text-[#8E97A6]'
              }`}
            >
              On this device (manual)
            </button>
            <button
              type="button"
              onClick={() => handleToggleServer(true)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-inter transition-all ${
                serverMode
                  ? 'bg-[#A8E6E8] text-[#10131B] font-semibold'
                  : 'text-[#8E97A6]'
              }`}
            >
              My server
            </button>
          </div>

          {/* Server Status Row */}
          {serverMode && (
            <div className="bg-[#1B202A]/80 rounded-xl p-3 border border-white/5 space-y-2 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-[#8E97A6]">Base URL</span>
                <span className="font-mono text-[#F4F3EF] truncate max-w-[200px]">
                  {getApiBaseUrl() || 'Unconfigured'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8E97A6]">Server Status</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    serverHealth?.status === 'healthy' ? 'text-[#A8E6E8]' : 'text-[#E27D7D]'
                  }`}
                >
                  {serverHealth?.status === 'healthy' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {serverStatusMessage}
                </span>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={refreshServerHealth}
                  disabled={isCheckingServer}
                  className="text-[11px] font-space text-[#A8E6E8] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isCheckingServer ? 'Testing…' : 'Probe /v1/health'}</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. HARDWARE & OS PERMISSIONS */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3 text-left">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#A8E6E8]">
              <Smartphone className="w-4 h-4" />
            </span>
            <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
              Hardware & Permissions
            </h2>
          </div>

          {/* Mic */}
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-[#8E97A6]" />
              <div>
                <span className="block text-[13px] font-inter text-[#F4F3EF]">Microphone</span>
                <span className="block text-[11px] font-inter text-[#8E97A6]">Spoken reflection recordings</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-space uppercase font-semibold ${
                micPermission === 'granted'
                  ? 'bg-[#A8E6E8]/10 text-[#A8E6E8] border border-[#A8E6E8]/20'
                  : micPermission === 'denied'
                  ? 'bg-[#E27D7D]/10 text-[#E27D7D] border border-[#E27D7D]/20'
                  : 'bg-white/5 text-[#8E97A6]'
              }`}
            >
              {micPermission}
            </span>
          </div>

          {/* Notifications */}
          <div className="flex justify-between items-center py-1 border-t border-white/5">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#8E97A6]" />
              <div>
                <span className="block text-[13px] font-inter text-[#F4F3EF]">Notifications</span>
                <span className="block text-[11px] font-inter text-[#8E97A6]">Quiet background walk end alert</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-space uppercase font-semibold ${
                notifPermission === 'granted'
                  ? 'bg-[#A8E6E8]/10 text-[#A8E6E8] border border-[#A8E6E8]/20'
                  : notifPermission === 'denied'
                  ? 'bg-[#E27D7D]/10 text-[#E27D7D] border border-[#E27D7D]/20'
                  : 'bg-white/5 text-[#8E97A6]'
              }`}
            >
              {notifPermission}
            </span>
          </div>
        </section>

        {/* 4. LOCAL STORAGE & DATA MANAGEMENT */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-4 text-left">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#F0E7D5]">
              <HardDrive className="w-4 h-4 text-[#F0E7D5]" />
            </span>
            <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
              Local Vault Storage
            </h2>
          </div>

          {/* Storage usage */}
          {storageEstimate && (
            <div className="bg-[#1B202A]/80 rounded-xl p-3 border border-white/5 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-[#8E97A6]">Vault Space Used</span>
                <span className="font-mono text-[#F4F3EF] font-semibold">{storageEstimate.usedMB} MB</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#A8E6E8] rounded-full"
                  style={{ width: `${Math.min(100, Math.max(4, parseFloat(storageEstimate.usedMB) * 5))}%` }}
                />
              </div>
              <div className="flex flex-col gap-1.5 text-[11px] text-[#8E97A6] pt-1">
                <div className="flex justify-between items-center">
                  <span>
                    Persistence status:{' '}
                    <strong className={isPersisted ? 'text-[#A8E6E8]' : 'text-[#F0E7D5]'}>
                      {isPersisted === true ? '✓ Granted (Protected)' : isPersisted === false ? 'Standard (Not granted)' : 'Standard'}
                    </strong>
                  </span>
                  {!isPersisted && (
                    <button
                      type="button"
                      onClick={handleRequestPersist}
                      className="text-[#A8E6E8] hover:underline font-space"
                    >
                      Request persistent
                    </button>
                  )}
                </div>
                {!isPersisted && (
                  <p className="text-[11px] text-[#E27D7D]/90 leading-tight">
                    Notice: Without persistent storage approval, your device OS may evict local audio and journals under heavy storage pressure.
                  </p>
                )}
                {isPersisted && (
                  <p className="text-[11px] text-[#A8E6E8]/90 leading-tight">
                    Persistent storage active. Your reflections and clips will not be automatically pruned by the browser.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Clear all data button */}
          <button
            type="button"
            onClick={() => {
              setDeleteTypedText('');
              setShowDeleteModal(true);
            }}
            className="w-full py-3 px-4 rounded-xl border border-[#E27D7D]/30 bg-[#E27D7D]/10 hover:bg-[#E27D7D]/15 text-[#E27D7D] font-space font-semibold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete all local data</span>
          </button>
          {deleteSuccess && (
            <p className="text-[12px] text-[#A8E6E8] text-center">
              ✓ All local data deleted. Reloading sandbox…
            </p>
          )}
        </section>

        {/* 5. PRIVACY NOTICE WITH MANDATORY DISCLAIMER */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3 text-left">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#A8E6E8]">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
              Privacy Architecture
            </h2>
          </div>

          <div className="space-y-2 text-[12px] font-inter text-[#8E97A6] leading-relaxed">
            <p>
              When running in on-device mode, all voice recordings, transcripts, and synthesized reflections are preserved strictly within your device's IndexedDB storage sandbox.
            </p>
            <p>
              When the <span className="text-[#F4F3EF]">My server</span> option is enabled, intention parameters are sent to generate inquiries, audio blobs are uploaded for transcription, and transcript text is sent for journal synthesis.
            </p>
            <div className="p-3 rounded-xl bg-[#1B202A] border border-white/5 font-mono text-[11px] text-[#A0A9B8]">
              [TODO: confirm retention statement with backend owner]
            </div>
          </div>
        </section>

        {/* 6. APP METRICS & FOOTER */}
        <footer className="pt-2 pb-6 space-y-3 text-center">
          <div className="flex justify-center gap-3 text-[11px] font-space text-[#5C6473]">
            <span>Zero Analytics</span>
            <span>·</span>
            <span>No Ads</span>
            <span>·</span>
            <span>No Telemetry</span>
          </div>
          <p className="text-[11px] font-inter text-[#5C6473]">
            Chalte-Chalte v{pkg.version} · The Walking Philosopher
          </p>
        </footer>
      </div>

      {/* Consent Modal for Server AI */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-[#10131B]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] glass-panel rounded-2xl p-5 border border-white/10 space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B202A] border border-white/10 flex items-center justify-center text-[#A8E6E8]">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="font-space text-[10px] uppercase tracking-wider text-[#A8E6E8] font-semibold">
                  Server Connection
                </span>
                <h3 className="font-inter font-semibold text-[15px] text-[#F4F3EF]">
                  Enable "My server" AI?
                </h3>
              </div>
            </div>

            <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
              Enabling this feature connects to your configured backend at <code className="text-[#F4F3EF]">{getApiBaseUrl() || 'localhost'}</code>. Here is exactly what is transmitted:
            </p>

            <ul className="text-[12px] font-inter text-[#F4F3EF] space-y-1.5 list-disc pl-4">
              <li><span className="text-[#A8E6E8]">Intention fields</span> when starting a walk for question generation.</li>
              <li><span className="text-[#A8E6E8]">Recorded audio</span> when you tap transcribe.</li>
              <li><span className="text-[#A8E6E8]">Transcript text</span> when you tap generate journal.</li>
            </ul>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#8E97A6] font-space text-[13px] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmServerConsent}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#A8E6E8] text-[#10131B] font-space font-semibold text-[13px] active:scale-95 transition-all shadow-[0_0_15px_rgba(168,230,232,0.2)]"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-[#10131B]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] glass-panel rounded-2xl p-5 border border-[#E27D7D]/30 space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E27D7D]/10 border border-[#E27D7D]/30 flex items-center justify-center text-[#E27D7D]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-space text-[10px] uppercase tracking-wider text-[#E27D7D] font-semibold">
                  Factory Reset
                </span>
                <h3 className="font-inter font-semibold text-[15px] text-[#F4F3EF]">
                  Wipe all local data?
                </h3>
              </div>
            </div>

            <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
              This will permanently delete all recorded voice notes, transcripts, generated journals, and local preferences from this device.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-space uppercase text-[#8E97A6]">
                Type <span className="text-[#E27D7D] font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteTypedText}
                onChange={(e) => setDeleteTypedText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-[#1B202A] border border-white/10 rounded-xl px-3 py-2 text-[14px] text-[#F4F3EF] font-mono outline-none focus:border-[#E27D7D]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#8E97A6] font-space text-[13px] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTypedText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#E27D7D] text-[#10131B] font-space font-semibold text-[13px] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(226,125,125,0.3)]"
              >
                {isDeleting ? 'Wiping…' : 'Clear Vault'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
