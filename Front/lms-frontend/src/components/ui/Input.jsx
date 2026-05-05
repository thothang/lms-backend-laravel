import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Input = forwardRef(({ className, type, error, icon: Icon, wrapperClassName, ...props }, ref) => {
  return (
    <div className={cn("w-full mb-2", wrapperClassName)}>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
            Icon && "pl-10",
            error ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };
