const mongoose = require('mongoose');

const therapistProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Professional info
    title:            { type: String, default: 'Licensed Clinical Psychologist' },
    qualification:    { type: String, default: 'M.Phil Clinical Psychology' },
    licenseNumber:    { type: String, default: null },
    licenseType:      { type: String, default: null }, // e.g. LPC, LCSW, PhD
    yearsExperience:  { type: Number, default: 0 },
    specializations:  [{ type: String }],
    languages:        [{ type: String, default: 'English' }],
    bio:              { type: String, maxlength: 2000, default: '' },
    isPublic:         { type: Boolean, default: true },
    isApproved:       { type: Boolean, default: true },
    sessionTypes:     [{ type: String }],
    modes:            [{ type: String, enum: ['online', 'video', 'in_person', 'audio', 'phone'] }],
    rating:           { type: Number, default: 5.0 },
    reviewCount:      { type: Number, default: 0 },

    // Practice info
    practiceName:     { type: String, default: null },
    practiceAddress: {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      country: { type: String, default: 'India' },
      zip:     { type: String, default: '' },
    },
    timezone:         { type: String, default: 'Asia/Kolkata' },
    currency:         { type: String, default: 'INR' },

    // Session defaults
    defaultSessionDuration: { type: Number, default: 50 }, // minutes
    defaultSessionRate:     { type: Number, default: 0 },  // in currency units

    // Working hours (array of 7 days, index 0=Sunday)
    workingHours: [
      {
        day:     { type: Number, min: 0, max: 6 },
        enabled: { type: Boolean, default: false },
        start:   { type: String, default: '09:00' },
        end:     { type: String, default: '17:00' },
      },
    ],

    // Social / contact
    website:   { type: String, default: null },
    linkedin:  { type: String, default: null },

    // Stats (denormalized for quick access)
    totalClients:  { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TherapistProfile', therapistProfileSchema);
