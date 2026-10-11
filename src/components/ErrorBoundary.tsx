import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught error in ${this.props.fallbackName || 'component'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-full flex flex-col items-center justify-center p-6 text-center select-none bg-[#10131B]">
          <div className="w-16 h-16 rounded-full bg-[#1B202A] border border-[#E27D7D]/30 flex items-center justify-center text-[#E27D7D] mb-4 shadow-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <span className="font-space text-[10px] uppercase tracking-widest text-[#8E97A6] font-semibold">
            System Notice
          </span>
          <h2 className="font-instrument text-[24px] italic text-[#F4F3EF] mt-1 mb-2">
            A quiet pause in the flow
          </h2>
          <p className="font-inter text-[13px] text-[#8E97A6] max-w-xs leading-relaxed mb-6">
            Something unexpected occurred. Your local walk records and voice memos remain intact on this device.
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-full bg-[#A8E6E8] hover:bg-[#BCEFF0] text-[#10131B] font-space font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(168,230,232,0.2)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recover & continue</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#8E97A6] hover:text-[#F4F3EF] font-space text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Return to home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
