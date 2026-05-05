const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      {/* Image placeholder - exact same ratio as BookCard */}
      <div className="relative w-full bg-slate-200 animate-pulse" style={{ paddingBottom: '150%' }}></div>
      {/* Info placeholder */}
      <div className="p-4 flex flex-col flex-1 gap-3 w-full">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2"></div>
        <div className="mt-auto pt-3 flex justify-between items-center border-t border-slate-50">
          <div className="h-5 bg-slate-200 rounded-full animate-pulse w-16"></div>
          <div className="h-4 bg-slate-200 rounded animate-pulse w-12"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
