import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/Button';

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  totalItems = 0,
  perPage = 10,
  isLoading = false,
  showPageNumbers = true,
  maxVisiblePages = 5,
}) => {
  // Don't render if only 1 page
  if (totalPages <= 1) return null;

  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if end is at max
    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100">
      {/* Info */}
      <div className="text-sm text-slate-500">
        Hiển thị {startItem}-{endItem} của {totalItems} mục
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={isLoading || currentPage === 1}
          className="hidden sm:flex"
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </Button>

        {/* Previous Page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isLoading || currentPage === 1}
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </Button>

        {/* Page Numbers */}
        {showPageNumbers && pageNumbers.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className="min-w-[36px]"
          >
            {page}
          </Button>
        ))}

        {/* Next Page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLoading || currentPage === totalPages}
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </Button>

        {/* Last Page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={isLoading || currentPage === totalPages}
          className="hidden sm:flex"
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;