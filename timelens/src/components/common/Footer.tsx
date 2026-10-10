import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="frost-glass border-t border-white/80 relative z-10 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Copyright / Telemetry Text */}
        <div className="text-xs font-body-muted text-frost-slate text-center md:text-left">
          TimeLens AI Archival Initiative © 2025. Local execution supported via open-weight diffusion synthesis.
        </div>

        {/* Footer Navigation Links */}
        <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-6">
          <a
            className="text-xs font-label-caps text-frost-slate hover:text-glacial-cyan tracking-wider transition-colors font-medium"
            href="#weights"
            onClick={(e) => e.preventDefault()}
          >
            Model Weights
          </a>
          <a
            className="text-xs font-label-caps text-frost-slate hover:text-glacial-cyan tracking-wider transition-colors font-medium"
            href="#field-notes"
            onClick={(e) => e.preventDefault()}
          >
            Field Notes
          </a>
          <a
            className="text-xs font-label-caps text-frost-slate hover:text-glacial-cyan tracking-wider transition-colors font-medium"
            href="#ethical-ai"
            onClick={(e) => e.preventDefault()}
          >
            Ethical AI Charter
          </a>
          <a
            className="text-xs font-label-caps text-frost-slate hover:text-glacial-cyan tracking-wider transition-colors font-medium"
            href="#documentation"
            onClick={(e) => e.preventDefault()}
          >
            Documentation
          </a>
          <a
            className="text-xs font-label-caps text-frost-slate hover:text-glacial-cyan tracking-wider transition-colors font-medium"
            href="#telemetry"
            onClick={(e) => e.preventDefault()}
          >
            Telemetry
          </a>
        </div>
      </div>
    </footer>
  );
};
