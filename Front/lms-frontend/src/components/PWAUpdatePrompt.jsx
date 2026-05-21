import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw, X } from 'lucide-react';

const PWAUpdatePrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success('Ứng dụng đã sẵn sàng hoạt động ngoại tuyến!', {
        id: 'pwa-offline-ready',
      });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast('Có bản cập nhật mới!', {
        id: 'pwa-update-prompt',
        duration: Infinity,
        description: 'Vui lòng cập nhật để sử dụng các tính năng mới nhất.',
        action: {
          label: (
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>Cập nhật ngay</span>
            </div>
          ),
          onClick: () => updateServiceWorker(true),
        },
        cancel: {
          label: (
            <div className="flex items-center gap-1">
              <X size={14} />
              <span>Để sau</span>
            </div>
          ),
          onClick: () => setNeedRefresh(false),
        },
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null; // This component handles side effects via toasts
};

export default PWAUpdatePrompt;
