import api from './axios';

export const getSessionsAPI        = (params)    => api.get('/sessions', { params });
export const getUpcomingSessionsAPI = ()          => api.get('/sessions/upcoming');
export const getSessionAPI         = (id)         => api.get(`/sessions/${id}`);
export const createSessionAPI      = (data)       => api.post('/sessions', data);
export const updateSessionAPI      = (id, data)   => api.put(`/sessions/${id}`, data);
export const cancelSessionAPI      = (id, data)   => api.put(`/sessions/${id}/cancel`, data);
export const completeSessionAPI    = (id)         => api.put(`/sessions/${id}/complete`);
export const deleteSessionAPI      = (id)         => api.delete(`/sessions/${id}`);
