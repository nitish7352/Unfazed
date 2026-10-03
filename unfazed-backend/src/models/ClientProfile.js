const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer_not_to_say', 'other'],
      default: 'prefer_not_to_say',
    },
    phone: { type: String, default: null },
    address: {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      country: { type: String, default: 'India' },
      zip:     { type: String, default: '' },
    },
    emergencyContact: {
      name:         { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone:        { type: String, default: '' },
    },
    medicalHistory: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
