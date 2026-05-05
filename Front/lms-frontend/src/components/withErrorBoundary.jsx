import ErrorBoundary from './ErrorBoundary';

export const withErrorBoundary = (Component, fallbackProps = {}) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary>
        <Component {...props} {...fallbackProps} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;
