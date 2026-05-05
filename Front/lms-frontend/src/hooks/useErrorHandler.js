import { useState, useCallback } from 'react';

/**
 * Hook to handle errors in components with retry logic
 * 
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Object} Error state and handlers
 */
export const useErrorHandler = (fetchFn, options = {}) => {
  const { 
    onError = null, 
    initialError = null,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [error, setError] = useState(initialError);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Handle error
  const handleError = useCallback((err) => {
    setError(err);
    if (onError) {
      onError(err);
    }
  }, [onError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setRetryAttempt(0);
  }, []);

  // Retry with exponential backoff
  const retry = useCallback(async (...args) => {
    if (retryAttempt >= retryCount) {
      handleError(new Error('Đã thử quá nhiều lần. Vui lòng thử lại sau.'));
      return;
    }

    setIsRetrying(true);
    setRetryAttempt(prev => prev + 1);

    try {
      // Wait with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * Math.pow(2, retryAttempt))
      );
      
      await fetchFn(...args);
      setError(null);
      setRetryAttempt(0);
    } catch (err) {
      if (retryAttempt + 1 >= retryCount) {
        handleError(err);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [fetchFn, handleError, retryAttempt, retryCount, retryDelay]);

  return {
    error,
    isRetrying,
    retryAttempt,
    handleError,
    clearError,
    retry
  };
};

/**
 * Hook for async operations with error handling
 * 
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} State and handlers
 */
export const useAsync = (asyncFn, options = {}) => {
  const { 
    onSuccess = null, 
    onError = null,
    immediate = false 
  } = options;

  const [status, setStatus] = useState(immediate ? 'pending' : 'idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setError(null);
    
    try {
      const result = await asyncFn(...args);
      setData(result);
      setStatus('success');
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err);
      setStatus('error');
      if (onError) onError(err);
      throw err;
    }
  }, [asyncFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return {
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    status,
    data,
    error,
    execute,
    reset
  };
};

export default { useErrorHandler, useAsync };