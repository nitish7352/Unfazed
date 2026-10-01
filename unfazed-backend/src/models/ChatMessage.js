const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    // Room = therapist + client pair
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    client:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    senderId:   { type: String, required: true },  // ObjectId as string
    senderType: { type: String, enum: ['therapist', 'client'], required: true },

    text:          { type: String, default: '' },
    attachmentUrl: { type: String, default: null },

    readBy: [{ type: String }], // array of userId strings
  },
  { timestamps: true }
);

// Fast lookup for a room's history
chatMessageSchema.index({ therapist: 1, client: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
