import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircleIcon, RefreshCwIcon } from './Icons';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Catches render/lifecycle errors in React component tree,
 * preventing blank white screens and rendering an accessible, modern cyber-dark fallback.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const { error } = this.state;

      if (typeof fallback === 'function') {
        return fallback(error || new Error('Unknown error'), this.reset);
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div className="error-boundary-fallback" role="alert">
          <div className="error-boundary-icon" aria-hidden="true">
            <AlertCircleIcon size={32} />
          </div>
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-message">
            {error?.message || 'An unexpected rendering error occurred in the extension.'}
          </p>
          <button
            type="button"
            className="error-boundary-btn"
            onClick={this.reset}
          >
            <RefreshCwIcon size={14} aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
