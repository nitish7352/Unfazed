const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  gateway_transaction_id: { type: String, required: true, unique: true },
  razorpay_order_id:      { type: String, required: true },
  therapist:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  client:     { type: mongoose.Schema.Types.ObjectId, ref: "Client",  required: true },
  session:    { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
  invoice:    { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null },
  gross_amount:  { type: Number, required: true },
  platform_fee:  { type: Number, default: 0 },
  net_amount:    { type: Number, default: 0 },
  currency:      { type: String, default: "INR" },
  status: {
    type: String,
    enum: ["created", "authorized", "captured", "failed", "refunded"],
    default: "created",
  },
  method: {
    type: String,
    enum: ["upi", "card", "netbanking", "wallet", "emi", "unknown"],
    default: "unknown",
  },
  webhook_verified: { type: Boolean, default: false },
  webhook_payload:  { type: mongoose.Schema.Types.Mixed, default: null },
  captured_at:      { type: Date, default: null },
}, { timestamps: true });

paymentSchema.index({ therapist: 1, createdAt: -1 });
paymentSchema.index({ razorpay_order_id: 1 });
module.exports = mongoose.model("Payment", paymentSchema);