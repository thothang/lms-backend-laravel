import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from './Input';

const Button = forwardRef(({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
  
  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
    link: "text-indigo-600 underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-11 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-12 rounded-lg px-8 text-lg",
    icon: "h-11 w-11",
  };

  return (
    <motion.button
      whileTap={isLoading ? undefined : { scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg
          className="mr-2 h-5 w-5 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";

export { Button };
