import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, X } from 'lucide-react';

const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4">
      <div className="bg-white border border-indigo-100 rounded-2xl shadow-2xl shadow-indigo-100/50 p-5 max-w-sm flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCcw size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-slate-800 text-sm">Cập nhật mới!</h4>
            <p className="text-xs text-slate-500 mt-0.5">Phiên bản mới đã sẵn sàng. Tải lại để cập nhật.</p>
          </div>
          <button onClick={close} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-100"
        >
          Cập nhật ngay
        </button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
