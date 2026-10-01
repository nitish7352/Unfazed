const ChatMessage = require('../models/ChatMessage');
const Client      = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc  Get chat history for a therapist-client pair
// @route GET /api/chat/:clientId
// @access Private
const getChatHistory = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { before, limit = 50 } = req.query;

  const client = await Client.findOne({ _id: clientId, therapist: req.user._id });
  if (!client) return errorResponse(res, 'Client not found', 404);

  const query = { therapist: req.user._id, client: clientId };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  // Return oldest-first for display
  return successResponse(res, { messages: messages.reverse() });
});

// @desc  Mark all unread messages in a room as read
// @route PUT /api/chat/:clientId/read
// @access Private
const markRoomRead = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const userId = req.user._id.toString();

  await ChatMessage.updateMany(
    { therapist: req.user._id, client: clientId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  return successResponse(res, {}, 'Marked as read');
});

// @desc  Get unread message counts per client for the therapist
// @route GET /api/chat/unread
// @access Private
const getUnreadCounts = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const counts = await ChatMessage.aggregate([
    {
      $match: {
        therapist: req.user._id,
        senderType: 'client',         // only messages FROM client
        readBy: { $ne: userId },      // not yet read by therapist
      },
    },
    { $group: { _id: '$client', count: { $sum: 1 } } },
  ]);

  // Convert to { clientId: count } map
  const map = {};
  counts.forEach((c) => { map[c._id.toString()] = c.count; });

  return successResponse(res, { unread: map });
});

module.exports = { getChatHistory, markRoomRead, getUnreadCounts };
