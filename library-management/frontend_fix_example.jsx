// === FIX FOR PaymentSuccessPage.jsx ===
// This file shows how to fix the duplicate toast notification issue

// 1. Add X-Request-ID header when calling the API
// This helps backend track duplicate requests

import { useEffect, useRef } from 'react';
import axios from 'axios';

function PaymentSuccessPage({ amount }) {
  const hasCalled = useRef(false);
  const requestId = useRef(generateUUID()); // Generate once

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const confirmAndRedirect = async () => {
      try {
        // ⭐ Key fix: Add X-Request-ID header
        const response = await axios.post('/api/topup/confirm', 
          { amount },
          { 
            headers: { 
              'X-Request-ID': requestId.current 
            } 
          }
        );

        if (response.data.success) {
          // ⭐ Only show notification if NOT a duplicate response
          if (!response.data.duplicate) {
            showToast('Nạp tiền thành công!');
          }
          
          // Redirect after delay
          setTimeout(() => navigate('/balance'), 2000);
        }
      } catch (error) {
        console.error('Failed to confirm topup:', error);
      }
    };

    confirmAndRedirect();
  }, []);

  // Helper function to generate UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ... rest of component
}

// =========================================
// ALTERNATIVE: If frontend code is not accessible,
// disable React StrictMode temporarily
// =========================================
// 
// In main.jsx or index.jsx:
//
// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
//
// createRoot(document.getElementById('root')).render(
//   <App />
//   // <StrictMode>
//   //   <App />
//   // </StrictMode>
// );
