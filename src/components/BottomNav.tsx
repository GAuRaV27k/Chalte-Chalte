import React from 'react';
import { Compass, BookOpen, Settings } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'journal' | 'settings';
  onSelectTab: (tab: 'home' | 'journal' | 'settings') => void;
  hide?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, hide }) => {
  if (hide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto z-40 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
      <div className="glass-panel rounded-full flex items-center justify-around py-2 px-3 shadow-2xl backdrop-blur-xl border border-white/10 bg-[#161B26]/85">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 active:scale-95 ${
            currentTab === 'home'
              ? 'text-[#A8E6E8] bg-[#A8E6E8]/10'
              : 'text-[#8E97A6] hover:text-[#F4F3EF]'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-space font-medium tracking-wide">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('journal')}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 active:scale-95 ${
            currentTab === 'journal'
              ? 'text-[#A8E6E8] bg-[#A8E6E8]/10'
              : 'text-[#8E97A6] hover:text-[#F4F3EF]'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-space font-medium tracking-wide">My Journal</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 active:scale-95 ${
            currentTab === 'settings'
              ? 'text-[#A8E6E8] bg-[#A8E6E8]/10'
              : 'text-[#8E97A6] hover:text-[#F4F3EF]'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-space font-medium tracking-wide">Settings</span>
        </button>
      </div>
    </nav>
  );
};

