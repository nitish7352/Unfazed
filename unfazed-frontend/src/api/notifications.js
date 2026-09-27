import api from './axios';

export const getNotificationsAPI  = (params) => api.get('/notifications', { params });
export const markAsReadAPI        = (id)     => api.put(`/notifications/${id}/read`);
export const markAllAsReadAPI     = ()       => api.put('/notifications/read-all');
export const deleteNotificationAPI = (id)   => api.delete(`/notifications/${id}`);
