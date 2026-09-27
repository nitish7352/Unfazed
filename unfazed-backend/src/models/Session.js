const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    // Scheduling
    startTime:  { type: Date, required: true },
    endTime:    { type: Date, required: true },
    duration:   { type: Number, required: true }, // in minutes
    timezone:   { type: String, default: 'Asia/Kolkata' },

    // Session details
    type: {
      type: String,
      enum: ['initial', 'individual', 'couples', 'family', 'group', 'crisis', 'consultation'],
      default: 'individual',
    },
    modality: {
      type: String,
      enum: ['in_person', 'video', 'phone'],
      default: 'video',
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      default: 'scheduled',
    },

    // Billing
    rate:          { type: Number, required: true }, // amount charged
    currency:      { type: String, default: 'INR' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'waived', 'insurance'],
      default: 'pending',
    },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

    // Video/room
    roomId:   { type: String, default: null }, // Socket.io room ID
    joinLink: { type: String, default: null },

    // Notes (reference to SessionNote)
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionNote', default: null },

    // Cancellation
    cancelledBy:     { type: String, enum: ['therapist', 'client', 'system', null], default: null },
    cancellationReason: { type: String, default: null },
    cancelledAt:     { type: Date, default: null },

    // Reminder tracking
    reminderSent: { type: Boolean, default: false },

    recurringGroupId: { type: String, default: null }, // for recurring sessions
  },
  { timestamps: true }
);

sessionSchema.index({ therapist: 1, startTime: 1 });
sessionSchema.index({ client: 1, startTime: 1 });
sessionSchema.index({ therapist: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
