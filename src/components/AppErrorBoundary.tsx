import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorFallback from '@/components/ErrorFallback';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title="Something went wrong"
          message="The app hit an unexpected error while rendering. Please reload and verify your Firebase configuration."
        />
      );
    }

    return this.props.children;
  }
}
