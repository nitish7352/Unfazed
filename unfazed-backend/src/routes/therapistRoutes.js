const express = require('express');
const router = express.Router();
const {
  getPublicTherapists,
  getPublicTherapistById,
  getTherapistSlots,
  getTherapistAvailability,
} = require('../controllers/therapistController');

router.get('/',                  getPublicTherapists);
router.get('/:id',               getPublicTherapistById);
router.get('/:id/slots',         getTherapistSlots);
router.get('/:id/availability',  getTherapistAvailability);

module.exports = router;
