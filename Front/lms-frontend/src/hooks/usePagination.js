import { useState, useCallback } from 'react';

/**
 * Custom hook for pagination
 * 
 * @param {Object} options
 * @param {number} options.defaultPage - Default starting page (default: 1)
 * @param {number} options.defaultPerPage - Default items per page (default: 10)
 * @param {number} options.maxPerPage - Maximum items per page (default: 100)
 * @returns {Object} Pagination state and handlers
 */
export const usePagination = (options = {}) => {
  const {
    defaultPage = 1,
    defaultPerPage = 10,
    maxPerPage = 100,
  } = options;

  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [perPage, setPerPage] = useState(defaultPerPage);

  // Calculate pagination params for API
  const getPaginationParams = useCallback(() => ({
    page: currentPage,
    limit: perPage,
    offset: (currentPage - 1) * perPage,
  }), [currentPage, perPage]);

  // Calculate total pages from total items
  const calculateTotalPages = useCallback((totalItems) => {
    return Math.ceil(totalItems / perPage);
  }, [perPage]);

  // Go to specific page
  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Go to next page
  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  // Go to previous page
  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  // Reset to first page
  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Change per page and reset to first page
  const changePerPage = useCallback((newPerPage) => {
    setPerPage(Math.min(newPerPage, maxPerPage));
    setCurrentPage(1);
  }, [maxPerPage]);

  // Reset pagination
  const reset = useCallback(() => {
    setCurrentPage(defaultPage);
    setPerPage(defaultPerPage);
  }, [defaultPage, defaultPerPage]);

  return {
    currentPage,
    perPage,
    setCurrentPage: goToPage,
    setPerPage: changePerPage,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    reset,
    getPaginationParams,
    calculateTotalPages,
    maxPerPage,
  };
};

export default usePagination;