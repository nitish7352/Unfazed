import api from './axios';

export const getPlansAPI              = ()       => api.get('/subscription/plans');
export const getSubscriptionAPI       = ()       => api.get('/subscription');
export const createSubscriptionOrderAPI = (plan) => api.post('/subscription/order', { plan });
export const verifySubscriptionAPI    = (data)   => api.post('/subscription/verify', data);
export const cancelSubscriptionAPI    = ()       => api.post('/subscription/cancel');
