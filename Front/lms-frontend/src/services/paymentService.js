import api from './api';

const paymentService = {
  // Create deposit payment for borrow record
  createDepositPayment: async (borrowRecordId) => {
    const response = await api.post('/deposit', { borrow_record_id: borrowRecordId });
    return response.data;
  },

  // Create topup payment (redirect to Sepay)
  createTopupPayment: async (amount) => {
    const response = await api.post('/topup', { amount });
    return response.data;
  },

  // Confirm topup directly (for sandbox testing - no redirect needed)
  confirmTopup: async (amount, requestId) => {
    const response = await api.post('/topup/confirm', { amount }, {
      headers: requestId ? { 'X-Request-ID': requestId } : {}
    });
    return response.data;
  },

  // Create fine payment
  createFinePayment: async (borrowRecordId) => {
    const response = await api.post('/fine', { borrow_record_id: borrowRecordId });
    return response.data;
  },

  // Get payment history
  getHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },
};

export default paymentService;