import api from '../api/axios';

/**
 * Trigger a file download from an API endpoint that returns binary data.
 * @param {string} url     - API path (e.g. '/export/invoice/123/pdf')
 * @param {string} filename - Suggested filename
 * @param {string} mimeType - e.g. 'application/pdf' or 'text/csv'
 */
export const downloadFile = async (url, filename, mimeType = 'application/octet-stream') => {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: mimeType });
  const href = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href     = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

export const downloadInvoicePDF = (id, invoiceNumber) =>
  downloadFile(`/export/invoice/${id}/pdf`, `invoice-${invoiceNumber}.pdf`, 'application/pdf');

export const downloadNotePDF = (id) =>
  downloadFile(`/export/note/${id}/pdf`, `note-${id}.pdf`, 'application/pdf');

export const downloadSessionsCSV = (params = '') =>
  downloadFile(`/export/sessions/csv${params}`, 'sessions.csv', 'text/csv');

export const downloadInvoicesCSV = (params = '') =>
  downloadFile(`/export/invoices/csv${params}`, 'invoices.csv', 'text/csv');

export const downloadClientsCSV = () =>
  downloadFile('/export/clients/csv', 'clients.csv', 'text/csv');
