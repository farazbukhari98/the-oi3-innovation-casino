'use client';

import React, { Component, ReactNode } from 'react';
import { ErrorCard } from './ErrorCard';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-casino-dark-bg flex items-center justify-center p-4">
          <ErrorCard
            title="Something went wrong"
            message={this.state.error?.message || 'An unexpected error occurred.'}
            action={{
              label: 'Try Again',
              onClick: this.handleReset,
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
