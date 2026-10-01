const express = require("express");
const router  = express.Router();
const { getAvailableSlots, getPublicAvailability, updateAvailability, getMyAvailability } = require("../controllers/schedulingController");
const { protect } = require("../middleware/auth");

// Public slot lookup (clients booking)
router.get("/:therapistId/slots",        getAvailableSlots);
router.get("/:therapistId/availability", getPublicAvailability);

// Therapist manages their own availability
router.use(protect);
router.get("/my/availability",  getMyAvailability);
router.put("/my/availability",  updateAvailability);

module.exports = router;