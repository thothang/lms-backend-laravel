import api from './api';

export const librarianService = {
  // Book Management
  getBooks: async (params) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  createBook: async (formData) => {
    const response = await api.post('/librarian/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateBook: async (id, formData) => {
    const response = await api.put(`/librarian/books/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteBook: async (id) => {
    const response = await api.delete(`/librarian/books/${id}`);
    return response.data;
  },

  // Copies
  addCopy: async (bookId, quantity) => {
    const response = await api.post(`/librarian/books/${bookId}/copies`, { quantity });
    return response.data;
  },

  deleteCopy: async (copyId) => {
    const response = await api.delete(`/librarian/copies/${copyId}`);
    return response.data;
  },

  // Ebook Upload (revenue goes to admin)
  uploadEbook: async (formData) => {
    const response = await api.post('/librarian/ebooks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Ebook Update (admin/librarian)
  updateEbook: async (id, formData) => {
    const response = await api.put(`/librarian/ebooks/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Offline Transactions
  borrowOffline: async (borrowData) => {
    const response = await api.post('/librarian/borrow/offline', borrowData);
    return response.data;
  },

  returnOffline: async (borrowId) => {
    const response = await api.post(`/librarian/return/${borrowId}`);
    return response.data;
  },

  // Reservations
  getReservations: async (status = 'pending') => {
    const response = await api.get('/librarian/reservations', { params: { status } });
    return response.data;
  },

  confirmReservation: async (id) => {
    const response = await api.post(`/librarian/reservations/${id}/confirm`);
    return response.data;
  },

  // Mark Lost/Damaged
  markLost: async (copyId, data) => {
    const response = await api.post(`/librarian/books/${copyId}/mark-lost`, data);
    return response.data;
  },

  // Settings
  updateBookSettings: async (data) => {
    const response = await api.post('/librarian/settings/books/hot', data);
    return response.data;
  },

  // Finance
  getFinanceSummary: async () => {
    const response = await api.get('/librarian/finance/summary');
    return response.data;
  },
  getDepositSummary: async () => {
    const response = await api.get('/librarian/finance/deposit-summary');
    return response.data;
  },
  getFinanceTopups: async () => {
    const response = await api.get('/librarian/finance/topups');
    return response.data;
  },
  getAllTopups: async (params) => {
    const response = await api.get('/librarian/finance/all-topups', { params });
    return response.data;
  },
  getFinanceDeposits: async () => {
    const response = await api.get('/librarian/finance/deposits');
    return response.data;
  },

  // Users
  getUsers: async (params) => {
    const response = await api.get('/librarian/users/all', { params });
    return response.data;
  },
  updateUserStatus: async (id, status) => {
    const response = await api.put(`/librarian/users/${id}/status`, { status });
    return response.data;
  },

  // Reports
  getReportOverview: async () => {
    const response = await api.get('/librarian/reports/overview');
    return response.data;
  },
  getBorrowStats: async () => {
    const response = await api.get('/librarian/reports/borrow-stats');
    return response.data;
  },
  getReportBorrowings: async () => {
    const response = await api.get('/librarian/reports/borrowings');
    return response.data;
  },

  // Messages
  getMessages: async () => {
    const response = await api.get('/librarian/messages');
    return response.data;
  },
  sendMessage: async (data) => {
    const response = await api.post('/librarian/messages', data);
    return response.data;
  },

  // Contact Messages
  getContactMessages: async (params) => {
    const response = await api.get('/librarian/contact-messages', { params });
    return response.data;
  },
  getContactMessageStats: async () => {
    const response = await api.get('/librarian/contact-messages/stats');
    return response.data;
  },
  replyContact: async (id, data) => {
    const response = await api.post(`/librarian/contact-messages/${id}/reply`, data);
    return response.data;
  },

  // Reports
  getTopBooks: async (params) => {
    const response = await api.get('/librarian/reports/top-books', { params });
    return response.data;
  },
  getCategoryStats: async (params) => {
    const response = await api.get('/librarian/reports/category-stats', { params });
    return response.data;
  },
  getReturnStats: async (params) => {
    const response = await api.get('/librarian/reports/return-stats', { params });
    return response.data;
  },

  // Library Fees
  getLibraryFees: async (params) => {
    const response = await api.get('/librarian/finance/library-fees', { params });
    return response.data;
  },
};
