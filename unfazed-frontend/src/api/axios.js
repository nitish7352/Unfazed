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
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('unfazed_token');
      localStorage.removeItem('unfazed_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
