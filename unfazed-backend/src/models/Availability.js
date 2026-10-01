const mongoose = require("mongoose");

// One-time override or blocked slot
const overrideSchema = new mongoose.Schema({
  date:       { type: Date,    required: true },
  start:      { type: String,  default: null },  // null = fully blocked
  end:        { type: String,  default: null },
  isBlocked:  { type: Boolean, default: false },
  reason:     { type: String,  default: "" },
}, { _id: false });

// Weekly recurring template — one entry per day 0–6
const weeklySlotSchema = new mongoose.Schema({
  day:      { type: Number, min: 0, max: 6, required: true },
  enabled:  { type: Boolean, default: false },
  slots:    [{ start: String, end: String }],  // e.g. [{start:"09:00",end:"17:00"}]
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  therapist:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  timezone:        { type: String, default: "Asia/Kolkata" },
  sessionDurations:{ type: [Number], default: [30, 45, 50, 60, 90] }, // minutes offered
  defaultDuration: { type: Number, default: 50 },
  bufferTime:      { type: Number, default: 10 }, // minutes between sessions
  weekly:          [weeklySlotSchema],
  overrides:       [overrideSchema],
}, { timestamps: true });

// Note: no manual index needed here — `unique: true` on the therapist field
// already creates a unique index on { therapist: 1 } automatically.
module.exports = mongoose.model("Availability", availabilitySchema);