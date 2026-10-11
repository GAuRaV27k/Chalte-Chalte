import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play } from 'lucide-react';
import type { WalkIntention, WalkMood, WalkLanguage } from '../core/types';

interface IntentionSetupScreenProps {
  onBack: () => void;
  onStartWalk: (intention: WalkIntention) => void;
}

const TOPICS = [
  { id: 'Career & ambition', title: 'Career & ambition', desc: 'Drive & meaning' },
  { id: 'Happiness & peace', title: 'Happiness & peace', desc: 'Peace of mind' },
  { id: 'Relationships', title: 'Relationships', desc: 'Kinship & boundaries' },
  { id: 'Self-discovery', title: 'Self-discovery', desc: 'Inner observation' },
  { id: 'Fear & uncertainty', title: 'Fear & uncertainty', desc: 'Sitting with shadows' },
  { id: 'Creativity', title: 'Creativity', desc: 'Fresh vantage point' },
  { id: 'Gratitude', title: 'Gratitude', desc: 'Noticing what is' },
];

const MOODS: { id: WalkMood; label: string; icon: string }[] = [
  { id: 'reflective', label: 'Calm', icon: '◌' },
  { id: 'curious', label: 'Curious', icon: '◇' },
  { id: 'grounded', label: 'Overwhelmed', icon: '∿' },
  { id: 'seeking', label: 'Restless', icon: '⚡' },
];

