const express = require('express');
const router  = express.Router();
const {
  exportInvoicePDF, exportNotePDF,
  exportSessionsCSV, exportInvoicesCSV, exportClientsCSV,
} = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.use(protect);

// PDF
router.get('/invoice/:id/pdf', exportInvoicePDF);
router.get('/note/:id/pdf',    exportNotePDF);

// CSV
router.get('/sessions/csv',  exportSessionsCSV);
router.get('/invoices/csv',  exportInvoicesCSV);
router.get('/clients/csv',   exportClientsCSV);

module.exports = router;
