const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getTherapistBookings,
  getBookingById,
  updateBookingStatus,
  createBookingRazorpayOrder,
  verifyBookingPayment,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/',                      createBooking);
router.get('/my',                     getMyBookings);
router.get('/therapist',              getTherapistBookings);
router.get('/:id',                    getBookingById);
router.patch('/:id/status',           updateBookingStatus);
router.post('/:id/pay',               createBookingRazorpayOrder);
router.post('/:id/verify-payment',    verifyBookingPayment);

module.exports = router;
