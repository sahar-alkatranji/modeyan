import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MODEYA Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FBF6E6',
            fontFamily: 'Montserrat, sans-serif',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: '1rem', color: '#1A1A1A' }}>
            MODEYA
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.7' }}>
            حدث خطأ غير متوقع. يرجى تحديث الصفحة أو التواصل مع فريق الدعم.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            style={{
              padding: '0.75rem 2.5rem',
              background: '#1A1A1A',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              letterSpacing: '0.15em',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            العودة للرئيسية
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: '2rem',
                background: '#FEE2E2',
                padding: '1rem',
                borderRadius: '8px',
                maxWidth: '600px',
                textAlign: 'left',
                direction: 'ltr',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#DC2626' }}>
                Error Details (Dev Mode)
              </summary>
              <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#7F1D1D', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
