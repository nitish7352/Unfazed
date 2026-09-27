const User       = require('../models/User');
const Client     = require('../models/Client');
const Session    = require('../models/Session');
const Invoice    = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc  Get all users (therapists)
// @route GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const skip  = (page - 1) * limit;
  const query = {};
  if (role)   query.role  = role;
  if (search) {
    const r = new RegExp(search, 'i');
    query.$or = [{ firstName: r }, { lastName: r }, { email: r }];
  }
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);
  return paginatedResponse(res, users, total, page, limit);
});

// @desc  Get single user
// @route GET /api/admin/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { user });
});

// @desc  Update user (activate/deactivate, change plan)
// @route PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['isActive', 'role', 'subscription'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { user }, 'User updated');
});

// @desc  Platform-wide stats for admin dashboard
// @route GET /api/admin/stats
const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, totalClients, totalSessions, revenueData] = await Promise.all([
    User.countDocuments({ role: 'therapist' }),
    User.countDocuments({ role: 'therapist', isActive: true }),
    Client.countDocuments(),
    Session.countDocuments({ status: 'completed' }),
    Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  return successResponse(res, {
    totalUsers,
    activeUsers,
    totalClients,
    totalSessions,
    totalRevenue: revenueData[0]?.total || 0,
  });
});

module.exports = { getUsers, getUser, updateUser, getPlatformStats };
