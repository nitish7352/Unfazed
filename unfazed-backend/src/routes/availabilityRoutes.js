const express = require('express');
const router  = express.Router();
const { getAvailability, updateAvailability, getAvailableSlots } = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/slots', getAvailableSlots);
router.route('/').get(getAvailability).put(updateAvailability);

module.exports = router;
