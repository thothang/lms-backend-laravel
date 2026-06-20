import api from './api';

export const userService = {
  // Lấy thông tin số dư ví
  getBalance: async () => {
    const response = await api.get('/balance');
    return response.data?.data || response.data || { balance: '0' };
  },

  // Lấy lịch sử mượn sách
  getBorrows: async () => {
    const response = await api.get('/my-borrows');
    return response.data?.data || response.data || [];
  },

  // Lấy danh sách ebook đã mua
  getPurchasedEbooks: async () => {
    const response = await api.get('/my-ebooks');
    return response.data?.data || response.data || [];
  },

  // Lấy lịch sử đặt trước sách
  getReservations: async () => {
    const response = await api.get('/my-reservations');
    return response.data?.data || response.data || [];
  },

  // Yêu cầu nạp tiền (trả về URL thanh toán SePay)
  deposit: async (amount) => {
    const response = await api.post('/topup', { amount });
    return response.data;
  },

  // Xác nhận nạp tiền (dành cho sandbox/mobile app)
  confirmTopup: async (data) => {
    const response = await api.post('/topup/confirm', data, {
      headers: {
        'X-Request-ID': data.requestId
      }
    });
    return response.data;
  },

  borrowBook: async (bookId, days = 7) => {
    const response = await api.post(`/borrow/${bookId}`, { days });
    return response.data;
  },

  // Gia hạn mượn sách
  renewBorrow: async (borrowId, days = 9) => {
    const response = await api.post(`/borrow/${borrowId}/renew`, { days });
    return response.data;
  },

  // Mua ebook
  purchaseEbook: async (id) => {
    const response = await api.post(`/ebooks/${id}/purchase`);
    return response.data;
  },

  // Lấy thông tin cá nhân đầy đủ
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (data) => {
    const response = await api.post('/change-password', data);
    return response.data;
  },

  // Lấy danh sách thông báo
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data?.data || response.data || [];
  },

  // Đánh dấu thông báo đã đọc
  markNotificationAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  }
};
