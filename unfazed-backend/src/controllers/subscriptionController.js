const User     = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const Razorpay = require('razorpay');
const crypto   = require('crypto');

const PLANS = {
  basic:      { name: 'Basic',      price: 99900,   interval: 'monthly', maxClients: 20   },
  pro:        { name: 'Pro',        price: 249900,  interval: 'monthly', maxClients: 100  },
  enterprise: { name: 'Enterprise', price: 599900,  interval: 'monthly', maxClients: 9999 },
};

// Fallback to hardcoded test keys if env vars are not set on the server
const RZP_KEY_ID     = process.env.RAZORPAY_KEY_ID     || 'rzp_test_TiNBqobbpz64rc';
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'PST0SEgyQAjZdbmdp1kwc7tz';

const getRazorpay = () => new Razorpay({
  key_id:     RZP_KEY_ID,
  key_secret: RZP_KEY_SECRET,
});

// @desc  Get available plans
// @route GET /api/subscription/plans
const getPlans = asyncHandler(async (req, res) => {
  return successResponse(res, { plans: PLANS });
});

// @desc  Get current subscription
// @route GET /api/subscription
const getSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('subscription firstName lastName email');
  return successResponse(res, { subscription: user.subscription });
});

// @desc  Create Razorpay order for a subscription plan
// @route POST /api/subscription/order
const createSubscriptionOrder = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return errorResponse(res, 'Invalid plan', 400);
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return errorResponse(res, 'Payments are not configured on the server', 503);
  }

  const razorpay = getRazorpay();

  let order;
  try {
    order = await razorpay.orders.create({
      amount:   PLANS[plan].price,
      currency: 'INR',
      receipt:  `sub-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      notes:    { userId: req.user._id.toString(), plan },
    });
  } catch (rzpError) {
    // Razorpay errors have an `error` property with a description
    const msg = rzpError?.error?.description || rzpError?.message || 'Failed to create payment order';
    return errorResponse(res, msg, 400);
  }

  return successResponse(res, {
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    keyId:    RZP_KEY_ID,
    plan:     PLANS[plan],
  });
});

// @desc  Verify & activate subscription
// @route POST /api/subscription/verify
const verifySubscription = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  if (!PLANS[plan]) return errorResponse(res, 'Invalid plan', 400);
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return errorResponse(res, 'Missing payment verification fields', 400);
  }

  const expectedSig = crypto
    .createHmac('sha256', RZP_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // Compare as UTF-8 strings to avoid Buffer length mismatch crash when
  // razorpay_signature is not valid hex (timingSafeEqual requires equal lengths)
  const expectedBuffer = Buffer.from(expectedSig,        'utf8');
  const receivedBuffer = Buffer.from(razorpay_signature, 'utf8');
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return errorResponse(res, 'Signature verification failed', 400);
  }

  const startDate = new Date();
  const endDate   = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const user = await User.findByIdAndUpdate(req.user._id, {
    'subscription.plan':      plan,
    'subscription.status':    'active',
    'subscription.startDate': startDate,
    'subscription.endDate':   endDate,
    'subscription.razorpaySubscriptionId': razorpay_payment_id,
  }, { new: true, runValidators: true }).select('subscription');

  if (!user) return errorResponse(res, 'User not found', 404);

  return successResponse(res, { subscription: user.subscription }, `${PLANS[plan].name} plan activated`);
});

// @desc  Cancel subscription
// @route POST /api/subscription/cancel
const cancelSubscription = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, {
    'subscription.status': 'cancelled',
  }, { new: true }).select('subscription');
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { subscription: user.subscription }, 'Subscription cancelled');
});

// @desc  Razorpay webhook
// @route POST /api/subscription/webhook
const handleWebhook = asyncHandler(async (req, res) => {
  const sig    = req.headers['x-razorpay-signature'];
  // Use the dedicated webhook secret (set in Razorpay Dashboard → Webhooks).
  // app.js already parsed the raw body for this route before json middleware.
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const body   = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (!sig || sig !== expected) return res.status(400).json({ error: 'Invalid signature' });

  const event = req.body.event;

  if (event === 'subscription.charged') {
    const userId = req.body.payload?.subscription?.entity?.notes?.userId;
    if (userId) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      await User.findByIdAndUpdate(userId, {
        'subscription.status':  'active',
        'subscription.endDate': endDate,
      });
    }
  }

  if (event === 'subscription.cancelled') {
    const userId = req.body.payload?.subscription?.entity?.notes?.userId;
    if (userId) {
      await User.findByIdAndUpdate(userId, { 'subscription.status': 'cancelled' });
    }
  }

  res.json({ received: true });
});

module.exports = { getPlans, getSubscription, createSubscriptionOrder, verifySubscription, cancelSubscription, handleWebhook };
