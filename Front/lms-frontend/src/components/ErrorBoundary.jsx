import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: Date.now()
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: Date.now()
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, fallbackProps, showDetails = false } = this.props;
      
      // If a custom fallback is provided, use it
      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Đã xảy ra lỗi
            </h2>
            <p className="text-slate-600 mb-6">
              {this.state.error?.message || 'Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại.'}
            </p>
            
            {showDetails && this.state.error && (
              <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32">
                <p className="text-xs text-slate-500 font-mono break-all whitespace-pre-wrap">
                  {this.state.error.stack}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại trang
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;