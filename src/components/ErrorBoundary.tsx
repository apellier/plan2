'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
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

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: undefined });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-[200]">
                    <div className="bg-white border-2 border-black shadow-[var(--shadow-hard)] rounded-xl p-8 max-w-md text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>

                        <p className="text-gray-600 text-sm mb-4">
                            An unexpected error occurred. Your work has been preserved.
                        </p>

                        {this.state.error && (
                            <div className="bg-gray-100 rounded-lg p-3 mb-4 text-left">
                                <code className="text-xs text-red-600 break-all">
                                    {this.state.error.message}
                                </code>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-4 py-2 text-sm font-medium bg-neo-yellow border-2 border-black rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={14} />
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
