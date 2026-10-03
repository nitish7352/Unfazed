import api from './axios';

export const getTherapistsAPI = (params) => api.get('/therapists', { params });
export const getTherapistByIdAPI = (id) => api.get(`/therapists/${id}`);
export const getTherapistSlotsAPI = (id, date, duration = 50) =>
  api.get(`/therapists/${id}/slots`, { params: { date, duration } });
export const getTherapistAvailabilityAPI = (id) =>
  api.get(`/therapists/${id}/availability`);
