import { toast } from 'sonner';

/**
 * Helper to handle API errors and show appropriate toast notifications.
 * Specifically handles Laravel 422 Validation errors.
 * @param {Error} error - The error from the API call (axios error)
 * @param {string} defaultMessage - Fallback message if error can't be parsed
 */
export const handleApiError = (error, defaultMessage = 'Đã có lỗi xảy ra.') => {
  if (error?.response) {
    const { status, data } = error.response;

    // 1. Handle Laravel Validation Errors (422)
    if (status === 422) {
      if (data.errors) {
        const errorMessages = Object.values(data.errors).flat();
        if (errorMessages.length > 0) {
          errorMessages.forEach((msg, index) => {
            setTimeout(() => {
              toast.error(msg, { id: msg, duration: 4500 });
            }, index * 100);
          });
          return;
        }
      }
      // Handle singular error key if present
      if (data.error) {
        toast.error(data.error, { id: data.error });
        return;
      }
      // Fallback for 422 without errors object
      const fallbackMsg = data.message || 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.';
      toast.error(fallbackMsg, { id: fallbackMsg });
      return;
    }

    // 2. Handle Bad Request (400) - Business logic errors from backend
    if (status === 400) {
      const msg = data.error || data.message || defaultMessage;
      toast.error(msg, { id: `400_${msg}` });
      return;
    }

    // 3. Handle Authentication Errors (401)
    if (status === 401) {
      toast.error('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', { id: 'auth_err' });
      return;
    }

    // 4. Handle Permission Errors (403)
    if (status === 403) {
      const msg = data.message || 'Bạn không có quyền thực hiện hành động này.';
      toast.error(msg, { id: msg });
      return;
    }

    // 5. Handle Not Found (404)
    if (status === 404) {
      toast.error('Nội dung không tồn tại hoặc đã bị xóa.', { id: 'not_found' });
      return;
    }

    // 6. Handle Server Errors (500)
    if (status >= 500) {
      const serverMsg = data?.message || data?.error || 'Lỗi hệ thống (500). Đội ngũ kỹ thuật đang xử lý, vui lòng quay lại sau.';
      toast.error(serverMsg, { id: serverMsg });
      return;
    }

    // 7. Generic data message from backend
    if (data.message || data.error) {
      toast.error(data.message || data.error, { id: data.message || data.error });
      return;
    }
  }

  // 8. Network or local errors
  if (error?.message === 'Network Error') {
    toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra internet.', { id: 'network_err' });
    return;
  }

  // Final fallback - avoid technical strings
  const finalMsg = (error?.message && !error.message.includes('status code')) 
    ? error.message 
    : defaultMessage;
    
  toast.error(finalMsg, { id: finalMsg });
};

export const showSuccess = (message) => {
  toast.success(message, { id: message });
};

export const showInfo = (message) => {
  toast.info(message, { id: message });
};

export const showError = (message) => {
  toast.error(message, { id: message });
};
