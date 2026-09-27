import api from './axios';

export const getInvoicesAPI         = (params)  => api.get('/invoices', { params });
export const getInvoiceAPI          = (id)      => api.get(`/invoices/${id}`);
export const createInvoiceAPI       = (data)    => api.post('/invoices', data);
export const updateInvoiceAPI       = (id, data) => api.put(`/invoices/${id}`, data);
export const deleteInvoiceAPI       = (id)      => api.delete(`/invoices/${id}`);
export const createRazorpayOrderAPI = (id)      => api.post(`/invoices/${id}/order`);
export const verifyPaymentAPI       = (id, data) => api.post(`/invoices/${id}/verify`, data);
