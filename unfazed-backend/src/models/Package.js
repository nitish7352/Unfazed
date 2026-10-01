const mongoose = require("mongoose");

const DISCOUNT_MAP  = { 3: 0.05, 6: 0.10, 12: 0.15 };
const VALIDITY_MAP  = { 3: 90,   6: 180,  12: 365  };

const packageSchema = new mongoose.Schema({
  therapist:        { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
  client:           { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  name:             { type: String, required: true },
  sessions_count:   { type: Number, enum: [3, 6, 12], required: true },
  per_session_rate: { type: Number, required: true },
  discount_pct:     { type: Number, required: true },
  total_price:      { type: Number, required: true },
  validity_days:    { type: Number, required: true },
  currency:         { type: String, default: "INR" },
  is_active:        { type: Boolean, default: true },
}, { timestamps: true });

packageSchema.statics.computePricing = function(sessions_count, per_session_rate) {
  const discount_pct  = (DISCOUNT_MAP[sessions_count]  || 0) * 100;
  const validity_days =  VALIDITY_MAP[sessions_count]  || 90;
  const total_price   = Math.round(per_session_rate * sessions_count * (1 - (DISCOUNT_MAP[sessions_count] || 0)));
  return { discount_pct, validity_days, total_price };
};

module.exports = mongoose.model("Package", packageSchema);