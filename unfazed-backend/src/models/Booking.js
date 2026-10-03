const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    client:     { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    clientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    therapist:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    session:    { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    invoice:    { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

    appointmentDate: { type: Date, required: true },
    startTime:       { type: Date, required: true },
    endTime:         { type: Date, required: true },
    duration:        { type: Number, default: 50 }, // in minutes

    sessionType: {
      type: String,
      enum: ['initial', 'individual', 'couples', 'family', 'group', 'crisis', 'consultation'],
      default: 'individual',
    },
    mode: {
      type: String,
      enum: ['online', 'video', 'in_person', 'audio', 'phone'],
      default: 'online',
    },

    fee:      { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'rescheduled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'refunded'],
      default: 'unpaid',
    },

    notes:              { type: String, default: '' },
    rejectionReason:    { type: String, default: '' },
    cancellationReason: { type: String, default: '' },
    cancelledBy:        { type: String, enum: ['client', 'therapist', 'system', null], default: null },

    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ therapist: 1, startTime: 1 });
bookingSchema.index({ clientUser: 1, startTime: 1 });
bookingSchema.index({ therapist: 1, status: 1 });
bookingSchema.index({ clientUser: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
