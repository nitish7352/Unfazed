const mongoose = require("mongoose");

const packagePurchaseSchema = new mongoose.Schema({
  package:            { type: mongoose.Schema.Types.ObjectId, ref: "Package",  required: true },
  client:             { type: mongoose.Schema.Types.ObjectId, ref: "Client",   required: true },
  therapist:          { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
  sessions_used:      { type: Number, default: 0 },
  sessions_remaining: { type: Number, required: true },
  expiry_date:        { type: Date,   required: true },
  payment_id:         { type: mongoose.Schema.Types.ObjectId, ref: "Payment",  default: null },
  status: {
    type: String,
    enum: ["active", "exhausted", "expired", "cancelled"],
    default: "active",
  },
}, { timestamps: true });

packagePurchaseSchema.index({ client: 1, status: 1 });
packagePurchaseSchema.index({ therapist: 1, status: 1 });
module.exports = mongoose.model("PackagePurchase", packagePurchaseSchema);