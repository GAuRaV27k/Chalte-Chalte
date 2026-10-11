import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, CheckCircle2, AlertOctagon } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  undoAction?: () => void;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showQuotaError: (retryCallback?: () => void) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  showQuotaError: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaRetryCb, setQuotaRetryCb] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = toast.durationMs ?? 3500;
    const newToast: ToastMessage = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const showQuotaError = (retryCallback?: () => void) => {
    setQuotaRetryCb(() => retryCallback || null);
    setQuotaModalOpen(true);
  };

  return (
    <ToastContext.Provider value={{ showToast, showQuotaError }}>
      {children}

      {/* 1. Offline Top Banner matching Stitch System States */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 max-w-[440px] mx-auto px-4 pt-2"
          >
            <div className="bg-[#1B202A]/95 border border-[#8E97A6]/30 backdrop-blur-md rounded-xl p-3 flex items-center justify-between text-left shadow-lg">
              <div className="flex items-center gap-2.5">
                <WifiOff className="w-4 h-4 text-[#A0A9B8]" />
                <span className="font-inter text-[12px] text-[#F4F3EF]">
                  You are offline. Audio is safe locally. Server AI is paused.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Toasts List */}
      <div className="fixed top-4 left-0 right-0 z-50 max-w-[390px] mx-auto px-4 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto bg-[#1B202A]/95 border border-white/10 backdrop-blur-md rounded-xl p-3.5 flex items-center justify-between shadow-2xl text-left"
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#A8E6E8] shrink-0" />
                ) : toast.type === 'error' ? (
                  <AlertOctagon className="w-4 h-4 text-[#E27D7D] shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#B9B4E8] shrink-0" />
                )}
                <div>
                  {toast.title && (
                    <div className="font-space text-[11px] font-semibold text-[#F4F3EF] uppercase tracking-wider">
                      {toast.title}
                    </div>
                  )}
                  <p className="font-inter text-[12px] text-[#8E97A6]">{toast.message}</p>
                </div>
              </div>

              {toast.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.undoAction?.();
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="font-space text-[11px] uppercase tracking-wider text-[#A8E6E8] ml-3 hover:underline"
                >
                  UNDO
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. QuotaExceededError Dialog */}
      {quotaModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#10131B]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] glass-panel rounded-2xl p-5 border border-[#E27D7D]/30 space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E27D7D]/10 border border-[#E27D7D]/30 flex items-center justify-center text-[#E27D7D]">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-space text-[10px] uppercase tracking-wider text-[#E27D7D] font-semibold">
                  Storage Quota Full
                </span>
                <h3 className="font-inter font-semibold text-[15px] text-[#F4F3EF]">
                  Device Storage Limit Exceeded
                </h3>
              </div>
            </div>

            <p className="font-inter text-[13px] text-[#8E97A6] leading-relaxed">
              Your device has run out of space for IndexedDB. Your current walk session and voice reflections are safely held in memory. Please free device storage or delete old reflections in Settings.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuotaModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#8E97A6] font-space text-[13px] active:scale-95 transition-all"
              >
                Dismiss
              </button>
              {quotaRetryCb && (
                <button
                  type="button"
                  onClick={() => {
                    setQuotaModalOpen(false);
                    quotaRetryCb();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-full bg-[#A8E6E8] text-[#10131B] font-space font-semibold text-[13px] active:scale-95 transition-all shadow-[0_0_15px_rgba(168,230,232,0.2)]"
                >
                  Retry Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
