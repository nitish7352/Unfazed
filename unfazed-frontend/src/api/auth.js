import api from './axios';

export const registerAPI   = (data) => api.post('/auth/register', data);
export const loginAPI      = (data) => api.post('/auth/login', data);
export const getMeAPI      = ()     => api.get('/auth/me');
export const refreshTokenAPI = ()   => api.get('/auth/refresh');
export const updatePasswordAPI = (data) => api.put('/auth/password', data);
