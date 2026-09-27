import api from './axios';

export const getAvailabilityAPI    = ()          => api.get('/availability');
export const updateAvailabilityAPI = (data)      => api.put('/availability', data);
export const getAvailableSlotsAPI  = (date, duration = 50) =>
  api.get(`/availability/slots?date=${date}&duration=${duration}`);
