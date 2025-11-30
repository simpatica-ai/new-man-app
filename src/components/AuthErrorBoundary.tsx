'use client';

import React, { Component, ReactNode } from 'react';
import { handleAuthError } from '@/lib/authUtils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
    
    // Check if this is an auth-related error
    if (error.message?.includes('refresh') || 
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('Refresh Token Not Found')) {
      
      const handled = await handleAuthError(error);
      if (handled) {
        // Reset the error boundary state since we handled the error
        this.setState({ hasError: false, error: undefined });
        return;
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-lg border border-stone-200/60 shadow-gentle max-w-md">
            <h2 className="text-xl font-semibold text-stone-800 mb-4">
              Something went wrong
            </h2>
            <p className="text-stone-600 mb-6">
              We encountered an issue with your session. Please try refreshing the page or logging in again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;