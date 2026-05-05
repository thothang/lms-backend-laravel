import api from './api';

export const catalogService = {
  getBookDetails: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  getEbookDetails: async (id) => {
    const response = await api.get(`/ebooks/${id}`);
    return response.data;
  },

  borrowBook: async (bookId, days = 7) => {
    const response = await api.post(`/borrow/${bookId}`, { days });
    return response.data;
  },

  reserveBook: async (bookId, expected_borrow_days = 7) => {
    const response = await api.post(`/reservations/${bookId}`, { expected_borrow_days });
    return response.data;
  },

  purchaseEbook: async (id) => {
    const response = await api.post(`/ebooks/${id}/purchase`);
    return response.data;
  },

  readEbook: async (id) => {
    const response = await api.get(`/ebooks/${id}/read`, { responseType: 'blob' });
    return response;
  },

  previewEbook: async (id) => {
    const response = await api.get(`/ebooks/${id}/preview`, { responseType: 'blob' });
    return response;
  },

  checkEbookAccess: async (id) => {
    const response = await api.get(`/ebooks/${id}/access`);
    return response.data;
  },

  submitReview: async (type, id, data) => {
    const endpoint = type === 'ebook' ? `/reviews/ebook/${id}` : `/reviews/book/${id}`;
    const response = await api.post(endpoint, data);
    return response.data;
  }
};
