import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect', ...props }) => {
  const baseClasses = "animate-pulse bg-slate-200";
  
  const variants = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded h-4 w-full"
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`} 
      {...props} 
    />
  );
};

export const SkeletonCard = () => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4">
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center space-x-4 py-4 px-6 border-b border-slate-50">
    <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
);
