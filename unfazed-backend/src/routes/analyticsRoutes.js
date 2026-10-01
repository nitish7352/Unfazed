const express = require('express');
const router  = express.Router();
const {
  getSummary, getRevenueChart, getSessionChart,
  getClientChart, getTopClients, getNoShowChart, getUpgradePrompts,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { requireFeature } = require('../services/entitlementService');

router.use(protect);

router.get('/summary',          getSummary);
router.get('/revenue',          requireFeature('analytics_depth'), getRevenueChart);   // gated — basic+ only
router.get('/sessions',         getSessionChart);
router.get('/clients',          getClientChart);
router.get('/top-clients',      getTopClients);
router.get('/no-show',          getNoShowChart);       // Module 7
router.get('/upgrade-prompts',  getUpgradePrompts);   // Module 7 — always available

module.exports = router;
