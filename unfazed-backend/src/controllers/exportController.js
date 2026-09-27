const path   = require('path');
const fs     = require('fs');
const Invoice    = require('../models/Invoice');
const SessionNote = require('../models/SessionNote');
const Session    = require('../models/Session');
const Client     = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');
const { errorResponse } = require('../utils/apiResponse');
const { generateInvoicePDF, generateNotePDF } = require('../services/pdfService');

// ── PDF exports ───────────────────────────────────────────────────────────────

// @desc  Download invoice as PDF
// @route GET /api/export/invoice/:id/pdf
const exportInvoicePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, therapist: req.user._id })
    .populate('client', 'firstName lastName email')
    .populate('session', 'startTime type modality');

  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  const buffer = await generateInvoicePDF(invoice, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
  res.end(buffer);
});

// @desc  Download session note as PDF
// @route GET /api/export/note/:id/pdf
const exportNotePDF = asyncHandler(async (req, res) => {
  const note = await SessionNote.findOne({ _id: req.params.id, therapist: req.user._id })
    .populate('client', 'firstName lastName')
    .populate({ path: 'session', select: 'startTime type modality duration' });

  if (!note) return errorResponse(res, 'Note not found', 404);

  const buffer = await generateNotePDF(note, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="note-${note._id}.pdf"`);
  res.end(buffer);
});

// ── CSV exports ───────────────────────────────────────────────────────────────

const toCSV = (rows, headers) => {
  const escape = (val) => {
    const s = val === null || val === undefined ? '' : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(',')));
  return lines.join('\r\n');
};

// @desc  Export sessions as CSV
// @route GET /api/export/sessions/csv
const exportSessionsCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  const query = { therapist: req.user._id };
  if (status)    query.status = status;
  if (startDate) query.startTime = { ...(query.startTime || {}), $gte: new Date(startDate) };
  if (endDate)   query.startTime = { ...(query.startTime || {}), $lte: new Date(endDate) };

  const sessions = await Session.find(query)
    .populate('client', 'firstName lastName email')
    .sort({ startTime: -1 })
    .lean();

  const rows = sessions.map((s) => ({
    Date:       new Date(s.startTime).toLocaleDateString('en-IN'),
    StartTime:  new Date(s.startTime).toLocaleTimeString('en-IN'),
    Client:     `${s.client?.firstName || ''} ${s.client?.lastName || ''}`,
    Email:      s.client?.email || '',
    Type:       s.type,
    Modality:   s.modality,
    Duration:   s.duration,
    Status:     s.status,
    Rate:       s.rate,
    PaymentStatus: s.paymentStatus,
  }));

  const csv = toCSV(rows, ['Date','StartTime','Client','Email','Type','Modality','Duration','Status','Rate','PaymentStatus']);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sessions.csv"');
  res.send('\uFEFF' + csv); // BOM for Excel
});

// @desc  Export invoices as CSV
// @route GET /api/export/invoices/csv
const exportInvoicesCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  const query = { therapist: req.user._id };
  if (status)    query.status = status;
  if (startDate) query.createdAt = { ...(query.createdAt || {}), $gte: new Date(startDate) };
  if (endDate)   query.createdAt = { ...(query.createdAt || {}), $lte: new Date(endDate) };

  const invoices = await Invoice.find(query)
    .populate('client', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

  const rows = invoices.map((inv) => ({
    InvoiceNumber: inv.invoiceNumber,
    Date:          new Date(inv.createdAt).toLocaleDateString('en-IN'),
    Client:        `${inv.client?.firstName || ''} ${inv.client?.lastName || ''}`,
    Email:         inv.client?.email || '',
    Subtotal:      inv.subtotal,
    Tax:           inv.tax,
    Discount:      inv.discount,
    Total:         inv.total,
    Status:        inv.status,
    PaidAt:        inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('en-IN') : '',
  }));

  const csv = toCSV(rows, ['InvoiceNumber','Date','Client','Email','Subtotal','Tax','Discount','Total','Status','PaidAt']);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
  res.send('\uFEFF' + csv);
});

// @desc  Export clients as CSV
// @route GET /api/export/clients/csv
const exportClientsCSV = asyncHandler(async (req, res) => {
  const clients = await Client.find({ therapist: req.user._id }).sort({ createdAt: -1 }).lean();

  const rows = clients.map((c) => ({
    FirstName:     c.firstName,
    LastName:      c.lastName,
    Email:         c.email || '',
    Phone:         c.phone || '',
    Gender:        c.gender,
    Status:        c.status,
    TotalSessions: c.totalSessions,
    TotalPaid:     c.totalAmountPaid,
    AddedOn:       new Date(c.createdAt).toLocaleDateString('en-IN'),
  }));

  const csv = toCSV(rows, ['FirstName','LastName','Email','Phone','Gender','Status','TotalSessions','TotalPaid','AddedOn']);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
  res.send('\uFEFF' + csv);
});

module.exports = { exportInvoicePDF, exportNotePDF, exportSessionsCSV, exportInvoicesCSV, exportClientsCSV };
