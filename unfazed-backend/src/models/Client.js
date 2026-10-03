const mongoose = require('mongoose');

const intakeFormSchema = new mongoose.Schema({
  presentingConcerns:   { type: String, default: '' },
  previousTherapy:      { type: Boolean, default: false },
  previousTherapyDetails: { type: String, default: '' },
  medications:          { type: String, default: '' },
  emergencyContact: {
    name:         { type: String, default: '' },
    relationship: { type: String, default: '' },
    phone:        { type: String, default: '' },
  },
  goals:                { type: String, default: '' },
  referralSource:       { type: String, default: '' },
  completedAt:          { type: Date, default: null },
}, { _id: false });

const clientSchema = new mongoose.Schema(
  {
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Basic info
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       { type: String, lowercase: true, trim: true, default: null },
    phone:       { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender:      { type: String, enum: ['male', 'female', 'non-binary', 'prefer_not_to_say', 'other'], default: 'prefer_not_to_say' },
    avatar:      { type: String, default: null },

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'discharged', 'waitlist', 'on_hold'],
      default: 'active',
    },

    // Session / billing defaults
    sessionRate:     { type: Number, default: null }, // override therapist default
    sessionDuration: { type: Number, default: null }, // in minutes

    // Insurance
    insurance: {
      provider:   { type: String, default: '' },
      memberId:   { type: String, default: '' },
      groupId:    { type: String, default: '' },
      copay:      { type: Number, default: 0 },
    },

    // Address
    address: {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      country: { type: String, default: 'India' },
      zip:     { type: String, default: '' },
    },

    timezone: { type: String, default: 'Asia/Kolkata' },

    // Intake
    intakeForm: { type: intakeFormSchema, default: () => ({}) },

    // Tags for quick filtering
    tags: [{ type: String }],

    notes: { type: String, default: '' }, // general notes visible to therapist only

    // Stats
    totalSessions:   { type: Number, default: 0 },
    totalAmountPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual: full name
clientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for therapist queries
clientSchema.index({ therapist: 1, status: 1 });
clientSchema.index({ therapist: 1, email: 1 });
clientSchema.index({ therapist: 1, user: 1 });

clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);
