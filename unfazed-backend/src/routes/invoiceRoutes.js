const express = require('express');
const router = express.Router();
const {
  getInvoices, getInvoice, createInvoice, updateInvoice,
  createRazorpayOrder, verifyPayment, deleteInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.post('/:id/order',  createRazorpayOrder);
router.post('/:id/verify', verifyPayment);

module.exports = router;
