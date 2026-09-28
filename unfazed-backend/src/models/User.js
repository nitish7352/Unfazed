const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true, minlength: 6, select: false },
    role:      { type: String, enum: ['therapist', 'admin'], default: 'therapist' },
    avatar:    { type: String, default: null },
    phone:     { type: String, default: null },
    isActive:  { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken:     { type: String, select: false },
    passwordResetExpires:   { type: Date, select: false },
    lastLogin: { type: Date, default: null },

    // Subscription
    subscription: {
      plan:      { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
      status:    { type: String, enum: ['active', 'inactive', 'cancelled', 'trial'], default: 'trial' },
      startDate: { type: Date, default: null },
      endDate:   { type: Date, default: null },
      razorpaySubscriptionId: { type: String, default: null },
      razorpayCustomerId:     { type: String, default: null },
    },

    // Notification preferences
    notifications: {
      email:   { type: Boolean, default: true },
      sms:     { type: Boolean, default: false },
      inApp:   { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password before save
// Mongoose 9 async pre-hooks: omit next() entirely, just return
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
