import axios from 'axios';

// Production: VITE_API_URL = https://unfazed-3t20.onrender.com/api
// Development: falls back to relative /api (Vite proxy → localhost:5000)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unfazed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track whether we already fired the logout redirect to avoid duplicate navigations
let logoutDispatched = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const reason = error.response?.data?.message || 'Unknown';
      console.warn(`[Unfazed] 401 on ${error.config?.url}: ${reason}`);

      // Don't log out if Razorpay checkout is open
      const razorpayOpen = !!document.querySelector('iframe[src*="razorpay"]');

      if (!razorpayOpen && !logoutDispatched) {
        logoutDispatched = true;
        localStorage.removeItem('unfazed_token');
        localStorage.removeItem('unfazed_user');
        window.dispatchEvent(new CustomEvent('unfazed:unauthorized'));
        // Reset after 5 s so a fresh login works normally
        setTimeout(() => { logoutDispatched = false; }, 5000);
      }
    }
    // Always reject with the original error — never swallow it silently.
    // Callers that want to skip toasts after a 401 can check err.response?.status === 401.
    return Promise.reject(error);
  }
);

export default api;
