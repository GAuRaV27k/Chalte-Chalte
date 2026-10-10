import React from 'react';
import { motion } from 'motion/react';
import type { ScreenId } from '../../types';

interface TopNavBarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenTerminal?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentScreen,
  onNavigate,
  onOpenTerminal,
}) => {
  return (
    <header className="frost-glass sticky top-0 z-50 transition-all duration-300 border-b border-white/80 shadow-[0_4px_24px_rgba(2,132,199,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-between h-16 md:h-20">
        {/* Brand Anchor */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={() => onNavigate('landing')}
            className="text-lg sm:text-xl font-headline font-semibold tracking-tight text-polar-navy flex items-center gap-2.5 group cursor-pointer text-left"
            title="TimeLens AI — Home"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-glacial-cyan to-sky-300 inline-block shadow-[0_0_12px_rgba(2,132,199,0.6)] group-hover:scale-125 transition-transform duration-300 shrink-0" />
            <span className="tracking-tight text-polar-navy">TimeLens AI</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-xs font-code-telemetry font-medium text-frost-slate pl-5 border-l border-sky-200/60">
            <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]" />
            <span>RETICLE ENGINE 2.4.0</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <button
            onClick={() => onNavigate('studio')}
            className={`text-xs font-label-caps uppercase tracking-widest cursor-pointer transition-all pb-1 ${
              currentScreen === 'studio'
                ? 'text-glacial-cyan font-bold border-b-2 border-glacial-cyan'
                : 'text-frost-slate hover:text-polar-navy font-semibold'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => onNavigate('era')}
            className={`text-xs font-label-caps uppercase tracking-widest cursor-pointer transition-all pb-1 ${
              currentScreen === 'era'
                ? 'text-glacial-cyan font-bold border-b-2 border-glacial-cyan'
                : 'text-frost-slate hover:text-polar-navy font-semibold'
            }`}
          >
            Epochs
          </button>
          <button
            onClick={() => onNavigate('results')}
            className={`text-xs font-label-caps uppercase tracking-widest cursor-pointer transition-all pb-1 ${
              currentScreen === 'results'
                ? 'text-glacial-cyan font-bold border-b-2 border-glacial-cyan'
                : 'text-frost-slate hover:text-polar-navy font-semibold'
            }`}
          >
            Results
          </button>
          <button
            onClick={() => onNavigate('landing')}
            className="text-frost-slate hover:text-polar-navy tracking-widest uppercase transition-colors text-xs font-label-caps font-medium cursor-pointer"
          >
            Archives
          </button>
        </nav>

        {/* Trailing Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 text-frost-slate border-r border-sky-200/70 pr-3">
            <button
              onClick={() => onNavigate('studio')}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/80 hover:text-glacial-cyan transition-all shadow-sm border border-white/60 text-frost-slate"
              title="Spatial Reticle Focus"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">filter_center_focus</span>
            </button>
            <button
              onClick={onOpenTerminal}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/80 hover:text-glacial-cyan transition-all shadow-sm border border-white/60 text-frost-slate"
              title="Inference Terminal Telemetry"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">terminal</span>
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-code-telemetry hover:text-polar-navy transition-colors ml-1 font-medium text-frost-slate hidden lg:inline"
            >
              GitHub
            </a>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('studio')}
            className="bg-gradient-to-r from-glacial-cyan to-sky-500 text-white font-semibold text-xs font-label-caps px-4 sm:px-6 py-2.5 rounded-full hover:shadow-[0_4px_20px_rgba(2,132,199,0.35)] transition-all tracking-wider uppercase inline-flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm hidden sm:inline">auto_awesome</span>
            <span>Launch Studio</span>
          </motion.button>

          {/* Naturalist Researcher Profile Avatar */}
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(2,132,199,0.15)] overflow-hidden flex-shrink-0 bg-slate-100 ring-1 ring-sky-200"
            title="Naturalist Researcher Profile"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuARJHE7orEN9NfiPPERQ3l3Zz8LvdEto2EGdlJMrh9L3jmMYmIXzjSq23Rd2aRXLB23DbURdnw20hz08TrcRonbLAyE3ZopZgTJCIMpU9pHySMubPiGM0u-hQlcU5vPBeM7H5AMZfMmsg3lhWmsENp6ZaYcsjQ9NkbzUDRYeC7vBebwMXV7Sz2mKilyD-mAn2V-A41LQ5qGkAIaybp31i_4zpNOa10ktik3TRuTpfpwIhEQk8T-BuAfqQ"
              alt="Naturalist researcher avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
