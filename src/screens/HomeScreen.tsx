import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, ArrowRight, Sparkles, Compass } from 'lucide-react';
import type { JournalEntry } from '../core/types';

interface HomeScreenProps {
  onStartSetup: () => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
  recentJournals: JournalEntry[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSetup,
  onOpenJournal,
  onOpenSettings,
  recentJournals,
}) => {
  return (
    <div className="flex flex-col min-h-full pb-24 px-5 pt-3">
      {/* Top App Bar */}
      <header className="flex justify-between items-center w-full py-3 shrink-0">
        <div className="flex flex-col">
          <h1 className="font-space text-[26px] font-bold text-[#F4F3EF] tracking-tight">
            Chalte-Chalte
          </h1>
          <span className="text-[10px] font-space text-[#8E97A6] tracking-[0.2em] uppercase font-semibold -mt-0.5">
            The Walking Philosopher
          </span>
        </div>
        <button
          aria-label="Settings"
          onClick={onOpenSettings}
          className="p-2 rounded-full text-[#A8E6E8] hover:bg-[#A8E6E8]/10 transition-colors active:scale-95"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <div className="space-y-6 pt-3 flex-1 flex flex-col justify-start">
        {/* Poetic Hero Statement */}
        <div className="space-y-1.5">
          <h2 className="font-instrument text-[32px] leading-[1.18] text-[#F4F3EF] italic">
            Some thoughts need a little space.
          </h2>
          <p className="font-inter text-[14px] text-[#A0A9B8] leading-relaxed">
            Step away from the noise. Take a walk. Find your own answers.
          </p>
        </div>

        {/* Atmospheric Glass Visual */}
        <div className="relative w-full h-36 rounded-2xl overflow-hidden glass-panel flex items-center justify-center p-4">
          <div className="absolute w-44 h-44 rounded-full bg-[#A8E6E8]/10 blur-2xl"></div>
          <div className="absolute w-28 h-28 rounded-full bg-[#B9B4E8]/15 blur-xl"></div>
          <div className="relative text-center z-10 space-y-1.5 flex flex-col items-center">
            <Compass className="w-8 h-8 text-[#A8E6E8] opacity-85" />
            <p className="text-[13px] font-inter text-[#8E97A6] italic">
              Solitude in motion · Walking without hurry
            </p>
          </div>
        </div>

        {/* "Begin a walk" Large Glass Card */}
        <motion.div
          layoutId="walk-card-container"
          className="glass-panel rounded-2xl p-5 space-y-4 border border-white/10 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-space text-[#A8E6E8] tracking-widest uppercase font-semibold">
                Guided Solitude
              </span>
              <h3 className="font-space text-[22px] font-bold text-[#F4F3EF] mt-0.5">
                Begin a walk
              </h3>
              <p className="text-[14px] font-inter text-[#A0A9B8] mt-1 leading-snug">
                A few questions. A little distance. A clearer mind.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#232A38]/85 border border-white/10 flex items-center justify-center text-[#A8E6E8] shrink-0">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <button
            onClick={onStartSetup}
            className="w-full py-3.5 px-6 rounded-full bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[15px] flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md"
          >
            <span>Prepare my walk</span>
            <Compass className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Recent Reflections Section */}
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-space font-semibold text-[#8E97A6] uppercase tracking-wider">
              Your recent reflections
            </h4>
            <button
              onClick={onOpenJournal}
              className="text-[13px] font-inter text-[#A8E6E8] hover:underline"
            >
              View journal
            </button>
          </div>

          {recentJournals.length === 0 ? (
            /* Empty State Frame */
            <div className="rounded-xl border border-dashed border-white/15 p-5 text-center bg-[#1B202A]/40 space-y-2">
              <div className="flex justify-center text-[#5C6473]">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-[13px] font-inter text-[#A0A9B8]">
                No walks yet. Your first reflection starts here.
              </p>
              <button
                onClick={onStartSetup}
                className="text-[13px] font-inter font-medium text-[#A8E6E8] pt-1 inline-block hover:underline"
              >
                Start your first prompt →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJournals.slice(0, 2).map((entry) => (
                <div
                  key={entry.id}
                  onClick={onOpenJournal}
                  className="glass-panel p-3.5 rounded-xl border border-white/10 hover:border-[#A8E6E8]/40 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex justify-between items-center text-[11px] text-[#8E97A6]">
                    <span className="font-space uppercase tracking-wider text-[#A8E6E8] font-medium">
                      {entry.topic}
                    </span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="font-instrument text-[18px] text-[#F4F3EF] italic line-clamp-1">
                    "{entry.quote.text}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
