import api from './axios';

export const createBookingAPI = (data) => api.post('/bookings', data);
export const getMyBookingsAPI = () => api.get('/bookings/my');
export const getTherapistBookingsAPI = (params) => api.get('/bookings/therapist', { params });
export const getBookingByIdAPI = (id) => api.get(`/bookings/${id}`);
export const updateBookingStatusAPI = (id, status, reason = '') =>
  api.patch(`/bookings/${id}/status`, { status, reason });
export const createBookingPaymentOrderAPI = (id) => api.post(`/bookings/${id}/pay`);
export const verifyBookingPaymentAPI = (id, paymentData) =>
  api.post(`/bookings/${id}/verify-payment`, paymentData);
