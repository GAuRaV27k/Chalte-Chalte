import React, { useState } from 'react';
import { Shield, Trash2, Mic, Bell, Smartphone, Check, Volume2 } from 'lucide-react';

interface SettingsScreenProps {
  onClearAll: () => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClearAll }) => {
  const [clearing, setClearing] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);
  const [duration, setDuration] = useState<'10' | '20' | '30'>('20');
  const [language, setLanguage] = useState<'English' | 'Hinglish'>('English');
  const [voice, setVoice] = useState<'Vani' | 'Kabir'>('Vani');
  const [pace, setPace] = useState<number>(1.0);
  const [haptic, setHaptic] = useState<boolean>(true);

  const handleClear = async () => {
    if (confirm('Are you sure you want to permanently delete all local data?')) {
      setClearing(true);
      await onClearAll();
      setClearing(false);
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 3000);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-28 px-5 pt-3">
      {/* Header matching Stitch bd0a1ef9... */}
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

      {/* Subtle Philosophical Anchor Quote from Design */}
      <div className="pt-2 pb-3">
        <p className="font-instrument text-[22px] italic text-[#F4F3EF]/90 leading-tight">
          “Solitude gives space for thoughts to settle like clear water.”
        </p>
        <span className="font-space text-[10px] uppercase tracking-widest text-[#5C6473] mt-1 block font-semibold">
          Quiet Calibration
        </span>
      </div>

      <div className="space-y-5 flex-1">
        {/* 1. WALKING PREFERENCES CARD */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#A8E6E8]">
              <Volume2 className="w-4 h-4" />
            </span>
            <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
              Walking Preferences
            </h2>
          </div>

          {/* Default Walk Duration */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-inter font-semibold text-[#F4F3EF]">
              Default Walk Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDuration('10')}
                className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center min-h-[50px] transition-all active:scale-95 ${
                  duration === '10'
                    ? 'border-[#A8E6E8]/60 bg-[#232A38]/90 text-[#A8E6E8]'
                    : 'border-white/10 bg-[#1B202A]/50 text-[#8E97A6]'
                }`}
              >
                <span className="font-inter font-semibold text-[13px] text-[#F4F3EF]">10 min</span>
                <span className="text-[10px] font-inter text-[#5C6473]">Quick start</span>
              </button>
              <button
                type="button"
                onClick={() => setDuration('20')}
                className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center min-h-[50px] transition-all active:scale-95 ${
                  duration === '20'
                    ? 'border-[#A8E6E8]/60 bg-[#232A38]/90 text-[#A8E6E8]'
                    : 'border-white/10 bg-[#1B202A]/50 text-[#8E97A6]'
                }`}
              >
                <span className="font-inter font-semibold text-[13px] text-[#A8E6E8]">20 min</span>
                <span className="text-[10px] font-inter text-[#A8E6E8]/80">Recommended</span>
              </button>
              <button
                type="button"
                onClick={() => setDuration('30')}
                className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center min-h-[50px] transition-all active:scale-95 ${
                  duration === '30'
                    ? 'border-[#A8E6E8]/60 bg-[#232A38]/90 text-[#A8E6E8]'
                    : 'border-white/10 bg-[#1B202A]/50 text-[#8E97A6]'
                }`}
              >
                <span className="font-inter font-semibold text-[13px] text-[#F4F3EF]">30 min</span>
                <span className="text-[10px] font-inter text-[#5C6473]">Deep reflection</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Spoken Reflection Language */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[12px]">
              <label className="font-inter font-semibold text-[#F4F3EF]">
                Spoken Reflection Language
              </label>
              <span className="text-[#8E97A6] text-[11px]">Local dialect</span>
            </div>
            <div className="grid grid-cols-2 p-1 bg-[#1B202A] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setLanguage('English')}
                className={`py-1.5 px-3 rounded-lg text-[12px] font-inter font-medium flex items-center justify-center gap-1.5 transition-all ${
                  language === 'English'
                    ? 'bg-[#232A38] text-[#A8E6E8] border border-[#A8E6E8]/30 shadow-sm'
                    : 'text-[#8E97A6]'
                }`}
              >
                {language === 'English' && <Check className="w-3.5 h-3.5" />}
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('Hinglish')}
                className={`py-1.5 px-3 rounded-lg text-[12px] font-inter font-medium flex items-center justify-center gap-1.5 transition-all ${
                  language === 'Hinglish'
                    ? 'bg-[#232A38] text-[#A8E6E8] border border-[#A8E6E8]/30 shadow-sm'
                    : 'text-[#8E97A6]'
                }`}
              >
                {language === 'Hinglish' && <Check className="w-3.5 h-3.5" />}
                Hinglish
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Voice Persona — Vani / Kabir (from Stitch bd0a1ef9 lines 266–289) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[12px]">
              <label className="font-inter font-semibold text-[#F4F3EF]">
                Voice Persona
              </label>
              <span className="text-[#8E97A6] text-[11px]">Spoken questions</span>
            </div>
            <div className="grid grid-cols-2 p-1 bg-[#1B202A] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setVoice('Vani')}
                className={`py-1.5 px-3 rounded-lg text-[12px] font-inter font-medium flex items-center justify-center gap-1.5 transition-all ${
                  voice === 'Vani'
                    ? 'bg-[#232A38] text-[#A8E6E8] border border-[#A8E6E8]/30 shadow-sm'
                    : 'text-[#8E97A6]'
                }`}
              >
                {voice === 'Vani' && <Check className="w-3.5 h-3.5" />}
                Vani (F)
              </button>
              <button
                type="button"
                onClick={() => setVoice('Kabir')}
                className={`py-1.5 px-3 rounded-lg text-[12px] font-inter font-medium flex items-center justify-center gap-1.5 transition-all ${
                  voice === 'Kabir'
                    ? 'bg-[#232A38] text-[#A8E6E8] border border-[#A8E6E8]/30 shadow-sm'
                    : 'text-[#8E97A6]'
                }`}
              >
                {voice === 'Kabir' && <Check className="w-3.5 h-3.5" />}
                Kabir (M)
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Haptic Feedback toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="font-inter font-semibold text-[#F4F3EF] text-[13px]">Haptic Feedback</p>
              <p className="font-inter text-[11px] text-[#8E97A6]">Gentle vibration on question delivery</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={haptic}
              onClick={() => setHaptic(h => !h)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 border ${
                haptic
                  ? 'bg-[#A8E6E8]/20 border-[#A8E6E8]/40'
                  : 'bg-[#1B202A] border-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${
                  haptic
                    ? 'translate-x-5 bg-[#A8E6E8]'
                    : 'translate-x-0 bg-[#5C6473]'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Voice speaking pace */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[12px]">
              <label className="font-inter font-semibold text-[#F4F3EF]">Speaking Pace</label>
              <span className="text-[11px] text-[#A8E6E8] font-mono bg-[#1B202A] px-2 py-0.5 rounded-full border border-white/10">
                {pace.toFixed(1)}x (Gentle unhurried)
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.1"
              value={pace}
              onChange={(e) => setPace(parseFloat(e.target.value))}
              className="w-full cursor-pointer h-1.5 bg-[#1B202A] rounded-lg appearance-none accent-[#A8E6E8]"
            />
            <div className="flex justify-between text-[11px] font-inter text-[#5C6473]">
              <span>0.8x Slow</span>
              <span>1.0x Steady</span>
              <span>1.2x Brisk</span>
            </div>
          </div>
        </section>

        {/* 2. PRIVACY & LOCAL STORAGE CARD */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#B9B4E8]">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
              Privacy & Local Storage
            </h2>
          </div>

          {/* Trust Banner from Design */}
          <div className="rounded-xl p-3 bg-[#1B202A]/80 border border-[#A8E6E8]/20 space-y-1">
            <h3 className="font-inter font-semibold text-[13px] text-[#A8E6E8]">
              Local-First Architecture · 100% On-Device
            </h3>
            <p className="font-inter text-[12px] text-[#8E97A6] leading-relaxed">
              All voice recordings, transcripts, and synthesized reflections are saved strictly in your device's local sandbox. Nothing is transmitted to external servers.
            </p>
          </div>

          {/* Delete All Local Data Destructive Action */}
          <div className="rounded-xl p-3 border border-[#E27D7D]/20 bg-[#E27D7D]/5 space-y-2">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="w-full py-2.5 px-4 rounded-full bg-[#E27D7D]/10 hover:bg-[#E27D7D]/20 border border-[#E27D7D]/40 text-[#E27D7D] font-space font-semibold text-[13px] flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>{clearing ? 'Clearing...' : 'Delete all local data'}</span>
            </button>
            <p className="text-[11px] text-[#E27D7D]/80 text-center leading-tight">
              Irreversibly wipes all audio and journals from this device.
            </p>
            {clearedNotice && (
              <p className="text-[12px] text-[#A8E6E8] text-center pt-1">
                ✓ All local storage cleared.
              </p>
            )}
          </div>
        </section>

        {/* 3. HARDWARE & OS PERMISSIONS CARD */}
        <section className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-[#1B202A] flex items-center justify-center text-[#A8E6E8]">
              <Smartphone className="w-4 h-4" />
            </span>
            <h2 className="font-space text-[16px] text-[#F4F3EF] font-bold tracking-tight">
              Hardware & OS Permissions
            </h2>
          </div>

          <div className="divide-y divide-white/5 text-[13px]">
            <div className="py-2.5 flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                <Mic className="w-4 h-4 text-[#8E97A6] mt-0.5" />
                <div>
                  <p className="font-inter font-semibold text-[#F4F3EF]">Microphone</p>
                  <p className="text-[11px] text-[#8E97A6]">
                    Required for spoken thoughts during walking intervals
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-inter bg-[#A8E6E8]/10 text-[#A8E6E8] border border-[#A8E6E8]/30">
                Granted
              </span>
            </div>

            <div className="py-2.5 flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                <Bell className="w-4 h-4 text-[#8E97A6] mt-0.5" />
                <div>
                  <p className="font-inter font-semibold text-[#F4F3EF]">Notifications</p>
                  <p className="text-[11px] text-[#8E97A6]">
                    Notifies when walk completes and questions ready
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-inter bg-[#A8E6E8]/10 text-[#A8E6E8] border border-[#A8E6E8]/30">
                Granted
              </span>
            </div>
          </div>
        </section>

        {/* 4. ABOUT & VERSION CARD */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-space tracking-widest text-[#A8E6E8] uppercase font-semibold">
              Solitary Companion
            </span>
            <h3 className="font-space text-[16px] text-[#F4F3EF] font-bold">
              Chalte-Chalte v1.2.0
            </h3>
            <p className="font-instrument text-[14px] italic text-[#B9B4E8]">
              The Walking Philosopher
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
