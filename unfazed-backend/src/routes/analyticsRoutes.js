const express = require('express');
const router = express.Router();
const { getSummary, getRevenueChart, getSessionChart, getClientChart, getTopClients } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary',     getSummary);
router.get('/revenue',     getRevenueChart);
router.get('/sessions',    getSessionChart);
router.get('/clients',     getClientChart);
router.get('/top-clients', getTopClients);

module.exports = router;
