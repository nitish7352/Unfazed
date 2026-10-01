const express = require('express');
const router  = express.Router();
const {
  getPlans, getSubscription, createSubscriptionOrder,
  verifySubscription, cancelSubscription, handleWebhook,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Webhook — raw body is already parsed by app.js before the json middleware.
// Do NOT add express.raw() here again — it would cause double-parsing and corrupt the body.
router.post('/webhook', handleWebhook);

router.use(protect);

router.get('/plans',    getPlans);
router.get('/',         getSubscription);
router.post('/order',   createSubscriptionOrder);
router.post('/verify',  verifySubscription);
router.post('/cancel',  cancelSubscription);

module.exports = router;
