const mongoose = require("mongoose");

const subscriptionTierConfigSchema = new mongoose.Schema({
  tier:        { type: String, enum: ["free", "basic", "pro", "enterprise"], required: true, unique: true },
  displayName: { type: String, required: true },
  price_monthly: { type: Number, required: true },  // INR
  caps: {
    max_active_clients: { type: Number, default: 5 },
    max_sessions_month: { type: Number, default: 20 },
    max_notes_per_session: { type: Number, default: 1 },
  },
  features: {
    analytics_depth:      { type: String, enum: ["basic","advanced","full"], default: "basic" },
    note_templates:       { type: [String], default: ["free"] },   // free, soap, dap, progress
    recurring_sessions:   { type: Boolean, default: false },
    pdf_exports:          { type: Boolean, default: false },
    csv_exports:          { type: Boolean, default: false },
    session_packages:     { type: Boolean, default: false },
    custom_branding:      { type: Boolean, default: false },
    priority_support:     { type: Boolean, default: false },
    client_portal:        { type: Boolean, default: false },
    chat:                 { type: Boolean, default: false },
  },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("SubscriptionTierConfig", subscriptionTierConfigSchema);