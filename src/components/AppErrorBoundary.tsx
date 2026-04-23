import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorFallback from '@/components/ErrorFallback';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const details =
        this.state.error?.message ??
        'The app hit an unexpected error while rendering. Please reload and verify your Firebase configuration.';
      return (
        <ErrorFallback
          title="Something went wrong"
          message={details}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
