import api from './axios';

export const getNotesAPI           = (params)    => api.get('/notes', { params });
export const getNoteBySessionAPI   = (sessionId) => api.get(`/notes/session/${sessionId}`);
export const getNoteAPI            = (id)        => api.get(`/notes/${id}`);
export const updateNoteAPI         = (id, data)  => api.put(`/notes/${id}`, data);
export const signNoteAPI           = (id)        => api.put(`/notes/${id}/sign`);
export const deleteNoteAPI         = (id)        => api.delete(`/notes/${id}`);
export const toggleVisibilityAPI   = (id)        => api.put(`/notes/${id}/visibility`);
export const getSharedNotesAPI     = (clientId)  => api.get(`/notes/shared/${clientId}`);
