const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema(
  {
    session:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    // SOAP / DAP format support
    format: {
      type: String,
      enum: ['soap', 'dap', 'free', 'progress'],
      default: 'soap',
    },

    // SOAP fields
    subjective:  { type: String, default: '' },
    objective:   { type: String, default: '' },
    assessment:  { type: String, default: '' },
    plan:        { type: String, default: '' },

    // DAP fields
    data:        { type: String, default: '' },
    // assessment is shared
    // plan is shared

    // Free-form / rich text (stored as HTML string from TipTap)
    content:     { type: String, default: '' },

    // Diagnosis
    diagnosisCodes: [{ type: String }], // ICD-10 codes

    // Homework / follow-up
    homework:   { type: String, default: '' },
    followUp:   { type: String, default: '' },

    // Mood / risk assessment
    clientMood:     { type: Number, min: 1, max: 10, default: null },
    riskLevel:      { type: String, enum: ['low', 'medium', 'high', 'crisis', null], default: null },
    suicidalIdeation: { type: Boolean, default: false },

    // Visibility — Module 5
    // 'private'  : only the therapist can see this note (default)
    // 'shared'   : client can also read this note via the client portal
    visibility: {
      type:    String,
      enum:    ['private', 'shared'],
      default: 'private',
    },

    // Signature / lock
    isSigned:   { type: Boolean, default: false },
    signedAt:   { type: Date, default: null },
    isLocked:   { type: Boolean, default: false }, // locked after signing
  },
  { timestamps: true }
);

sessionNoteSchema.index({ therapist: 1, createdAt: -1 });
sessionNoteSchema.index({ client: 1 });

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
