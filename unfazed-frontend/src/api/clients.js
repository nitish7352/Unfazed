import api from './axios';

export const getClientsAPI        = (params) => api.get('/clients', { params });
export const getClientAPI         = (id)     => api.get(`/clients/${id}`);
export const createClientAPI      = (data)   => api.post('/clients', data);
export const updateClientAPI      = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClientAPI      = (id)     => api.delete(`/clients/${id}`);
export const updateIntakeFormAPI  = (id, data) => api.put(`/clients/${id}/intake`, data);
export const getClientSessionsAPI = (id)     => api.get(`/clients/${id}/sessions`);
