import api from './axios';

export const getChatHistoryAPI  = (clientId, params) => api.get(`/chat/${clientId}`, { params });
export const markRoomReadAPI    = (clientId)          => api.put(`/chat/${clientId}/read`);
export const getUnreadCountsAPI = ()                  => api.get('/chat/unread');
