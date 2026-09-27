import api from './axios';

export const getProfileAPI    = ()      => api.get('/profile');
export const updateProfileAPI = (data)  => api.put('/profile', data);
export const updateAvatarAPI  = (formData) =>
  api.put('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
