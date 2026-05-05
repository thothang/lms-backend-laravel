import React from 'react';

const VirtualTable = ({ data, columns, height = 400, rowHeight = 60, onRowClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-slate-100 px-4 py-3 font-semibold text-slate-700 text-sm border-b border-slate-200 sticky top-0">
        {columns.map((col, index) => (
          <div
            key={index}
            className="flex-1 px-2"
            style={{ flex: col.flex || 1, minWidth: col.minWidth || 100 }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Scrollable List with native CSS scrolling */}
      <div style={{ height: `${height}px`, overflowY: 'auto' }}>
        {data.map((item, index) => (
          <div
            key={index}
            className={`flex items-center border-b border-slate-100 hover:bg-slate-50 transition-colors px-4 ${onRowClick ? 'cursor-pointer' : ''}`}
            style={{ minHeight: `${rowHeight}px` }}
            onClick={() => onRowClick && onRowClick(item)}
          >
            {columns.map((col, colIndex) => (
              <div
                key={colIndex}
                className="flex-1 px-2"
                style={{ flex: col.flex || 1, minWidth: col.minWidth || 100 }}
              >
                {col.render ? col.render(item, index) : item[col.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualTable;
