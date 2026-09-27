const express = require('express');
const router  = express.Router();
const {
  getPlans, getSubscription, createSubscriptionOrder,
  verifySubscription, cancelSubscription, handleWebhook,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Webhook — raw body needed, no auth
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(protect);

router.get('/plans',    getPlans);
router.get('/',         getSubscription);
router.post('/order',   createSubscriptionOrder);
router.post('/verify',  verifySubscription);
router.post('/cancel',  cancelSubscription);

module.exports = router;