export const IntentionSetupScreen: React.FC<IntentionSetupScreenProps> = ({
  onBack,
  onStartWalk,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('Self-discovery');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<WalkMood>('curious');
  const [notes, setNotes] = useState<string>('');
  const [language, setLanguage] = useState<WalkLanguage>('en');
  const [duration, setDuration] = useState<number>(10);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState<boolean>(false);

  // Load defaults from settings on mount per spec
  React.useEffect(() => {
    try {
      const savedDuration = localStorage.getItem('chalte_default_duration');
      if (savedDuration) {
        const d = parseInt(savedDuration, 10);
        if ([10, 20, 30].includes(d)) setDuration(d);
      }
      const savedLang = localStorage.getItem('chalte_default_language');
      if (savedLang === 'en' || savedLang === 'hi') {
        setLanguage(savedLang);
      }
    } catch {
      // ignore
    }
  }, []);

  const proceedStart = () => {
    const finalTopic = isCustom && customTopic.trim() ? customTopic.trim() : selectedTopic;
    onStartWalk({
      topic: finalTopic,
      mood: selectedMood,
      context: 'park',
      durationMinutes: duration,
      language: language,
    });
  };

  const handleStart = () => {
    // Before first walk starts, show short explainer if permission is default and not prompted
    const isNotifSupported = typeof window !== 'undefined' && 'Notification' in window;
    const hasPrompted = localStorage.getItem('chalte_notif_prompted');
    if (isNotifSupported && Notification.permission === 'default' && !hasPrompted) {
      setShowNotificationPrompt(true);
      return;
    }
    proceedStart();
  };

  const handleAllowNotifications = async () => {
    localStorage.setItem('chalte_notif_prompted', 'true');
    setShowNotificationPrompt(false);
    try {
      if ('Notification' in window) {
        await Notification.requestPermission();
      }
    } catch {
      // silent fallback
    }
    proceedStart();
  };

  const handleDenyNotifications = () => {
    localStorage.setItem('chalte_notif_prompted', 'true');
    setShowNotificationPrompt(false);
    proceedStart();
  };

  const currentTopicDisplay = isCustom && customTopic ? customTopic : selectedTopic;

  return (
    <div className="flex flex-col min-h-full pb-28 px-5 pt-3">
      {/* Top App Bar */}
      <header className="flex justify-between items-center w-full py-3 shrink-0">
        <button
          onClick={onBack}
          aria-label="Back"
          className="p-2 -ml-2 rounded-full text-[#8E97A6] hover:text-[#A8E6E8] active:scale-95 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-space text-[18px] font-bold text-[#F4F3EF] tracking-tight">
          Before you wander
        </h1>
        <div className="w-8" />
      </header>

      {/* Main Form Content */}
      <motion.div
        layoutId="walk-card-container"
        className="space-y-5 pt-2 flex-1"
      >
        <div>
          <p className="text-[14px] font-inter text-[#A0A9B8]">
            A little context helps your questions feel more personal.
          </p>
        </div>

        {/* Inquiry Domain Grid */}
        <div className="space-y-2.5">
          <label className="text-[12px] font-space font-semibold text-[#F4F3EF] tracking-wide block uppercase">
            Select an inquiry domain
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {TOPICS.map((t) => {
              const active = !isCustom && selectedTopic === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(t.id);
                    setIsCustom(false);
                  }}
                  className={`p-3 rounded-xl text-left transition-all active:scale-95 ${
                    active
                      ? 'bg-[#232A38]/90 border border-[#A8E6E8] shadow-[0_0_15px_rgba(168,230,232,0.15)]'
                      : 'glass-panel hover:border-[#A8E6E8]/40'
                  }`}
                >
                  <span
                    className={`font-inter font-semibold text-[13px] block ${
                      active ? 'text-[#A8E6E8]' : 'text-[#F4F3EF]'
                    }`}
                  >
                    {t.title}
                  </span>
                  <span className="text-[11px] font-inter text-[#8E97A6]">
                    {t.desc}
                  </span>
                </button>
              );
            })}

            {/* Custom Option */}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`p-3 rounded-xl text-left transition-all active:scale-95 ${
                isCustom
                  ? 'bg-[#232A38]/90 border border-[#A8E6E8]'
                  : 'glass-panel hover:border-[#A8E6E8]/40'
              }`}
            >
              <span
                className={`font-inter font-semibold text-[13px] block ${
                  isCustom ? 'text-[#A8E6E8]' : 'text-[#F4F3EF]'
                }`}
              >
                Something else
              </span>
              <span className="text-[11px] font-inter text-[#8E97A6]">
                Write your theme
              </span>
            </button>
          </div>

          {/* Reveal custom topic input if active */}
          {isCustom && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-1"
            >
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g., Making peace with an unexpected ending..."
                className="w-full bg-[#1B202A] border border-white/15 focus:border-[#A8E6E8] rounded-xl px-3.5 py-2.5 text-[13px] text-[#F4F3EF] placeholder-[#5C6473] outline-none"
              />
            </motion.div>
          )}
        </div>

        {/* State of Mind (Mood Pills) */}
        <div className="space-y-2">
          <label className="text-[12px] font-space font-semibold text-[#F4F3EF] tracking-wide block uppercase">
            Current state of mind
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {MOODS.map((m) => {
              const active = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-inter whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'bg-[#B9B4E8]/20 border border-[#B9B4E8] text-[#B9B4E8] font-semibold'
                      : 'border border-white/10 text-[#8E97A6] hover:border-white/25'
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional thoughts textarea */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-[12px] font-space font-semibold text-[#F4F3EF] tracking-wide uppercase">
              On your mind today (optional)
            </label>
            <span className="text-[10px] font-inter text-[#8E97A6]">
              Private · Stored on-device
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="A recurring doubt, a recent conversation, or a question you've avoided..."
            className="w-full bg-[#1B202A] border border-white/15 focus:border-[#A8E6E8] rounded-xl p-3 text-[13px] text-[#F4F3EF] placeholder-[#5C6473] outline-none resize-none"
          />
        </div>

        {/* Language & Duration controls */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Spoken audio language */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-space font-semibold text-[#F4F3EF] tracking-wider uppercase">
              Spoken audio
            </label>
            <div className="glass-panel rounded-xl p-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 py-1 text-center rounded-lg text-[12px] font-inter transition-all ${
                  language === 'en'
                    ? 'bg-[#A8E6E8] text-[#10131B] font-semibold'
                    : 'text-[#8E97A6]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`flex-1 py-1 text-center rounded-lg text-[12px] font-inter transition-all ${
                  language === 'hi'
                    ? 'bg-[#A8E6E8] text-[#10131B] font-semibold'
                    : 'text-[#8E97A6]'
                }`}
              >
                Hinglish
              </button>
            </div>
          </div>

          {/* Pace & Length */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-space font-semibold text-[#F4F3EF] tracking-wider uppercase">
              Duration
            </label>
            <div className="glass-panel rounded-xl p-1 flex items-center justify-between text-[12px]">
              {[10, 20, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-1 rounded-lg text-center font-inter transition-all ${
                    duration === d
                      ? 'bg-[#232A38]/90 text-[#A8E6E8] font-semibold'
                      : 'text-[#8E97A6]'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sticky Bottom Summary Pill & CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto p-4 bg-[#10131B]/95 backdrop-blur-xl border-t border-white/10 space-y-2 z-30">
        <div className="flex items-center justify-center">
          <span className="px-3.5 py-1 rounded-full bg-[#1B202A] text-[11px] font-inter font-medium text-[#A8E6E8] border border-white/10">
            {duration} min · {language === 'hi' ? 'Hinglish' : 'English'} · {currentTopicDisplay}
          </span>
        </div>
        <button
          onClick={handleStart}
          className="w-full py-3.5 px-6 rounded-full bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[15px] flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-lg"
        >
          <span>Start my walk</span>
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Notification Permission Explainer Modal */}
      {showNotificationPrompt && (
        <div className="fixed inset-0 z-50 bg-[#10131B]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[360px] glass-panel rounded-2xl p-5 border border-white/10 space-y-4 text-left shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B202A] border border-white/10 flex items-center justify-center text-[#A8E6E8]">
                <span className="text-[18px]">🔔</span>
              </div>
              <div>
                <span className="font-space text-[10px] uppercase tracking-wider text-[#8E97A6] font-semibold">
                  Quiet reminder
                </span>
                <h3 className="font-inter font-semibold text-[15px] text-[#F4F3EF]">
                  Notification permission alert
                </h3>
              </div>
            </div>

            <p className="font-inter text-[13px] text-[#8E97A6] leading-relaxed">
              Allow quiet background reminders when your walk ends. We only notify you when your walk finishes while the app is hidden.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDenyNotifications}
                className="flex-1 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#8E97A6] hover:text-[#F4F3EF] font-space text-[13px] active:scale-95 transition-all"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={handleAllowNotifications}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[13px] active:scale-95 transition-all shadow-[0_0_15px_rgba(168,230,232,0.2)]"
              >
                Allow
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
