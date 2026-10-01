const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");
const { canAccess, getDefaultConfig } = require("../services/entitlementService");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

router.use(protect);

// GET /api/entitlements/check?feature=pdf_exports
router.get("/check", asyncHandler(async (req, res) => {
  const { feature } = req.query;
  if (!feature) return errorResponse(res, "feature query param required", 400);
  const result = await canAccess(req.user._id, feature, req.query);
  return successResponse(res, result);
}));

// GET /api/entitlements/tiers — all tier configs
router.get("/tiers", asyncHandler(async (req, res) => {
  const tiers = await SubscriptionTierConfig.find({ is_active: true }).sort({ price_monthly: 1 });
  return successResponse(res, { tiers });
}));

module.exports = router;