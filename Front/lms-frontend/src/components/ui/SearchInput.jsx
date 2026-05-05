import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  debounceMs = 300,
  className = '',
  showClear = true,
  inputClassName = '',
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (onChange && localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localValue, debounceMs]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search 
        size={18} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
      />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm 
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
          transition-all duration-200 ${inputClassName}`}
      />
      {showClear && localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;