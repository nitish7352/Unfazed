import api from './axios';

export const getSummaryAPI        = () => api.get('/analytics/summary');
export const getRevenueAPI        = () => api.get('/analytics/revenue');
export const getSessionsChartAPI  = () => api.get('/analytics/sessions');
export const getClientsChartAPI   = () => api.get('/analytics/clients');
export const getTopClientsAPI     = () => api.get('/analytics/top-clients');
export const getNoShowChartAPI    = () => api.get('/analytics/no-show');        // Module 7
export const getUpgradePromptsAPI = () => api.get('/analytics/upgrade-prompts'); // Module 7
