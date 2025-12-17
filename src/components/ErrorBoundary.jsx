import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ErrorBoundary: Catches React errors and displays user-friendly error UI
 * Prevents entire app from crashing on component errors
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px 20px',
                    background: '#fee2e2',
                    border: '2px solid #dc2626',
                    borderRadius: 8,
                    maxWidth: 600,
                    margin: '40px auto',
                    color: '#991b1b'
                }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 15,
                        marginBottom: 15
                    }}
                    >
                        <AlertTriangle size={32} />
                        <div>
                            <h2 style={{ margin: 0 }}>Something Went Wrong</h2>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                                An error occurred while rendering the application.
                            </p>
                        </div>
                    </div>
                    <details style={{
                        marginTop: 20,
                        padding: 15,
                        background: 'rgba(220, 38, 38, 0.1)',
                        borderRadius: 4,
                        cursor: 'pointer'
                    }}
                    >
                        <summary style={{ fontWeight: 'bold', marginBottom: 10 }}>
                            Error Details (Click to Expand)
                        </summary>
                        <pre style={{
                            margin: 0,
                            overflow: 'auto',
                            fontSize: '0.85em',
                            fontFamily: 'monospace'
                        }}
                        >
                            {this.state.error?.toString()}
                        </pre>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: 20,
                            padding: '10px 20px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;