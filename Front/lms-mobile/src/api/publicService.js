import api from './api';

export const publicService = {
  // Home Page Complete Data
  getHomeData: async () => {
    const response = await api.get('/home');
    return response.data?.data || response.data;
  },

  // Books (Public)
  getBooks: async (params) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  getHotBooks: async () => {
    const response = await api.get('/books/hot');
    return response.data;
  },

  getFeaturedBooks: async () => {
    const response = await api.get('/books/featured');
    return response.data;
  },

  getCarouselBooks: async () => {
    const response = await api.get('/books/carousel');
    return response.data;
  },

  getBookDetails: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data?.data || response.data || [];
  },

  // Search
  search: async (params) => {
    const response = await api.get('/search', { params });
    return response.data;
  },

  // Ebooks
  getEbooks: async (params) => {
    const response = await api.get('/ebooks', { params });
    return response.data;
  },

  getEbookDetails: async (id) => {
    const response = await api.get(`/ebooks/${id}`);
    return response.data;
  },

  // Gửi tin nhắn liên hệ
  submitContact: async (data) => {
    const response = await api.post('/contact/submit', data);
    return response.data;
  }
};
