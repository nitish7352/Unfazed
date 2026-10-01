const express = require("express");
const router  = express.Router();
const {
  createOrder, verifyPayment, handleWebhook, getPayments,
  createPackage, getPackages, purchasePackage, verifyPackagePurchase, getPackagePurchases,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Webhook — raw body, no auth
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

router.use(protect);

// Standard checkout flow
router.post("/create-order", createOrder);
router.post("/verify",       verifyPayment);
router.get("/",              getPayments);

// Session packages
router.get("/packages",              getPackages);
router.post("/packages",             createPackage);
router.post("/packages/:id/purchase",purchasePackage);
router.post("/packages/:id/verify",  verifyPackagePurchase);
router.get("/purchases",             getPackagePurchases);

module.exports = router;